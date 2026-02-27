/**
 * 游戏服务层
 * 处理游戏逻辑，与路由层分离
 */

import { GAME_CONFIG, NPC_CONFIG, PLAYER_CONFIG } from '../../config/GameConfig';
import { OPENINGS } from '../constants/openings';
import type { Game, GameState, Player, NPC } from '../types/game.types';

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
 */
export function createPlayer(identityType: string): Player {
  const availableIdentities = Object.keys(PLAYER_CONFIG.IDENTITIES);
  const selectedIdentity = identityType || availableIdentities[Math.floor(Math.random() * availableIdentities.length)];
  const identityConfig = PLAYER_CONFIG.IDENTITIES[selectedIdentity as keyof typeof PLAYER_CONFIG.IDENTITIES];
  
  const randomObsession = PLAYER_CONFIG.OBSESSIONS[Math.floor(Math.random() * PLAYER_CONFIG.OBSESSIONS.length)];
  
  const numTraits = PLAYER_CONFIG.MIN_TRAITS + Math.floor(
    Math.random() * (PLAYER_CONFIG.MAX_TRAITS - PLAYER_CONFIG.MIN_TRAITS + 1)
  );
  const shuffledTraits = [...PLAYER_CONFIG.TRAITS].sort(() => 0.5 - Math.random());
  const selectedTraits = shuffledTraits.slice(0, numTraits);
  
  return {
    id: `player_${Date.now()}`,
    name: '你',
    identityType: selectedIdentity,
    identity: {
      name: identityConfig.name,
      baseMass: identityConfig.baseMass,
      initialStates: { ...identityConfig.initialStates }
    },
    traits: selectedTraits,
    obsession: randomObsession,
    states: { ...identityConfig.initialStates },
    position: { x: 0, y: 0 }
  };
}

/**
 * 创建NPC列表
 */
export function createNPCs(): NPC[] {
  const shuffledNPCNames = [...NPC_CONFIG.NPC_NAME_POOL].sort(() => 0.5 - Math.random());
  
  return shuffledNPCNames.map((name, index) => ({
    id: `npc_${Date.now()}_${index + 1}`,
    name,
    traits: [],
    isBonded: index < NPC_CONFIG.INITIAL_UNLOCKED_COUNT,
    isUnlocked: index < NPC_CONFIG.INITIAL_UNLOCKED_COUNT,
    unlockStage: index < NPC_CONFIG.INITIAL_UNLOCKED_COUNT ? 1 : index < 8 ? 2 : 3
  }));
}

/**
 * 创建游戏状态
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
    storyEvent: 0
  };
}

/**
 * 获取开场白
 */
export function getOpening(identityType: string): string {
  return OPENINGS[identityType] || OPENINGS.scholar;
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
