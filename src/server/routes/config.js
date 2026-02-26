const { Router } = require('express');
const { z } = require('zod');
const { validateRequest } = require('../middleware/validateRequest');
const { createSuccessResponse, createErrorResponse } = require('../middleware/errorHandler');

const router = Router();

// 配置数据
const GAME_CONFIG = {
  GRID_SIZE: 5,
  MAX_TURNS: 72,
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

// 获取配置
router.get('/', (req, res) => {
  const hasApiKey = !!process.env.SILICONFLOW_API_KEY;
  
  res.json(createSuccessResponse({
    hasApiKey,
    defaultModel: 'Pro/MiniMaxAI/MiniMax-M2.5',
    availableModels: Object.values(AI_MODELS).map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      recommended: m.recommended
    })),
    availableIdentities: Object.values(IDENTITIES).map(i => ({
      id: i.id,
      name: i.name,
      description: `基础质量: ${i.baseMass}, 压强调制: ${i.pressureModifier}x`
    })),
    gameConfig: {
      maxTurns: GAME_CONFIG.MAX_TURNS,
      gridSize: GAME_CONFIG.GRID_SIZE
    }
  }));
});

module.exports = router;
