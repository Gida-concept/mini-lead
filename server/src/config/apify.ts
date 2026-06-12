import { ApifyClient } from 'apify-client';
import { env } from './env.js';

const APIFY_PLACEHOLDERS = ['your_apify_api_token_here', 'your_apify_api_token', ''];

let apifyClient: ApifyClient | null = null;

if (APIFY_PLACEHOLDERS.includes(env.APIFY_TOKEN)) {
  console.warn(
    '[apify] APIFY_TOKEN is not configured. Set a valid Apify API token in .env to enable scraping. ' +
    'Scrape endpoints will return empty results.',
  );
} else {
  apifyClient = new ApifyClient({ token: env.APIFY_TOKEN });
}

export { apifyClient };
