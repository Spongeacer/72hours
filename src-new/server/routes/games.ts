import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { Game72Hours } from '../../game/Game72Hours';
import { TurnManager } from '../../game/TurnManager';
import { createSuccessResponse, createErrorResponse } from '../types/api';

// 游戏实例存储（生产环境应使用Redis）
const games = new Map<string, Game72Hours>();

const router = Router();

// 创建游戏
const createGameSchema = z.object({
  identity: z.enum(['scholar', 'landlord', 'soldier', 'cultist']),
  model: z.string().optional(),
  apiKey: z.string().optional()
});

router.post('/', validateRequest({ body: createGameSchema }), async (req, res) => {
  try {
    const { identity, model, apiKey } = req.body;
    
    // 创建游戏实例
    const game = new Game72Hours({
      model: model || 'Pro/MiniMaxAI/MiniMax-M2.5'
    });
    
    // 初始化游戏
    const initResult = await game.init(identity);
    
    // 存储游戏实例
    games.set(initResult.gameId, game);
    
    res.status(201).json(createSuccessResponse({
      gameId: initResult.gameId,
      player: initResult.player,
      bondedNPCs: initResult.bondedNPCs,
      opening: initResult.opening,
      state: initResult.state
    }));
  } catch (error: any) {
    res.status(500).json(createErrorResponse(
      'GAME_INIT_FAILED',
      error.message || '创建游戏失败'
    ));
  }
});

// 获取游戏状态
router.get('/:id/state', (req, res) => {
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在或已结束'
    ));
  }
  
  res.json(createSuccessResponse(game.getState()));
});

// 执行回合
const executeTurnSchema = z.object({
  choice: z.object({
    id: z.string(),
    text: z.string()
  }).optional()
});

router.post('/:id/turns', validateRequest({ body: executeTurnSchema }), async (req, res) => {
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在或已结束'
    ));
  }
  
  if (game.isGameOver) {
    return res.status(400).json(createErrorResponse(
      'GAME_ALREADY_OVER',
      '游戏已结束'
    ));
  }
  
  try {
    const { choice } = req.body;
    const result = await game.executeTurn(choice);
    
    res.json(createSuccessResponse(result));
  } catch (error: any) {
    res.status(500).json(createErrorResponse(
      'TURN_EXECUTION_FAILED',
      error.message || '执行回合失败'
    ));
  }
});

// 获取历史记录
router.get('/:id/history', (req, res) => {
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在或已结束'
    ));
  }
  
  res.json(createSuccessResponse(game.gameState.history));
});

// 结束游戏
router.delete('/:id', (req, res) => {
  const game = games.get(req.params.id);
  
  if (!game) {
    return res.status(404).json(createErrorResponse(
      'GAME_NOT_FOUND',
      '游戏不存在'
    ));
  }
  
  games.delete(req.params.id);
  res.json(createSuccessResponse(null));
});

export default router;
