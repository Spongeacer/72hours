/**
 * 游戏路由 - 重构版
 * 使用服务层处理业务逻辑
 * 
 * 设计理念：
 * 1. 玩家作为催化剂 - 在场即影响
 * 2. 涌现式叙事 - 故事自己长出来
 * 3. 物理引擎驱动 - 引力、质量、压强、Ω
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse';
import { Game72Hours } from '../../game/Game72Hours';
import type { Game72Hours as Game } from '../../game';
import { getCurrentIdentityIds } from '../../config/ScriptConfig';
import {
  generateGameId,
  generateRequestId,
  formatGameResponse,
  executeTurn
} from '../services/gameService';

const router = Router();
const games = new Map<string, Game>();

// 动态获取身份验证schema
const getCreateGameSchema = () => {
  const identityIds = getCurrentIdentityIds();
  return z.object({
    identity: z.enum(identityIds as [string, ...string[]]).optional(),
    model: z.string().optional(),
    apiKey: z.string().optional()
  });
};

const executeTurnSchema = z.object({
  choice: z.object({
    id: z.string(),
    text: z.string()
  }).optional()
});

/**
 * 创建游戏
 * POST /api/games
 * 
 * 玩家作为催化剂进入金田村
 */
router.post('/', validateRequest({ body: getCreateGameSchema() }), async (req, res) => {
  const requestId = generateRequestId();
  
  try {
    const { identity, model, apiKey } = req.body;
    
    const gameId = generateGameId();
    const game = new Game72Hours({
      id: gameId,
      model: model || 'Pro/MiniMaxAI/MiniMax-M2.5',
      apiKey: apiKey || process.env.SILICONFLOW_API_KEY
    });
    
    // 初始化游戏
    await game.init(identity);
    
    games.set(gameId, game);
    
    res.status(201).json(createSuccessResponse(
      formatGameResponse(game),
      requestId
    ));
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建游戏失败';
    res.status(500).json(createErrorResponse(
      'GAME_INIT_FAILED',
      message,
      undefined,
      requestId
    ));
  }
});

/**
 * 获取游戏状态
 * GET /api/games/:id/state
 */
router.get('/:id/state', (req, res) => {
  const requestId = generateRequestId();
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在或已结束',
      undefined,
      requestId
    ));
  }
  
  res.json(createSuccessResponse({
    turn: game.state.turn,
    datetime: game.state.datetime,
    pressure: game.state.pressure,
    omega: game.state.omega,
    weather: game.state.weather,
    isGameOver: game.state.isGameOver
  }, requestId));
});

/**
 * 执行回合
 * POST /api/games/:id/turns
 * 
 * 核心流程：
 * 1. 更新物理场（压强、Ω）
 * 2. 选择聚光灯NPC（基于引力）
 * 3. 生成共振式叙事
 * 4. 生成涌现式选择
 */
router.post('/:id/turns', validateRequest({ body: executeTurnSchema }), async (req, res) => {
  const requestId = generateRequestId();
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在或已结束',
      undefined,
      requestId
    ));
  }
  
  if (game.state.isGameOver) {
    return res.status(400).json(createErrorResponse(
      'GAME_ALREADY_OVER',
      '游戏已结束',
      undefined,
      requestId
    ));
  }
  
  try {
    const { choice } = req.body;
    
    // 如果提供了选择，先处理选择结果
    if (choice) {
      return processChoice(game, choice, requestId, res);
    }
    
    // 否则生成新回合
    return generateNewTurn(game, requestId, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : '执行回合失败';
    res.status(500).json(createErrorResponse(
      'TURN_EXECUTION_FAILED',
      message,
      undefined,
      requestId
    ));
  }
});

/**
 * 处理玩家选择
 */
function processChoice(
  game: Game,
  choice: { id: string; text: string },
  requestId: string,
  res: any
) {
  const { state } = game;
  
  // 更新历史记录
  state.history.push({
    turn: state.turn,
    narrative: '玩家选择: ' + choice.text,
    choice: { id: choice.id, text: choice.text },
    result: '你的选择已被记录，故事继续流淌...'
  });
  
  // 返回结果并生成新回合（不重复递增回合数）
  return generateNewTurn(game, requestId, res);
}

/**
 * 生成新回合
 * 
 * 核心：物理场 + 聚光灯 + 玩家状态 → 共振式叙事
 */
function generateNewTurn(game: Game, requestId: string, res: any) {
  const { state } = game;
  
  // 增加回合数
  state.turn++;
  
  // 更新时间（每回合2小时）
  const current = new Date(state.datetime);
  current.setHours(current.getHours() + 2);
  state.datetime = current.toISOString();
  
  // 执行回合逻辑（物理引擎 + 叙事生成）
  const { narrative, choices, spotlightNPC, playerAura } = executeTurn(game);
  
  res.json(createSuccessResponse({
    turn: state.turn,
    narrative,
    choices,
    spotlightNPC: spotlightNPC ? {
      id: spotlightNPC.id,
      name: spotlightNPC.name,
      isBonded: spotlightNPC.isBonded
    } : null,
    playerAura,
    state: {
      turn: state.turn,
      datetime: state.datetime,
      pressure: state.pressure,
      omega: state.omega,
      weather: state.weather,
      isGameOver: state.isGameOver
    }
  }, requestId));
}

/**
 * 获取历史记录
 * GET /api/games/:id/history
 */
router.get('/:id/history', (req, res) => {
  const requestId = generateRequestId();
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在或已结束',
      undefined,
      requestId
    ));
  }
  
  res.json(createSuccessResponse(game.state.history, requestId));
});

/**
 * 删除游戏
 * DELETE /api/games/:id
 */
router.delete('/:id', (req, res) => {
  const requestId = generateRequestId();
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在',
      undefined,
      requestId
    ));
  }
  
  games.delete(req.params.id);
  res.json(createSuccessResponse(null, requestId));
});

/**
 * 获取AI提示词
 * GET /api/games/:id/ai-prompt
 */
router.get('/:id/ai-prompt', (req, res) => {
  const requestId = generateRequestId();
  const game = games.get(req.params.id);

  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在',
      undefined,
      requestId
    ));
  }

  // 构建AI提示词（不包含敏感信息）
  const { player, turn, pressure, omega } = game.state;
  const prompt = `当前回合: ${turn}\n玩家身份: ${player.identity.name}\n玩家特质: ${player.traits.map((t: any) => t.id).join(', ')}\n玩家状态: 恐惧${player.states.fear}, 攻击性${player.states.aggression}, 饥饿${player.states.hunger}, 伤势${player.states.injury}\n环境: 压强${pressure}, Ω值${omega}\n\n请基于以上情境生成一段叙事。`;

  res.json(createSuccessResponse({
    prompt,
    model: game.model || 'Pro/MiniMaxAI/MiniMax-M2.5'
    // 注意：不返回 apiUrl 和 provider，避免泄露配置信息
  }, requestId));
});

export default router;
