import axios from 'axios';
import type { LeadCreateInput, ScrapeInput } from '../types/index.js';
import { buildMapsSearchString } from './queryBuilder.js';
import { env } from '../config/env.js';
// contactCrawler removed — Puppeteer stripped from pipeline.
import { websiteDiscoveryService } from './websiteDiscoveryService.js';

const SERP_API_BASE = 'https://serpapi.com/search';
const POLL_INTERVAL_MS = 1100;

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

async function scrapeGoogleMaps(
  businessType: string,
  location: string,
  maxResults: number,
): Promise<LeadCreateInput[]> {
  const query = buildMapsSearchString(businessType, location);
  const resultsPerPage = 20;
  const maxPages = Math.min(
    Math.ceil(maxResults / resultsPerPage),
    10,
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

  // Website discovery for leads without URLs
  const discovered = await websiteDiscoveryService.discoverWebsites(allResults);
  return discovered;
}

export async function startAndWaitForRun(
  _source: string,
  input: ScrapeInput,
): Promise<LeadCreateInput[]> {
  if (!env.SERPAPI_API_KEY) {
    console.warn('[serpApiService] No SERPAPI_API_KEY configured. Returning empty results.');
    return [];
  }

  const { businessType, location, maxResults } = input;
  const cappedMax = Math.min(maxResults ?? 50, 200);

  console.log(
    `[serpApiService] Starting SerpAPI google_maps search for "${businessType}" in "${location}" (max: ${cappedMax})`,
  );

  try {
    return await scrapeGoogleMaps(businessType, location, cappedMax);
  } catch (err) {
    console.error('[serpApiService] google_maps failed:', err);
    return [];
  }
}
