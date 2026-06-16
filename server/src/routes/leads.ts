import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { leadService } from '../services/leadService.js';
import type { LeadFilters } from '../types/index.js';

const router = Router();

// Zod schemas
const listQuerySchema = z.object({
  source: z.string().optional(),
  location: z.string().optional(),
  businessType: z.string().optional(),
  status: z.string().optional(),
  hasEmail: z.coerce.boolean().optional(),
  hasPhone: z.coerce.boolean().optional(),
  minRating: z.coerce.number().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sortBy: z.string().default('created_at'),
  sortOrder: z.string().default('desc'),
});

const createBodySchema = z.object({
  source: z.enum(['google_maps']),
  business_type: z.string().min(1),
  location: z.string().min(1),
  business_name: z.string().optional().nullable(),
  page_url: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  review_count: z.number().int().optional().nullable(),
  social_handle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['new', 'contacted', 'qualified', 'rejected']).optional(),
});

const updateBodySchema = z.object({
  business_name: z.string().optional().nullable(),
  page_url: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  review_count: z.number().int().optional().nullable(),
  social_handle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['new', 'contacted', 'qualified', 'rejected']).optional(),
});

const bulkStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: z.enum(['new', 'contacted', 'qualified', 'rejected']),
});

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

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// GET /api/leads — List leads
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as any).parsedQuery;

      const filters: LeadFilters = {
        source: query.source,
        location: query.location,
        businessType: query.businessType,
        status: query.status,
        hasEmail: query.hasEmail,
        hasPhone: query.hasPhone,
        minRating: query.minRating,
        q: query.q,
      };

      const result = await leadService.getLeads(
        filters,
        { page: query.page, limit: query.limit },
        { sortBy: query.sortBy, sortOrder: query.sortOrder },
      );

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

// POST /api/leads — Create lead
router.post(
  '/',
  validate(createBodySchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await leadService.createLead(req.body);
      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/leads/bulk-status — Bulk update status
router.post(
  '/bulk-status',
  validate(bulkStatusSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, status } = req.body;
      const updated = await leadService.bulkUpdateStatus(ids, status);
      res.json({
        success: true,
        data: { updated, status },
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/leads/:id — Get single lead
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req as any).parsedParams;
      const lead = await leadService.getLead(id);
      res.json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/leads/:id — Update lead
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateBodySchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req as any).parsedParams;
      const lead = await leadService.updateLead(id, req.body);
      res.json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/leads/:id — Delete lead
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = (req as any).parsedParams;
      await leadService.deleteLead(id);
      res.json({ success: true, data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
