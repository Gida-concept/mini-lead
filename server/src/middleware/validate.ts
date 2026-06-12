import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);

      if (target === 'query') {
        // Replace query params with parsed values (coerced types)
        (req as any).parsedQuery = parsed;
      } else if (target === 'params') {
        (req as any).parsedParams = parsed;
      } else {
        req.body = parsed;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(
          new AppError(400, 'VALIDATION_ERROR', 'Request validation failed'),
        );
      } else {
        next(err);
      }
    }
  };
}
