"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
function notFoundHandler(req, res) {
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
function errorHandler(err, _req, res, _next) {
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
//# sourceMappingURL=errorHandler.js.map