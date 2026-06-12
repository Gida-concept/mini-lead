import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import leadRoutes from './leads.js';
import scrapeRoutes from './scrape.js';
import exportRoutes from './export.js';
import statsRoutes from './stats.js';
import searchesRoutes from './searches.js';
import { ExportModel } from '../models/Export.js';
import { leadService } from '../services/leadService.js';

const router = Router();

const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).optional(),
  filter: z
    .object({
      source: z.string().optional(),
      location: z.string().optional(),
      businessType: z.string().optional(),
      status: z.string().optional(),
      hasEmail: z.coerce.boolean().optional(),
      hasPhone: z.coerce.boolean().optional(),
      minRating: z.coerce.number().optional(),
    })
    .optional(),
});

// Mount all route groups under /api/
router.use('/leads', leadRoutes);
router.use('/scrape', scrapeRoutes);
router.use('/export', exportRoutes);
router.use('/stats', statsRoutes);
router.use('/searches', searchesRoutes);

// GET /api/exports — List past exports
router.get('/exports', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const exports = ExportModel.findAll();
    res.json({ success: true, data: exports });
  } catch (err) {
    next(err);
  }
});

// POST /api/leads/bulk-delete — Added at index level to work around Express 5 nested router issue
router.post(
  '/leads/bulk-delete',
  validate(bulkDeleteSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, filter } = req.body;
      const deleted = await leadService.bulkDelete(ids, filter);
      res.json({
        success: true,
        data: { deleted },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
