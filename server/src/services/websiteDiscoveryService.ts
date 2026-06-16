import axios from 'axios';
import type { LeadCreateInput } from '../types/index.js';
import { env } from '../config/env.js';
// Puppeteer was removed — Phase 2 (DuckDuckGo) has been stripped.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERP_API_BASE = 'https://serpapi.com/search';
const PHASE1_MAX_SEARCHES = 10;
const SERPAPI_POLL_MS = 1100;


// ---------------------------------------------------------------------------
// Types extracted from raw_data JSON
// ---------------------------------------------------------------------------

interface RawDataFields {
  place_id?: string;
  links?: {
    website?: string;
    directions?: string;
    photos?: string;
  };
  gps_coordinates?: { lat: number; lng: number };
  cid?: string;
  thumbnail?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely parse the raw_data JSON string. */
function parseRawData(rawData: string | null | undefined): RawDataFields | null {
  if (!rawData) return null;
  try {
    return JSON.parse(rawData) as RawDataFields;
  } catch {
    return null;
  }
}

/**
 * Score a lead (0-10) to prioritise which ones get a paid SerpAPI place
 * enrichment call when they are missing a `page_url`.
 */
function scoreLead(lead: LeadCreateInput): number {
  let score = 0;
  if (lead.rating != null && lead.rating >= 3.5) score += 3;
  if (lead.review_count != null && lead.review_count > 0) score += 3;
  if (lead.phone) score += 2;
  if (lead.address) score += 1;
  if (lead.description) score += 1;
  return score;
}

/**
 * Phase 0 -- Extract hidden website & place_id from the existing raw_data
 * JSON that SerpAPI already returned but the main loop didn't map.
 *
 * Every lead is processed. If `links.website` exists and the lead has no
 * `page_url` yet, we populate it. `place_id` is kept at runtime for Phase 1.
 */
function applyPhase0(lead: LeadCreateInput): LeadCreateInput {
  const parsed = parseRawData(lead.raw_data);
  if (!parsed) return lead;

  if (!lead.page_url && parsed.links?.website) {
    return { ...lead, page_url: parsed.links.website };
  }

  return lead;
}

/**
 * Phase 1 -- Call SerpAPI with `type=place` for a specific `place_id` to
 * retrieve the richer place detail response that often contains a website
 * URL and additional contact info missing from the search result blob.
 */
async function enrichWithSerpApi(lead: LeadCreateInput): Promise<LeadCreateInput> {
  const parsed = parseRawData(lead.raw_data);
  const placeId = parsed?.place_id;
  if (!placeId) return lead;

  try {
    const response = await axios.get(SERP_API_BASE, {
      params: {
        api_key: env.SERPAPI_API_KEY,
        engine: 'google_maps',
        type: 'place',
        place_id: placeId,
        hl: 'en',
        gl: 'ng',
      },
      timeout: 15000,
    });

    // The place result lives under `data.place_result` when `type=place`
    const placeResult = response.data.place_result ?? response.data.result ?? response.data;
    if (!placeResult || typeof placeResult !== 'object') return lead;

    const updated = { ...lead };

    if (!updated.page_url && placeResult.website) {
      updated.page_url = placeResult.website;
    }
    if (!updated.phone && placeResult.phone) {
      updated.phone = placeResult.phone;
    }
    if (!updated.address && placeResult.address) {
      updated.address = placeResult.address;
    }

    // Scan for social media links in the place detail (e.g. `links` array)
    if (!updated.social_handle) {
      const socialHandle = extractSocialFromPlaceResult(placeResult);
      if (socialHandle) updated.social_handle = socialHandle;
    }

    return updated;
  } catch (err) {
    console.error(
      `[websiteDiscovery] Phase 1 SerpAPI enrichment failed for place_id ${placeId}:`,
      err instanceof Error ? err.message : err,
    );
    return lead;
  }
}

/** Very basic social-link extraction from a SerpAPI place result object. */
function extractSocialFromPlaceResult(result: Record<string, unknown>): string | null {
  const socialPatterns = [
    /facebook\.com\/([^/?\s"'>]+)/,
    /instagram\.com\/([^/?\s"'>]+)/,
    /linkedin\.com\/(company|in)\/([^/?\s"'>]+)/,
    /twitter\.com\/([^/?\s"'>]+)/,
  ];

  // Check links array if present
  const links: unknown[] = (result.links as unknown[]) ?? [];
  for (const link of links) {
    if (typeof link === 'string') {
      for (const pat of socialPatterns) {
        const m = link.match(pat);
        if (m) return m[0];
      }
    }
    if (link && typeof link === 'object') {
      const href = (link as Record<string, unknown>).href as string | undefined;
      if (href) {
        for (const pat of socialPatterns) {
          const m = href.match(pat);
          if (m) return m[0];
        }
      }
    }
  }

  // Also scan all string values of the result for social URLs
  for (const val of Object.values(result)) {
    if (typeof val === 'string') {
      for (const pat of socialPatterns) {
        const m = val.match(pat);
        if (m) return m[0];
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const websiteDiscoveryService = {
  /**
   * Two-phase enrichment pipeline that discovers website URLs for
   * Google Maps leads that arrived without a `page_url`.
   *
   * Phase 0 (free) -- Parse raw_data for hidden website / identifiers.
   * Phase 1 (paid) -- SerpAPI `type=place` enrichment (budgeted, max 10).
   *
   * Every phase fails gracefully; the returned array always has the same
   * length as the input (leads are returned unchanged on error).
   */
  async discoverWebsites(leads: LeadCreateInput[]): Promise<LeadCreateInput[]> {
    if (leads.length === 0) return [];

    console.log(`[websiteDiscovery] Starting enrichment for ${leads.length} leads`);

    // -----------------------------------------------------------------------
    // Phase 0 -- Extract from existing raw_data (free)
    // -----------------------------------------------------------------------
    console.log('[websiteDiscovery] Phase 0: Parsing raw_data for hidden fields');
    const results: LeadCreateInput[] = leads.map(applyPhase0);
    const withUrlsAfterPhase0 = results.filter((l) => l.page_url).length;
    const withoutUrlsAfterPhase0 = results.filter((l) => !l.page_url).length;
    console.log(
      `[websiteDiscovery] Phase 0 complete: ${withUrlsAfterPhase0} have URLs, ${withoutUrlsAfterPhase0} still missing`,
    );

    // -----------------------------------------------------------------------
    // Phase 1 -- SerpAPI place enrichment (paid, budgeted)
    // -----------------------------------------------------------------------
    const noUrlIndices: number[] = [];
    results.forEach((l, i) => {
      if (!l.page_url) noUrlIndices.push(i);
    });

    if (noUrlIndices.length > 0 && env.SERPAPI_API_KEY) {
      const budget = Math.min(PHASE1_MAX_SEARCHES, Math.ceil(noUrlIndices.length * 0.3));
      console.log(`[websiteDiscovery] Phase 1: Scoring ${noUrlIndices.length} leads, budget=${budget}`);

      // Score & sort, keeping only leads with a place_id
      const scored = noUrlIndices
        .map((idx) => ({
          idx,
          lead: results[idx],
          score: scoreLead(results[idx]),
          parsed: parseRawData(results[idx].raw_data),
        }))
        .filter((item) => item.parsed?.place_id)
        .sort((a, b) => b.score - a.score)
        .slice(0, budget);

      console.log(`[websiteDiscovery] Phase 1: Enriching top ${scored.length} leads via SerpAPI`);

      for (let i = 0; i < scored.length; i++) {
        const { idx, lead } = scored[i];
        const enriched = await enrichWithSerpApi(lead);
        if (enriched.page_url) {
          console.log(`[websiteDiscovery] Phase 1: Found URL for "${enriched.business_name}"`);
        }
        results[idx] = enriched;

        if (i < scored.length - 1) {
          await new Promise((r) => setTimeout(r, SERPAPI_POLL_MS));
        }
      }
    } else if (noUrlIndices.length > 0 && !env.SERPAPI_API_KEY) {
      console.log('[websiteDiscovery] Phase 1: Skipped (no SERPAPI_API_KEY configured)');
    }

    // ---------------------------------------------------------------
    // Phase 2 was DuckDuckGo via Puppeteer — removed. Leads without
    // a URL after Phase 0 + Phase 1 are returned as-is.
    // ---------------------------------------------------------------

    const finalWithUrls = results.filter((l) => l.page_url).length;
    console.log(`[websiteDiscovery] Complete: ${finalWithUrls}/${leads.length} leads have URLs`);

    return results;
  },
};
