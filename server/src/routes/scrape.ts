import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { searchService } from '../services/searchService.js';
import { startAndWaitForRun } from '../services/serpApiService.js';
import { leadService } from '../services/leadService.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

const scrapeBodySchema = z.object({
  businessType: z.string().min(1, 'businessType is required'),
  location: z.string().min(1, 'location is required'),
  maxResults: z.coerce.number().int().positive().max(200).optional(),
});

const sourceParamSchema = z.object({
  source: z.enum(['google_maps']),
});

const ESTIMATED_TIMES: Record<string, number> = {
  google_maps: 120,
};

// POST /api/scrape/:source
router.post(
  '/:source',
  validate(sourceParamSchema, 'params'),
  validate(scrapeBodySchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source } = (req as any).parsedParams;

      // Create search record
      const search = await searchService.createSearch({
        source,
        query_params: JSON.stringify({ businessType: req.body.businessType, location: req.body.location, maxResults: req.body.maxResults }),
        run_status: 'running',
      });

      // Fire and forget — run in background
      (async () => {
        try {
          const results = await startAndWaitForRun(source, {
            businessType: req.body.businessType,
            location: req.body.location,
            maxResults: req.body.maxResults,
          });

          const count = await leadService.bulkInsertFromScrape(results, source);

          await searchService.updateSearch(search.id, 'completed', count);
          console.log(`[scrape] google_maps completed: ${count} new leads inserted`);
        } catch (err) {
          console.error('[scrape] google_maps failed:', err);
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
          source,
          status: 'running',
          message: `Scrape job started. Poll GET /searches/${search.id} for status.`,
          estimatedTimeSeconds: ESTIMATED_TIMES[source] || 120,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
