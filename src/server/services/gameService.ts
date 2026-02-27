/**
 * 游戏服务层
 * 处理游戏逻辑，与路由层分离
 *
 * 设计理念：
 * 1. 玩家作为催化剂 - 在场即影响
 * 2. 涌现式叙事 - 故事自己长出来
 * 3. 物理驱动 - 引力、质量、压强、Ω
 */

import { GAME_CONFIG, NPC_CONFIG, PLAYER_CONFIG } from '../../config/GameConfig';
import { OPENINGS } from '../constants/openings';
import type { Game72Hours as Game, GameState, Player } from '../../game';
import { NPC } from '../../game/NPC';
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
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成请求ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 创建玩家
 * 玩家是催化剂，不是主角
 */
export function createPlayer(identityType: string): Player {
  const availableIdentities = Object.keys(PLAYER_CONFIG.IDENTITIES);
  const selectedIdentity = identityType || availableIdentities[Math.floor(Math.random() * availableIdentities.length)];
  const identityConfig = PLAYER_CONFIG.IDENTITIES[selectedIdentity as keyof typeof PLAYER_CONFIG.IDENTITIES];

  // 随机执念 - 这是玩家的核心驱动力
  const randomObsession = PLAYER_CONFIG.OBSESSIONS[Math.floor(Math.random() * PLAYER_CONFIG.OBSESSIONS.length)];

  // 随机特质 - 塑造玩家的"气场"
  const numTraits = PLAYER_CONFIG.MIN_TRAITS + Math.floor(
    Math.random() * (PLAYER_CONFIG.MAX_TRAITS - PLAYER_CONFIG.MIN_TRAITS + 1)
  );
  const shuffledTraits = [...PLAYER_CONFIG.TRAITS].sort(() => 0.5 - Math.random());
  const selectedTraits = shuffledTraits.slice(0, numTraits).map(t => ({ id: t, type: 'personality' as const }));

  // 构建完整的 Identity
  const identity = {
    id: selectedIdentity,
    name: identityConfig.name,
    baseMass: identityConfig.baseMass,
    pressureModifier: identityConfig.pressureModifier,
    initialStates: { ...identityConfig.initialStates },
    suitableTraits: identityConfig.suitableTraits
  };

  return {
    id: `player_${Date.now()}`,
    name: '你',
    identityType: selectedIdentity as import('../../shared/types').IdentityType,
    identity,
    traits: selectedTraits,
    obsession: randomObsession,
    states: { ...identityConfig.initialStates },
    position: { x: 0, y: 0 },
    bondedNPCs: [],
    inventory: [],
    memories: []
  } as unknown as Player;
}

/**
 * 创建NPC列表
 * NPC有自己的执念和行为逻辑
 */
export function createNPCs(): NPC[] {
  const shuffledNPCNames = [...NPC_CONFIG.NPC_NAME_POOL].sort(() => 0.5 - Math.random());

  return shuffledNPCNames.map((name, index) => NPC.create({
    id: `npc_${Date.now()}_${index + 1}`,
    name,
    baseMass: 3,
    traits: [],
    states: { fear: 5, aggression: 5, hunger: 5, injury: 1 },
    position: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
    isBonded: index < NPC_CONFIG.INITIAL_UNLOCKED_COUNT,
    isUnlocked: index < NPC_CONFIG.INITIAL_UNLOCKED_COUNT
  }));
}

/**
 * 创建游戏状态
 * 初始化物理场
 */
export function createGameState(player: Player, npcs: NPC[]): GameState {
  return {
    turn: 0,
    datetime: new Date(GAME_CONFIG.START_DATE).toISOString(),
    pressure: GAME_CONFIG.INITIAL_PRESSURE,
    omega: GAME_CONFIG.INITIAL_OMEGA,
    weather: 'night',
    player,
    npcs,
    history: [],
    isGameOver: false,
    config: {
      MAX_TURNS: GAME_CONFIG.MAX_TURNS,
      GRID_SIZE: GAME_CONFIG.GRID_SIZE || 10,
      START_DATE: GAME_CONFIG.START_DATE
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
  const spotlightNPC = selectSpotlightNPC(state.player, state.npcs, state);

  // 3. 计算玩家气场
  const playerAura = calculatePlayerAura(state.player);

  // 4. 生成共振式叙事
  const narrative = generateResonanceNarrative(state, spotlightNPC, state.player);

  // 5. 生成涌现式选择
  const choices = generateEmergentChoices(state.player, spotlightNPC, state);

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
