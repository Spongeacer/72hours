/**
 * 游戏路由 - 重构版
 * 使用服务层处理业务逻辑
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { createSuccessResponse, createErrorResponse } from '../utils/apiResponse';
import { GAME_CONFIG, AI_CONFIG } from '../../config/GameConfig';
import { generatePlayerReactionsWithAI } from '../../core/AIReactionGenerator';
import type { Game, GameState, NPC } from '../types/game.types';
import {
  generateGameId,
  generateRequestId,
  createPlayer,
  createNPCs,
  createGameState,
  formatGameResponse
} from '../services/gameService';

const router = Router();
const games = new Map<string, Game>();

// 请求验证Schema
const createGameSchema = z.object({
  identity: z.enum(['scholar', 'landlord', 'soldier', 'cultist']).optional(),
  model: z.string().optional(),
  apiKey: z.string().optional()
});

const executeTurnSchema = z.object({
  choice: z.object({
    id: z.string(),
    text: z.string()
  }).optional()
});

/**
 * 创建游戏
 * POST /api/games
 */
router.post('/', validateRequest({ body: createGameSchema }), async (req, res) => {
  const requestId = generateRequestId();
  
  try {
    const { identity, model, apiKey } = req.body;
    
    const gameId = generateGameId();
    const player = createPlayer(identity);
    const npcs = createNPCs();
    const gameState = createGameState(player, npcs);
    
    const game: Game = {
      id: gameId,
      state: gameState,
      model: model || AI_CONFIG.DEFAULT_PARAMS.model,
      apiKey
    };
    
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
    const result = await executeTurn(game, choice, requestId);
    res.json(result);
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
 * 执行回合逻辑
 */
async function executeTurn(game: Game, choice: { id: string; text: string } | undefined, requestId: string) {
  const { state } = game;
  
  // 如果提供了选择，先处理选择结果
  if (choice) {
    return processChoice(state, choice, requestId);
  }
  
  // 否则生成新回合
  return generateNewTurn(game, requestId);
}

/**
 * 处理玩家选择
 */
function processChoice(state: GameState, choice: { id: string; text: string }, requestId: string) {
  // 更新历史记录
  state.history.push({
    turn: state.turn,
    choice: choice.text,
    timestamp: new Date().toISOString()
  });
  
  // 返回结果
  return createSuccessResponse({
    turn: state.turn,
    result: '你的选择已被记录',
    state: {
      turn: state.turn,
      datetime: state.datetime,
      pressure: state.pressure,
      omega: state.omega,
      weather: state.weather,
      isGameOver: state.isGameOver
    }
  }, requestId);
}

/**
 * 生成新回合
 */
async function generateNewTurn(game: Game, requestId: string) {
  const { state, model, apiKey } = game;
  
  // 增加回合数
  state.turn++;
  
  // 更新时间（每回合2小时）
  const current = new Date(state.datetime);
  current.setHours(current.getHours() + 2);
  state.datetime = current.toISOString();
  
  // 更新压强和Ω
  updatePhysics(state);
  
  // 解锁NPC
  unlockNPCs(state);
  
  // 获取解锁的NPC
  const unlockedNPCs = state.npcs.filter((npc: NPC) => npc.isUnlocked);
  const spotlightNPC = unlockedNPCs.length > 0 ? unlockedNPCs[0] : null;
  
  // 生成AI选择
  const choices = await generateChoices(state, spotlightNPC, model, apiKey);
  
  // 生成叙事
  const narrative = generateNarrative(state, spotlightNPC);
  
  return createSuccessResponse({
    turn: state.turn,
    narrative,
    choices,
    state: {
      turn: state.turn,
      datetime: state.datetime,
      pressure: state.pressure,
      omega: state.omega,
      weather: state.weather,
      isGameOver: state.isGameOver
    }
  }, requestId);
}

/**
 * 更新物理状态（压强和Ω）
 */
function updatePhysics(state: GameState) {
  // 压强增长
  state.pressure = Math.min(
    GAME_CONFIG.MAX_PRESSURE,
    state.pressure + GAME_CONFIG.PRESSURE_INCREASE
  );
  
  // Ω增长
  let omegaIncrease = GAME_CONFIG.OMEGA_BASE_INCREASE;
  
  // 蝴蝶效应随机加成
  const butterflyEffect = Math.random();
  if (butterflyEffect < 0.3) {
    omegaIncrease += 0;
  } else if (butterflyEffect < 0.6) {
    omegaIncrease += 0.1;
  } else {
    omegaIncrease += 0.2;
  }
  
  // 高压时额外加速
  if (state.pressure >= GAME_CONFIG.HIGH_PRESSURE_THRESHOLD) {
    state.omega = Math.min(
      GAME_CONFIG.MAX_OMEGA,
      state.omega * GAME_CONFIG.OMEGA_HIGH_PRESSURE_MULTIPLIER + omegaIncrease
    );
  } else {
    state.omega = Math.min(GAME_CONFIG.MAX_OMEGA, state.omega + omegaIncrease);
  }
}

/**
 * 解锁NPC
 */
function unlockNPCs(state: GameState) {
  state.npcs.forEach(npc => {
    if (!npc.isUnlocked) {
      // 根据Ω值解锁不同阶段
      if (npc.unlockStage === 2 && state.omega >= 6) {
        npc.isUnlocked = true;
      } else if (npc.unlockStage === 3 && state.omega >= 12) {
        npc.isUnlocked = true;
      }
    }
  });
}

/**
 * 生成AI选择
 */
async function generateChoices(
  state: GameState,
  spotlightNPC: NPC | null,
  model: string,
  apiKey?: string
) {
  try {
    const npcBehavior = spotlightNPC ? {
      type: ['抢夺', '冲突', '偷听', '聊天', '请求', '给予'][Math.floor(Math.random() * 6)] as string,
      description: `${spotlightNPC.name}正在附近`,
      npcName: spotlightNPC.name,
      npcTraits: spotlightNPC.traits,
      npcObsession: '在乱世中活下去'
    } : null;
    
    const reactions = await generatePlayerReactionsWithAI(
      state.player,
      npcBehavior || {
        type: '聊天',
        description: '周围一片寂静',
        npcName: '环境',
        npcTraits: [],
        npcObsession: '无'
      },
      {
        pressure: state.pressure,
        omega: state.omega,
        weather: state.weather,
        turn: state.turn,
        narrative: ''
      }
    );
    
    return reactions.map((r, idx) => ({
      id: `choice_${idx}_${Date.now()}`,
      text: r.text,
      type: r.type
    }));
  } catch (error) {
    // AI失败时返回默认选择
    return [
      { id: 'choice_1', text: '你决定探索周围环境', type: 'instinct' as const },
      { id: 'choice_2', text: '你保持警惕，观察四周', type: 'trait' as const },
      { id: 'choice_3', text: '你想起自己的执念，做出选择', type: 'obsession' as const }
    ];
  }
}

/**
 * 生成叙事
 */
function generateNarrative(state: GameState, spotlightNPC: NPC | null): string {
  const narratives = [
    `第${state.turn}回合。你站在村子里，空气中弥漫着紧张的气氛。`,
    `时间一分一秒地过去，你知道历史正在发生。`,
    `夜色更深了。你感到一种莫名的恐惧在蔓延。`,
    `风吹过村子，带来一股烟味。不是炊烟，是别的什么。`
  ];
  
  let narrative = narratives[Math.floor(Math.random() * narratives.length)];
  
  if (spotlightNPC) {
    narrative += `\n> ${spotlightNPC.name}在附近，似乎有所图谋。`;
  }
  
  return narrative;
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
 * 获取AI Prompt
 * GET /api/games/:id/ai-prompt
 */
router.get('/:id/ai-prompt', (req, res) => {
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
  
  const { state } = game;
  const player = state.player;
  const unlockedNPCs = state.npcs.filter(npc => npc.isUnlocked);
  const spotlightNPC = unlockedNPCs.length > 0 ? unlockedNPCs[0] : null;
  
  const prompt = `
【时间】第${state.turn}/${GAME_CONFIG.MAX_TURNS}回合

【场】
压强：${Math.round(state.pressure)}/20
历史必然感：${Math.round(state.omega)}/20

【你】
身份：${player.identity.name}
执念：${player.obsession}
特质：${player.traits.map(t => t.id).join('、')}
状态：恐惧${player.states.fear}/攻击${player.states.aggression}/饥饿${player.states.hunger}

【在场者】${spotlightNPC ? spotlightNPC.name : '无'}
${spotlightNPC ? `执念：在乱世中活下去` : ''}
`;
  
  res.json(createSuccessResponse({
    prompt,
    context: {
      turn: state.turn,
      pressure: state.pressure,
      omega: state.omega
    }
  }, requestId));
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

export default router;
