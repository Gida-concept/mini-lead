import axios from 'axios';
import type { LeadCreateInput, ScrapeInput } from '../types/index.js';
import {
  buildFacebookQuery,
  buildInstagramQuery,
  buildGoogleWebQuery,
  buildGoogleMapsSearchString,
} from './queryBuilder.js';
import { env } from '../config/env.js';
import { contactCrawler } from './contactCrawler.js';

type Source = 'facebook' | 'instagram' | 'google_web' | 'google_maps';

const SERP_API_BASE = 'https://serpapi.com/search';
const POLL_INTERVAL_MS = 1100;
const FREE_TIER_MAX_PAGES: Record<Source, number> = {
  facebook: 20,
  instagram: 20,
  google_web: 20,
  google_maps: 10,
};

async function callSerpApi(params: Record<string, unknown>): Promise<any> {
  const response = await axios.get(SERP_API_BASE, {
    params: {
      api_key: env.SERPAPI_API_KEY,
      ...params,
    },
    timeout: 15000,
  });
  return response.data;
}

async function scrapeGoogleSearch(
  source: Source,
  businessType: string,
  location: string,
  maxResults: number,
): Promise<LeadCreateInput[]> {
  let query: string;
  if (source === 'facebook') {
    query = buildFacebookQuery(businessType, location);
  } else if (source === 'instagram') {
    query = buildInstagramQuery(businessType, location);
  } else {
    query = buildGoogleWebQuery(businessType, location);
  }

  const resultsPerPage = 10;
  const maxPages = Math.min(
    Math.ceil(maxResults / resultsPerPage),
    FREE_TIER_MAX_PAGES[source],
  );
  const allResults: LeadCreateInput[] = [];
  let totalSeen = 0;

  for (let page = 0; page < maxPages; page++) {
    const data = await callSerpApi({
      engine: 'google',
      q: query,
      start: page * resultsPerPage,
      hl: 'en',
      gl: 'ng',
    });

    const organicResults: any[] = data.organic_results || [];
    if (organicResults.length === 0) break;

    for (const r of organicResults) {
      if (totalSeen >= maxResults) break;
      totalSeen++;

      const url = (r.link as string) || '';
      const title = (r.title as string) || '';
      if (!url && !title) continue;

      let businessName = title;
      let pageUrl = url;
      let socialHandle: string | null = null;

      if (source === 'facebook') {
        businessName = title.replace(/\s*\|\s*Facebook$/, '').trim();
        pageUrl = url;
      } else if (source === 'instagram') {
        const handleMatch = url.match(/instagram\.com\/([^/?]+)/);
        socialHandle = handleMatch ? `@${handleMatch[1]}` : null;
      }

      allResults.push({
        source,
        business_type: businessType,
        location,
        business_name: businessName,
        page_url: pageUrl,
        email: null,
        phone: null,
        address: null,
        rating: null,
        review_count: null,
        social_handle: socialHandle,
        description: (r.snippet as string) || null,
        raw_data: JSON.stringify(r),
        status: 'new',
      });
    }

    if (totalSeen >= maxResults) break;
    if (!data.serpapi_pagination?.next) break;

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  const enriched = await contactCrawler.enrich(allResults);
  return enriched.filter((l) => l.email || l.phone);
}

async function scrapeGoogleMaps(
  businessType: string,
  location: string,
  maxResults: number,
): Promise<LeadCreateInput[]> {
  const query = buildGoogleMapsSearchString(businessType, location);
  const resultsPerPage = 20;
  const maxPages = Math.min(
    Math.ceil(maxResults / resultsPerPage),
    FREE_TIER_MAX_PAGES.google_maps,
  );
  const allResults: LeadCreateInput[] = [];
  let totalSeen = 0;

  for (let page = 0; page < maxPages; page++) {
    const data = await callSerpApi({
      engine: 'google_maps',
      q: query,
      type: 'search',
      start: page * resultsPerPage,
      hl: 'en',
      gl: 'ng',
    });

    const localResults: any[] = data.local_results || [];
    if (localResults.length === 0) break;

    for (const r of localResults) {
      if (totalSeen >= maxResults) break;
      totalSeen++;

      const title = (r.title as string) || '';
      if (!title) continue;

      allResults.push({
        source: 'google_maps',
        business_type: businessType,
        location,
        business_name: title,
        page_url: (r.website as string) || null,
        email: null,
        phone: (r.phone as string) || null,
        address: (r.address as string) || null,
        rating: (r.rating as number) ?? null,
        review_count: (r.reviews as number) ?? null,
        social_handle: null,
        description: (r.type as string) || (r.description as string) || null,
        raw_data: JSON.stringify(r),
        status: 'new',
      });
    }

    if (totalSeen >= maxResults) break;
    if (!data.serpapi_pagination?.next) break;

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  const enriched = await contactCrawler.enrich(allResults);
  return enriched.filter((l) => l.email || l.phone);
}

export async function startAndWaitForRun(
  source: Source,
  input: ScrapeInput,
): Promise<LeadCreateInput[]> {
  if (!env.SERPAPI_API_KEY) {
    console.warn('[serpApiService] No SERPAPI_API_KEY configured. Returning empty results.');
    return [];
  }

  const { businessType, location, maxResults } = input;
  const cappedMax = Math.min(maxResults ?? 50, 200);

  console.log(
    `[serpApiService] Starting SerpAPI ${source} search for "${businessType}" in "${location}" (max: ${cappedMax})`,
  );

  try {
    if (source === 'google_maps') {
      return await scrapeGoogleMaps(businessType, location, cappedMax);
    }
    return await scrapeGoogleSearch(source, businessType, location, cappedMax);
  } catch (err) {
    console.error(`[serpApiService] ${source} failed:`, err);
    return [];
  }
}
