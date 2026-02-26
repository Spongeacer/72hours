"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const GAME_CONFIG = {
    GRID_SIZE: 5,
    MAX_TURNS: 36,
    START_DATE: '1851-01-08T00:00:00',
};
const IDENTITIES = {
    scholar: { id: 'scholar', name: '村中的读书人', baseMass: 3, pressureModifier: 0.8 },
    landlord: { id: 'landlord', name: '金田村的地主', baseMass: 6, pressureModifier: 1.0 },
    soldier: { id: 'soldier', name: '官府的士兵', baseMass: 5, pressureModifier: 1.2 },
    cultist: { id: 'cultist', name: '教会的受众', baseMass: 4, pressureModifier: 1.0 }
};
const AI_MODELS = {
    MINIMAX: { id: 'Pro/MiniMaxAI/MiniMax-M2.5', name: 'MiniMax-M2.5', description: '速度快', recommended: true },
    DEEPSEEK: { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek-V3.2', description: '质量好，较慢', recommended: false }
};
router.get('/', (req, res) => {
    const hasApiKey = !!process.env.SILICONFLOW_API_KEY;
    res.json({
        success: true,
        data: {
            hasApiKey,
            defaultModel: 'Pro/MiniMaxAI/MiniMax-M2.5',
            availableModels: Object.values(AI_MODELS).map((m) => ({
                id: m.id,
                name: m.name,
                description: m.description,
                recommended: m.recommended
            })),
            availableIdentities: Object.values(IDENTITIES).map((i) => ({
                id: i.id,
                name: i.name,
                description: `基础质量: ${i.baseMass}, 压强调制: ${i.pressureModifier}x`
            })),
            gameConfig: {
                maxTurns: GAME_CONFIG.MAX_TURNS,
                gridSize: GAME_CONFIG.GRID_SIZE
            }
        },
        error: null,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: Math.random().toString(36).substring(2, 15)
        }
    });
});
exports.default = router;
//# sourceMappingURL=config.js.map