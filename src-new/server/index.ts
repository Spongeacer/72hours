/**
 * 72Hours Game Server - TypeScript 版本
 * 遵循 RESTful API 规范
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/validateRequest';
import { createResponse } from './middleware/validateRequest';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

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
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(createResponse(null, {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试'
      }
    }));
  }
});
app.use(limiter);

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static('public'));

// ==================== 路由 ====================

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json(createResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  }));
});

// 根路径
app.get('/', (req, res) => {
  res.sendFile('public/game.html', { root: '.' });
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

export default app;
