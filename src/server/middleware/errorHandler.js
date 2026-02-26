/**
 * 错误处理中间件
 */

/**
 * 创建成功响应
 */
function createSuccessResponse(data) {
  return {
    success: true,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  };
}

/**
 * 创建错误响应
 */
function createErrorResponse(code, message) {
  return {
    success: false,
    data: null,
    error: { code, message },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  };
}

/**
 * 404 处理
 */
function notFoundHandler(req, res) {
  res.status(404).json(createErrorResponse('NOT_FOUND', `路径 ${req.path} 不存在`));
}

/**
 * 错误处理
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  
  res.status(statusCode).json(createErrorResponse(errorCode, err.message || '服务器内部错误'));
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  notFoundHandler,
  errorHandler
};
