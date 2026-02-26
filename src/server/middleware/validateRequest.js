/**
 * 请求验证中间件
 */

const { z } = require('zod');

/**
 * 验证请求中间件
 */
function validateRequest(schemas) {
  return (req, res, next) => {
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
      if (error instanceof z.ZodError) {
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
            requestId: Math.random().toString(36).substring(2, 15)
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
          requestId: Math.random().toString(36).substring(2, 15)
        }
      });
    }
  };
}

module.exports = { validateRequest };
