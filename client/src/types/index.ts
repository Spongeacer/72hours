/**
 * 前端类型定义
 * 
 * 原则：
 * 1. 优先从 shared/types 导入共享类型
 * 2. 前端专属类型在此定义
 * 3. 保持与后端类型兼容
 */

// 从共享类型重新导出
export type {
  IdentityType,
  WeatherType,
  Position,
  Trait,
  Player,
  NPC,
  GameState,
  Choice,
  TurnResult,
  SaveData
} from '../../../shared/types';

// 前端专属：API 响应
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// 前端专属：游戏配置
export interface GameConfig {
  hasApiKey: boolean;
  defaultModel: string;
  availableModels: ModelInfo[];
  availableIdentities: IdentityInfo[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
}

export interface IdentityInfo {
  id: string;
  name: string;
  description: string;
}

// 前端专属：扩展的回合结果
export interface FrontendTurnResult extends TurnResult {
  spotlightNPC?: NPC | null;
  playerAura?: string;
}
