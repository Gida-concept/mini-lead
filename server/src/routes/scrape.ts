import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { searchService } from '../services/searchService.js';
import { startAndWaitForRun } from '../services/apifyService.js';
import { leadService } from '../services/leadService.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

const scrapeBodySchema = z.object({
  businessType: z.string().min(1, 'businessType is required'),
  location: z.string().min(1, 'location is required'),
  maxResults: z.coerce.number().int().positive().max(200).optional(),
});

const sourceParamSchema = z.object({
  source: z.enum(['facebook', 'instagram', 'google-web', 'google-maps']),
});

const ESTIMATED_TIMES: Record<string, number> = {
  facebook: 60,
  instagram: 60,
  'google-web': 90,
  'google-maps': 120,
};

function mapRouteSource(source: string): string {
  const mapping: Record<string, string> = {
    facebook: 'facebook',
    instagram: 'instagram',
    'google-web': 'google_web',
    'google-maps': 'google_maps',
  };
  return mapping[source] || source;
}

// POST /api/scrape/:source
router.post(
  '/:source',
  validate(sourceParamSchema, 'params'),
  validate(scrapeBodySchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source } = (req as any).parsedParams;
      const { businessType, location, maxResults } = req.body;

      const dbSource = mapRouteSource(source) as 'facebook' | 'instagram' | 'google_web' | 'google_maps';

      // Create search record
      const search = await searchService.createSearch({
        source: dbSource,
        query_params: JSON.stringify({ businessType, location, maxResults }),
        run_status: 'running',
      });

      // Fire and forget — run in background
      (async () => {
        try {
          const results = await startAndWaitForRun(dbSource, {
            businessType,
            location,
            maxResults,
          });

          const count = await leadService.bulkInsertFromScrape(results, dbSource);

          await searchService.updateSearch(search.id, 'completed', count);
          console.log(`[scrape] ${dbSource} completed: ${count} new leads inserted`);
        } catch (err) {
          console.error(`[scrape] ${dbSource} failed:`, err);
          try {
            await searchService.updateSearch(search.id, 'failed');
          } catch {
            // ignore cleanup errors
          }
        }
      })();

      // Return 202 immediately
      res.status(202).json({
        success: true,
        data: {
          searchId: search.id,
          source: dbSource,
          status: 'running',
          message: `Scrape job started. Poll GET /searches/${search.id} for status.`,
          estimatedTimeSeconds: ESTIMATED_TIMES[source] || 60,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
