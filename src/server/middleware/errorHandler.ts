import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.path} 不存在`
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  
  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message: err.message || '服务器内部错误'
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
}
