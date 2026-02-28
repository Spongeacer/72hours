import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { randomUUID } from 'crypto';

interface ValidateSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidateSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        schemas.body.parse(req.body);
      }
      if (schemas.query) {
        schemas.query.parse(req.query);
      }
      if (schemas.params) {
        schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数验证失败',
            details
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: randomUUID()
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: '验证过程出错'
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: randomUUID()
        }
      });
    }
  };
}
