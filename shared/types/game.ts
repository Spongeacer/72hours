/**
 * 游戏状态相关类型
 */

import type { WeatherType } from './base';
import type { Player } from './player';
import type { NPC } from './npc';

// 游戏配置
export interface GameConfig {
  MAX_TURNS: number;
  GRID_SIZE: number;
  START_DATE: string;
}

// 游戏状态
export interface GameState {
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  weather: WeatherType;
  player: Player;
  npcs: NPC[];
  history: HistoryEntry[];
  isGameOver: boolean;
  config: GameConfig;
}

// 历史记录
export interface HistoryEntry {
  turn: number;
  narrative: string;
  choice?: Choice;
  result?: string;
}

// 选择
export interface Choice {
  id: string;
  text: string;
  type?: 'normal' | 'hidden';
  isHidden?: boolean;
  condition?: ChoiceCondition;
}

// 选择条件
export interface ChoiceCondition {
  minKnot?: number;
  maxFear?: number;
  hasTrait?: string;
  hasItem?: string;
}

// 场景
export interface Scene {
  location: string;
  description: string;
  atmosphere: string;
}

// 游戏事件
export interface GameEvent {
  type: string;
  name: string;
  description: string;
}

// 回合上下文
export interface TurnContext {
  scene: Scene;
  spotlight: NPC | null;
  player: Player;
  event: GameEvent | null;
  memories: import('./player').Memory[];
}

// 回合结果
export interface TurnResult {
  turn: number;
  narrative: string;
  choices: Choice[];
  context: TurnContext;
  state: GameState;
}

// 选择结果
export interface ChoiceResult {
  text: string;
  stateChanges?: StateChanges;
  gameOver?: GameOverInfo;
}

// 状态变化
export interface StateChanges {
  fear?: number;
  aggression?: number;
  hunger?: number;
  injury?: number;
  knot?: number;
}

// 游戏结束信息
export interface GameOverInfo {
  type: 'death' | 'escape' | 'completed';
  reason: string;
}

// 游戏初始化结果
export interface GameInitResult {
  gameId: string;
  player: Player;
  bondedNPCs: NPC[];
  opening: string;
  state: GameState;
}
