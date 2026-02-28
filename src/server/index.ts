/**
 * 72Hours Game Server - TypeScript
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import routes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 信任代理（解决 rate-limit 的 X-Forwarded-For 警告）
app.set('trust proxy', 1);

// ==================== 中间件 ====================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.siliconflow.cn"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// ==================== 路由 ====================

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    },
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 15)
    }
  });
});

app.get('/', (_req, res) => {
  res.sendFile('public/index.html', { root: '.' });
});

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== 启动 ====================

app.listen(PORT, () => {
  console.log(`72Hours Server v2.0.0 running on port ${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
});

export default app;
