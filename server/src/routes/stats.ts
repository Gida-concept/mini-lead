import { Router, Request, Response, NextFunction } from 'express';
import { statsService } from '../services/statsService.js';

const router = Router();

// GET /api/stats/overview
router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await statsService.getOverview();
    res.json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/recent
router.get('/recent', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const recent = await statsService.getRecent();
    res.json({ success: true, data: recent });
  } catch (err) {
    next(err);
  }
});

export default router;
