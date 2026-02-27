/**
 * 存档相关类型
 */

import type { GameState } from './game';

// 存档数据
export interface SaveData {
  id: string;
  name: string;
  timestamp: number;
  gameId: string;
  gameState: GameState;
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  isAutoSave?: boolean;
}

// 存档摘要
export interface SaveSummary {
  id: string;
  name: string;
  timestamp: number;
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  isAutoSave?: boolean;
}
