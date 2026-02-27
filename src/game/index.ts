/**
 * 游戏核心模块导出
 * 统一导出游戏相关类型和类
 * 
 * 使用方式：
 * import { Game72Hours, Player, NPC } from '../game';
 * import type { GameState, PlayerStates } from '../game';
 */

// 导出类
export { Agent } from './Agent';
export type { AgentStates, Item } from './Agent';

export { Player } from './Player';
export type { ObsessionData } from './Player';

export { NPC } from './NPC';
export type { NPCData, UnlockCondition } from './NPC';

export { Game72Hours } from './Game72Hours';
export type { GameOptions } from './Game72Hours';

export { TurnManager } from './TurnManager';
export type { TurnContext } from './TurnManager';

// 从 shared/types 重新导出核心类型
export type {
  // 基础
  IdentityType,
  WeatherType,
  TraitType,
  Position,
  Trait,
  
  // 玩家
  PlayerStates,
  Identity,
  Item,
  Memory,
  
  // NPC
  NPCStates,
  
  // 游戏
  GameConfig,
  GameState,
  HistoryEntry,
  Choice,
  ChoiceCondition,
  Scene,
  GameEvent,
  TurnContext,
  TurnResult,
  ChoiceResult,
  StateChanges,
  GameOverInfo,
  GameInitResult,
  
  // 存档
  SaveData,
  SaveSummary
} from '../../shared/types';
