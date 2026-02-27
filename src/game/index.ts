/**
 * 游戏核心模块导出
 * 统一导出游戏相关类型和类
 */

// 导出类
export { Agent, AgentStates, Item } from './Agent';
export { Player, ObsessionData } from './Player';
export { NPC, NPCData, UnlockCondition } from './NPC';
export { Game72Hours, GameOptions } from './Game72Hours';
export { TurnManager, TurnContext } from './TurnManager';

// 从 shared/types 重新导出常用类型
export type {
  GameState,
  Player as PlayerType,
  NPC as NPCType,
  Identity,
  IdentityType,
  WeatherType,
  Position,
  Trait,
  Memory,
  Choice,
  TurnResult,
  GameInitResult,
  SaveData
} from '../../shared/types';
