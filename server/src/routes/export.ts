import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { exportCsv } from '../services/csvExporter.js';
import { exportJson } from '../services/jsonExporter.js';
import { ExportModel } from '../models/Export.js';
import type { LeadFilters } from '../types/index.js';

const router = Router();

const exportQuerySchema = z.object({
  source: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  businessType: z.string().optional(),
  hasEmail: z.coerce.boolean().optional(),
  hasPhone: z.coerce.boolean().optional(),
});

// GET /api/export/csv
router.get(
  '/csv',
  validate(exportQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as any).parsedQuery;
      const filters: LeadFilters = {
        source: query.source,
        status: query.status,
        location: query.location,
        businessType: query.businessType,
        hasEmail: query.hasEmail,
        hasPhone: query.hasPhone,
      };

      await exportCsv(filters, res);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/export/json
router.get(
  '/json',
  validate(exportQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as any).parsedQuery;
      const filters: LeadFilters = {
        source: query.source,
        status: query.status,
        location: query.location,
        businessType: query.businessType,
        hasEmail: query.hasEmail,
        hasPhone: query.hasPhone,
      };

      await exportJson(filters, res);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
