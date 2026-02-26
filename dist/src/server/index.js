"use strict";
/**
 * 72Hours Game Server - TypeScript
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./routes/index"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ==================== 中间件 ====================
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = (0, express_rate_limit_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
app.use(express_1.default.static('dist/client'));
// ==================== 路由 ====================
app.use('/api', index_1.default);
app.get('/health', (req, res) => {
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
app.get('/', (req, res) => {
    res.sendFile('dist/client/index.html', { root: '.' });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// ==================== 启动 ====================
app.listen(PORT, () => {
    console.log(`72Hours Server v2.0.0 running on port ${PORT}`);
    console.log(`API Endpoint: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map