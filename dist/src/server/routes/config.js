"use strict";
/**
 * 配置路由
 * 提供游戏配置信息
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GameConfig_1 = require("../../config/GameConfig");
const apiResponse_1 = require("../utils/apiResponse");
const router = (0, express_1.Router)();
/**
 * 获取游戏配置
 * GET /api/config
 */
router.get('/', (_req, res) => {
    const hasApiKey = !!process.env.SILICONFLOW_API_KEY;
    res.json((0, apiResponse_1.createSuccessResponse)({
        hasApiKey,
        defaultModel: GameConfig_1.AI_CONFIG.DEFAULT_PARAMS.model,
        availableModels: Object.values(GameConfig_1.AI_CONFIG.PROVIDERS).map(provider => ({
            id: provider.defaultModel,
            name: provider.name,
            description: 'AI模型',
            recommended: true
        })),
        availableIdentities: Object.entries(GameConfig_1.PLAYER_CONFIG.IDENTITIES).map(([id, identity]) => ({
            id,
            name: identity.name,
            description: `基础质量: ${identity.baseMass}`
        })),
        gameConfig: {
            maxTurns: GameConfig_1.GAME_CONFIG.MAX_TURNS,
            startDate: GameConfig_1.GAME_CONFIG.START_DATE
        }
    }));
});
exports.default = router;
//# sourceMappingURL=config.js.map