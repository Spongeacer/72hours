"use strict";
/**
 * 请求验证 Schemas
 * 使用 Zod 定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSchemas = exports.saveSchemas = exports.gameSchemas = exports.saveIdSchema = exports.gameIdSchema = exports.modelSchema = exports.identitySchema = void 0;
const zod_1 = require("zod");
// ==================== 基础 Schemas ====================
exports.identitySchema = zod_1.z.enum(['scholar', 'landlord', 'soldier', 'cultist']);
exports.modelSchema = zod_1.z.enum([
    'Pro/MiniMaxAI/MiniMax-M2.5',
    'deepseek-ai/DeepSeek-V3.2'
]);
exports.gameIdSchema = zod_1.z.string().regex(/^game_[a-z0-9_]+$/, '无效的游戏ID格式');
exports.saveIdSchema = zod_1.z.string().regex(/^save_[a-z0-9_]+$/, '无效的存档ID格式');
// ==================== 游戏 Schemas ====================
exports.gameSchemas = {
    // 创建游戏
    createGame: zod_1.z.object({
        body: zod_1.z.object({
            identity: exports.identitySchema,
            model: exports.modelSchema,
            apiKey: zod_1.z.string().optional()
        }),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({})
    }),
    // 游戏ID参数
    gameId: zod_1.z.object({
        body: zod_1.z.object({}).optional(),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({
            gameId: exports.gameIdSchema
        })
    }),
    // 执行回合
    executeTurn: zod_1.z.object({
        body: zod_1.z.object({
            choice: zod_1.z.object({
                id: zod_1.z.string(),
                text: zod_1.z.string()
            }).optional()
        }),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({
            gameId: exports.gameIdSchema
        })
    })
};
// ==================== 存档 Schemas ====================
exports.saveSchemas = {
    // 创建存档
    createSave: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().max(50).optional()
        }),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({
            gameId: exports.gameIdSchema
        })
    }),
    // 存档ID参数
    saveId: zod_1.z.object({
        body: zod_1.z.object({}).optional(),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({
            gameId: exports.gameIdSchema,
            saveId: exports.saveIdSchema
        })
    }),
    // 导入存档
    importSave: zod_1.z.object({
        body: zod_1.z.object({
            saveData: zod_1.z.string().min(1, '存档数据不能为空')
        }),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({
            gameId: exports.gameIdSchema
        })
    })
};
// ==================== 配置 Schemas ====================
exports.configSchemas = {
    getConfig: zod_1.z.object({
        body: zod_1.z.object({}).optional(),
        query: zod_1.z.object({}).optional(),
        params: zod_1.z.object({})
    })
};
//# sourceMappingURL=gameSchemas.js.map