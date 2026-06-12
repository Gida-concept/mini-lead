import { apifyClient } from '../config/apify.js';
import type { LeadCreateInput, ScrapeInput } from '../types/index.js';
import {
  buildFacebookQuery,
  buildInstagramQuery,
  buildGoogleWebQuery,
  buildGoogleMapsSearchString,
} from './queryBuilder.js';

type Source = 'facebook' | 'instagram' | 'google_web' | 'google_maps';

const ACTOR_IDS: Record<Source, string> = {
  facebook: 'apify/google-search-scraper',
  instagram: 'apify/google-search-scraper',
  google_web: 'apify/google-search-scraper',
  google_maps: 'leadsbrary/google-maps-email-extractor',
};

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS: Record<Source, number> = {
  facebook: 5 * 60 * 1000,
  instagram: 5 * 60 * 1000,
  google_web: 5 * 60 * 1000,
  google_maps: 10 * 60 * 1000,
};

function buildActorInput(source: Source, input: ScrapeInput): Record<string, unknown> {
  const { businessType, location, maxResults } = input;
  const cappedMax = Math.min(maxResults ?? 50, 200);

  if (source === 'google_maps') {
    return {
      searchStringsArray: [buildGoogleMapsSearchString(businessType, location)],
      countryCode: 'ng',
      language: 'en',
      maxCrawledPlaces: cappedMax,
      maxImages: 0,
      includeWebResults: false,
      scrapeContacts: true,
      scrapeReviews: false,
      scrapeTablePrices: false,
      scrapeMenus: false,
      scrapePlaceDetailPage: true,
      scrapeDirectionsPage: false,
    };
  }

  // For facebook, instagram, google_web — use Google Search Scraper
  let query: string;
  if (source === 'facebook') {
    query = buildFacebookQuery(businessType, location);
  } else if (source === 'instagram') {
    query = buildInstagramQuery(businessType, location);
  } else {
    query = buildGoogleWebQuery(businessType, location);
  }

  const maxPagesPerQuery = Math.max(1, Math.ceil(cappedMax / 10));

  return {
    queries: [query],
    resultsPerPage: 10,
    maxPagesPerQuery,
    languageCode: 'en',
    countryCode: 'ng',
    mobileResults: false,
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
    includeAds: false,
    parallelQueries: 1,
  };
}

function transformGoogleSearchResult(item: Record<string, unknown>, source: Source): LeadCreateInput | null {
  const title = (item.title as string) || '';
  const url = (item.url as string) || '';
  const description = (item.description as string) || '';

  if (!title && !url) return null;

  let businessName: string | null = title;
  let socialHandle: string | null = null;
  let pageUrl: string | null = url;

  if (source === 'facebook') {
    // Extract page name from title
    businessName = title.replace(/\s*\|\s*Facebook$/, '').trim() || null;
    pageUrl = url || null;
  } else if (source === 'instagram') {
    // Extract handle from URL
    const handleMatch = url.match(/instagram\.com\/([^/?]+)/);
    socialHandle = handleMatch ? `@${handleMatch[1]}` : null;
    businessName = title || null;
    pageUrl = url || null;
  }

  return {
    source,
    business_type: '',
    location: '',
    business_name: businessName,
    page_url: pageUrl,
    email: null,
    phone: null,
    address: null,
    rating: null,
    review_count: null,
    social_handle: socialHandle,
    description: description || null,
    raw_data: JSON.stringify(item),
    status: 'new',
  };
}

function transformGoogleMapsResult(place: Record<string, unknown>): LeadCreateInput | null {
  if (!place || !place.title) return null;

  return {
    source: 'google_maps',
    business_type: '',
    location: '',
    business_name: (place.title as string) || null,
    page_url: (place.website as string) || (place.url as string) || null,
    email: Array.isArray(place.emails) && place.emails.length > 0
      ? (place.emails[0] as string)
      : null,
    phone: (place.phone as string) || null,
    address: (place.address as string) || null,
    rating: (place.totalScore as number) ?? null,
    review_count: (place.reviewsCount as number) ?? null,
    social_handle: null,
    description: (place.description as string) || (place.subTitle as string) || null,
    raw_data: JSON.stringify(place),
    status: 'new',
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startAndWaitForRun(
  source: Source,
  input: ScrapeInput,
): Promise<LeadCreateInput[]> {
  if (!apifyClient) {
    console.warn('[apifyService] No Apify client available. Returning empty results.');
    return [];
  }

  const actorId = ACTOR_IDS[source];
  const actorInput = buildActorInput(source, input);
  const timeout = TIMEOUT_MS[source];

  console.log(`[apifyService] Starting actor ${actorId} for ${source} with query:`, JSON.stringify(actorInput).slice(0, 200));

  let run;
  try {
    run = await apifyClient.actor(actorId).start(actorInput);
    console.log(`[apifyService] Run started: ${run.id}`);
  } catch (err) {
    console.error(`[apifyService] Failed to start actor run:`, err);
    return [];
  }

  // Poll for completion
  const startTime = Date.now();
  let lastStatus: string | undefined;

  while (Date.now() - startTime < timeout) {
    try {
      const currentRun = await apifyClient.run(run.id).get();
      if (!currentRun) {
        console.warn(`[apifyService] Run ${run.id} not found`);
        break;
      }

      lastStatus = currentRun.status;

      const runStatus = currentRun.status as string;
      if (runStatus === 'SUCCEEDED') {
        console.log(`[apifyService] Run ${run.id} completed successfully`);

        // Fetch results
        const datasetId = currentRun.defaultDatasetId;
        if (!datasetId) {
          console.warn(`[apifyService] No dataset ID for run ${run.id}`);
          return [];
        }

        const { items } = await apifyClient.dataset(datasetId).listItems();
        console.log(`[apifyService] Fetched ${items.length} items from dataset`);

        // Transform results
        if (source === 'google_maps') {
          return items.map((item: any) => transformGoogleMapsResult(item)).filter(Boolean) as LeadCreateInput[];
        }

        return items.map((item: any) => transformGoogleSearchResult(item, source)).filter(Boolean) as LeadCreateInput[];
      }

      const runStatus2 = currentRun.status as string;
      if (runStatus2 === 'FAILED' || runStatus2 === 'TIMED-OUT' || runStatus2 === 'ABORTED') {
        console.error(`[apifyService] Run ${run.id} ended with status: ${currentRun.status}`);
        return [];
      }

      console.log(`[apifyService] Run ${run.id} status: ${currentRun.status}, waiting...`);
    } catch (err) {
      console.error(`[apifyService] Error polling run ${run.id}:`, err);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  console.warn(`[apifyService] Run ${run.id} timed out after ${timeout}ms (last status: ${lastStatus})`);

  // Try to fetch partial results on timeout
  try {
    const currentRun = await apifyClient.run(run.id).get();
    if (currentRun?.defaultDatasetId) {
      const { items } = await apifyClient.dataset(currentRun.defaultDatasetId).listItems();
      if (items.length > 0) {
        console.log(`[apifyService] Returning ${items.length} partial results from timed-out run`);
        if (source === 'google_maps') {
          return items.map((item: any) => transformGoogleMapsResult(item)).filter(Boolean) as LeadCreateInput[];
        }
        return items.map((item: any) => transformGoogleSearchResult(item, source)).filter(Boolean) as LeadCreateInput[];
      }
    }
  } catch {
    // Ignore errors when fetching partial results
  }

  return [];
}
