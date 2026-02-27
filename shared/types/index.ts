/**
 * 共享类型定义 - 前后端共用
 * 
 * 使用方式：
 * import type { Player, GameState } from '../shared/types';
 * 
 * 或按需导入：
 * import type { Player } from '../shared/types/player';
 */

// 基础类型
export type {
  IdentityType,
  WeatherType,
  TraitType,
  Position,
  Trait
} from './base';

// 玩家相关
export type {
  PlayerStates,
  Identity,
  Player,
  Item,
  Memory
} from './player';

// NPC 相关
export type {
  NPCStates,
  NPC
} from './npc';

// 游戏状态相关
export type {
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
  GameInitResult
} from './game';

// 存档相关
export type {
  SaveData,
  SaveSummary
} from './save';
