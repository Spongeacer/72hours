import { Router } from 'express';
import { createSuccessResponse } from '../types/api';
import { GAME_CONFIG, AI_MODELS, IDENTITIES } from '../../utils/Constants';

const router = Router();

// 获取配置
router.get('/', (req, res) => {
  const hasApiKey = !!process.env.SILICONFLOW_API_KEY;
  
  res.json(createSuccessResponse({
    hasApiKey,
    defaultModel: 'Pro/MiniMaxAI/MiniMax-M2.5',
    availableModels: Object.entries(AI_MODELS).map(([key, value]) => ({
      id: value.id,
      name: value.name,
      description: value.description,
      recommended: value.recommended
    })),
    availableIdentities: Object.entries(IDENTITIES).map(([key, value]) => ({
      id: value.id,
      name: value.name,
      description: `基础质量: ${value.baseMass}, 压强调制: ${value.pressureModifier}x`
    })),
    gameConfig: {
      maxTurns: GAME_CONFIG.MAX_TURNS,
      gridSize: GAME_CONFIG.GRID_SIZE
    }
  }));
});

export default router;
