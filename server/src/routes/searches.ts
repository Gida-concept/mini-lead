import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { searchService } from '../services/searchService.js';

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// GET /api/searches — List search history
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as any).parsedQuery;
      const result = await searchService.getSearches({
        page: query.page,
        limit: query.limit,
      });

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/searches/:id — Get single search
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req as any).parsedParams;
      const search = await searchService.getSearch(id);
      res.json({ success: true, data: search });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
