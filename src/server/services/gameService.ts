/**
 * 游戏服务层
 * 处理游戏逻辑，与路由层分离
 *
 * 设计理念：
 * 1. 玩家作为催化剂 - 在场即影响
 * 2. 涌现式叙事 - 故事自己长出来
 * 3. 物理驱动 - 引力、质量、压强、Ω
 */

import { GAME_CONFIG } from '../../config/GameConfig';
import { getCurrentIdentities, getCurrentScript } from '../../config/ScriptConfig';
import { OPENINGS } from '../constants/openings';
import type { Game72Hours as Game, GameState, Player } from '../../game';
import type { IdentityType, Player as IPlayer } from '../../../shared/types/index';
import { NPC } from '../../game/NPC';
import { randomUUID } from 'crypto';
import {
  selectSpotlightNPC,
  updatePhysics,
  calculatePlayerAura
} from './physicsService';
import {
  generateResonanceNarrative,
  generateEmergentChoices
} from './narrativeService';

/**
 * 生成唯一游戏ID
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
}

/**
 * 生成请求ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * 创建玩家
 * 玩家是催化剂，不是主角
 */
export function createPlayer(identityType: string): Player {
  const identities = getCurrentIdentities();
  const availableIdentityIds = identities.map(i => i.id);
  
  // 如果未指定身份，随机选择一个
  const selectedIdentityId = identityType || availableIdentityIds[Math.floor(Math.random() * availableIdentityIds.length)];
  
  // 从剧本配置获取身份定义
  const identityConfig = identities.find(i => i.id === selectedIdentityId);
  if (!identityConfig) {
    throw new Error(`Invalid identity: ${selectedIdentityId}`);
  }
  
  // 从剧本获取AI提示词生成执念
  const script = getCurrentScript();
  const obsession = generateObsessionFromScript(selectedIdentityId, identityConfig.traits, script);

  // 使用身份定义的特质
  const selectedTraits = identityConfig.traits.map(t => ({ id: t, type: 'personality' as const }));

  // 构建完整的 Identity
  const identity = {
    id: selectedIdentityId,
    name: identityConfig.name,
    baseMass: identityConfig.baseMass,
    // 默认值，可从剧本覆盖
    pressureModifier: 1.0,
    initialStates: { fear: 5, aggression: 5, hunger: 5, injury: 0 },
    suitableTraits: identityConfig.traits
  };

  return {
    id: `player_${Date.now()}`,
    name: '你',
    identityType: selectedIdentityId as IdentityType,
    identity,
    traits: selectedTraits,
    obsession: obsession,
    states: { fear: 5, aggression: 5, hunger: 5, injury: 0 },
    position: { x: 0, y: 0 },
    bondedNPCs: [],
    inventory: [],
    memories: []
  } as unknown as Player;
}

/**
 * 从剧本生成执念
 */
function generateObsessionFromScript(identityId: string, traits: string[], script: any): string {
  // 使用剧本的AI提示词模板生成执念
  const prompt = script.aiPrompts?.playerObsession
    ?.replace('{identity}', identityId)
    ?.replace('{traits}', traits.join(', '));
  
  // 如果剧本有定义，返回模板化的执念，否则返回默认
  return prompt || `在${script.name}的乱世中生存下去`;
}

/**
 * 创建NPC列表
 * 注意：现在NPC由Game72Hours类直接创建，此函数保留用于兼容性
 */
export function createNPCs(): NPC[] {
  // 返回空数组，实际NPC在Game72Hours.init()中创建
  return [];
}

/**
 * 创建游戏状态
 * 初始化物理场
 */
export function createGameState(player: Player, npcs: NPC[]): GameState {
  const script = getCurrentScript();
  
  return {
    turn: 0,
    datetime: new Date(script.startDate || GAME_CONFIG.START_DATE).toISOString(),
    pressure: GAME_CONFIG.INITIAL_PRESSURE,
    omega: GAME_CONFIG.INITIAL_OMEGA,
    weather: 'night',
    player: player as unknown as IPlayer,
    npcs,
    history: [],
    isGameOver: false,
    config: {
      MAX_TURNS: GAME_CONFIG.MAX_TURNS,
      GRID_SIZE: GAME_CONFIG.GRID_SIZE || 10,
      START_DATE: script.startDate || GAME_CONFIG.START_DATE
    }
  };
}

/**
 * 获取开场白
 * 根据身份类型返回不同的开场
 */
export function getOpening(identityType: string): string {
  return OPENINGS[identityType] || OPENINGS.scholar;
}

/**
 * 执行回合
 * 核心流程：
 * 1. 更新物理场（压强、Ω）
 * 2. 选择聚光灯NPC（基于引力）
 * 3. 生成共振式叙事
 * 4. 生成涌现式选择
 */
export function executeTurn(game: Game): {
  narrative: string;
  choices: Array<{ id: string; text: string; type: string; drive: string }>;
  spotlightNPC: NPC | null;
  playerAura: string;
} {
  const { state } = game;

  // 1. 更新物理场
  updatePhysics(state);

  // 2. 选择聚光灯NPC（基于引力 + 随机扰动）
  const playerClass = state.player as unknown as import('../../game/Player').Player;
  const spotlightNPC = selectSpotlightNPC(playerClass, state.npcs as unknown as import('../../game/NPC').NPC[], state);

  // 3. 计算玩家气场
  const playerAura = calculatePlayerAura(playerClass);

  // 4. 生成共振式叙事
  const narrative = generateResonanceNarrative(state, spotlightNPC, playerClass);

  // 5. 生成涌现式选择
  const choices = generateEmergentChoices(playerClass, spotlightNPC, state);

  return { narrative, choices, spotlightNPC, playerAura };
}

/**
 * 格式化游戏响应数据
 */
export function formatGameResponse(game: Game) {
  const { state } = game;
  const unlockedNPCs = state.npcs.filter(npc => npc.isUnlocked);

  return {
    gameId: game.id,
    player: {
      id: state.player.id,
      name: state.player.name,
      identityType: state.player.identityType,
      identity: state.player.identity,
      traits: state.player.traits,
      obsession: state.player.obsession,
      states: state.player.states,
      position: state.player.position
    },
    bondedNPCs: unlockedNPCs.map(npc => ({
      id: npc.id,
      name: npc.name,
      traits: npc.traits,
      isBonded: npc.isBonded,
      isUnlocked: npc.isUnlocked
    })),
    opening: getOpening(state.player.identityType),
    state: {
      turn: state.turn,
      datetime: state.datetime,
      pressure: state.pressure,
      omega: state.omega,
      weather: state.weather,
      isGameOver: state.isGameOver
    }
  };
}
