/**
 * 配置路由
 * 提供游戏配置信息
 */

import { Router } from 'express';
import { GAME_CONFIG, AI_CONFIG, SERVER_CONFIG } from '../../config/GameConfig';
import { getCurrentScript, getCurrentIdentities } from '../../config/ScriptConfig';
import { createSuccessResponse } from '../utils/apiResponse';

const router = Router();

/**
 * 获取游戏配置
 * GET /api/config
 */
router.get('/', (_req, res) => {
  const hasApiKey = !!process.env.SILICONFLOW_API_KEY;
  const script = getCurrentScript();
  const identities = getCurrentIdentities();
  
  res.json(createSuccessResponse({
    hasApiKey,
    defaultModel: AI_CONFIG.DEFAULT_PARAMS.model,
    availableModels: Object.values(AI_CONFIG.PROVIDERS).map(provider => ({
      id: provider.defaultModel,
      name: provider.name,
      description: 'AI模型',
      recommended: true
    })),
    // 从剧本配置获取身份列表
    availableIdentities: identities.map(identity => ({
      id: identity.id,
      name: identity.name,
      description: identity.description,
      baseMass: identity.baseMass,
      traits: identity.traits
    })),
    // 剧本信息
    script: {
      id: script.id,
      name: script.name,
      description: script.description,
      year: script.year,
      location: script.location
    },
    gameConfig: {
      maxTurns: GAME_CONFIG.MAX_TURNS,
      startDate: script.startDate || GAME_CONFIG.START_DATE
    },
    // 版本信息
    version: SERVER_CONFIG.VERSION
  }));
});

/**
 * 获取版本信息
 * GET /api/config/version
 */
router.get('/version', (_req, res) => {
  res.json(createSuccessResponse({
    version: SERVER_CONFIG.VERSION,
    server: '72hours-server',
    timestamp: new Date().toISOString()
  }));
});

export default router;
