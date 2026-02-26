/**
 * 请求验证中间件
 * 使用 Zod 进行运行时类型检查
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse, ApiError, ErrorCode, HttpStatus } from '../types/api';

/**
 * 创建统一响应
 */
export function createResponse<T>(
  data: T,
  meta?: { pagination?: { page: number; limit: number; total: number } }
): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...(meta?.pagination && {
        pagination: {
          ...meta.pagination,
          totalPages: Math.ceil(meta.pagination.total / meta.pagination.limit)
        }
      })
    }
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 验证请求中间件
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 验证请求体、查询参数和路由参数
      const data = {
        body: req.body,
        query: req.query,
        params: req.params
      };

      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        res.status(HttpStatus.BAD_REQUEST).json(
          createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            '请求参数验证失败',
            { errors: details }
          )
        );
        return;
      }

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(
          ErrorCode.UNKNOWN_ERROR,
          '未知错误'
        )
      );
    }
  };
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // 自定义错误
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      createErrorResponse(err.code, err.message, err.details)
    );
    return;
  }

  // 默认服务器错误
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
    createErrorResponse(
      ErrorCode.UNKNOWN_ERROR,
      '服务器内部错误'
    )
  );
}

/**
 * 自定义应用错误
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(HttpStatus.NOT_FOUND).json(
    createErrorResponse(
      ErrorCode.UNKNOWN_ERROR,
      `路径 ${req.path} 不存在`
    )
  );
}
