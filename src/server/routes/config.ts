/**
 * 配置路由
 * 提供游戏配置信息
 */

import { Router } from 'express';
import { GAME_CONFIG, PLAYER_CONFIG, AI_CONFIG } from '../../config/GameConfig';
import { createSuccessResponse } from '../utils/apiResponse';

const router = Router();

/**
 * 获取游戏配置
 * GET /api/config
 */
router.get('/', (_req, res) => {
  const hasApiKey = !!process.env.SILICONFLOW_API_KEY;
  
  res.json(createSuccessResponse({
    hasApiKey,
    defaultModel: AI_CONFIG.DEFAULT_PARAMS.model,
    availableModels: Object.values(AI_CONFIG.PROVIDERS).map(provider => ({
      id: provider.defaultModel,
      name: provider.name,
      description: 'AI模型',
      recommended: true
    })),
    availableIdentities: Object.entries(PLAYER_CONFIG.IDENTITIES).map(([id, identity]) => ({
      id,
      name: identity.name,
      description: `基础质量: ${identity.baseMass}`
    })),
    gameConfig: {
      maxTurns: GAME_CONFIG.MAX_TURNS,
      startDate: GAME_CONFIG.START_DATE
    }
  }));
});

export default router;
