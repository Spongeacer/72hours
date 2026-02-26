/**
 * 72Hours Game Server v2.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const routes = require('./routes/index');
const { errorHandler, notFoundHandler, createSuccessResponse } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== 中间件 ====================

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(2, 15)
      }
    });
  }
});
app.use(limiter);

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static('public'));
app.use(express.static('dist/client'));

// ==================== 路由 ====================

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json(createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  }));
});

// 根路径 - 返回前端
app.get('/', (req, res) => {
  res.sendFile('dist/client/index.html', { root: '.' });
});

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// ==================== 启动 ====================

app.listen(PORT, () => {
  console.log(`72Hours Server v2.0.0 running on port ${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
