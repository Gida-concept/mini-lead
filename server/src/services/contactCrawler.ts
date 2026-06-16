import type { LeadCreateInput } from '../types/index.js';

/**
 * Contact crawler — currently a passthrough.
 *
 * Puppeteer has been removed from this pipeline. Google Maps data (phone,
 * address, rating, etc.) arrives directly from SerpAPI, and the 3-phase
 * website discovery pipeline enriches leads with URLs extracted from raw
 * SerpAPI data (Phase 0) and place-detail API calls (Phase 1).
 *
 * A separate custom email/social extraction tool can be plugged in later.
 */
export const contactCrawler = {
  async enrich(leads: LeadCreateInput[]): Promise<LeadCreateInput[]> {
    return leads; // passthrough — no-op
  },
};
