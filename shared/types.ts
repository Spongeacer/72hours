/**
 * 共享类型定义
 */

// 基础类型
export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';

// 位置
export interface Position {
  x: number;
  y: number;
}

// 特质
export interface Trait {
  id: string;
  type: 'identity' | 'personality';
  name?: string;
}

// 身份
export interface Identity {
  id: string;
  name: string;
  baseMass: number;
  trait?: string;
  traits?: string[];
  pressureModifier: number;
  initialStates: {
    fear: number;
    aggression: number;
    hunger: number;
    injury: number;
  };
  suitableTraits?: string[];
}

// 性格特质
export interface PersonalityTrait {
  name: string;
  description: string;
}

// 记忆
export interface Memory {
  id: string;
  npcId: string;
  type: 'betrayal' | 'gratitude' | 'normal';
  content: string;
  timestamp: string;
}

// 玩家
export interface Player {
  id: string;
  name: string;
  identityType: IdentityType;
  identity: Identity;
  traits: Trait[];
  obsession: string;
  states: {
    fear: number;
    aggression: number;
    hunger: number;
    injury: number;
  };
  position: Position;
  bondedNPCs: string[];
  inventory: any[];
  memories: Memory[];
}

// NPC
export interface NPC {
  id: string;
  name: string;
  baseMass: number;
  traits: Trait[];
  obsession: string;
  states: {
    fear: number;
    aggression: number;
    hunger: number;
    injury: number;
  };
  position: Position;
  isBonded: boolean;
  isElite: boolean;
  isUnlocked: boolean;
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
  history: any[];
  config: any;
  isGameOver: boolean;
}

// 选择
export interface Choice {
  id: string;
  text: string;
  type?: 'normal' | 'hidden';
  isHidden?: boolean;
}

// 回合结果
export interface TurnResult {
  turn: number;
  narrative: string;
  choices: Choice[];
  result?: string;
  state: GameState;
  gameOver?: {
    type: 'death' | 'escape' | 'completed';
    reason: string;
  };
  epilogue?: string;
}

// 游戏初始化结果
export interface GameInitResult {
  gameId: string;
  player: Player;
  bondedNPCs: NPC[];
  opening: string;
  state: GameState;
}

// 存档
export interface SaveData {
  id: string;
  gameId: string;
  name: string;
  timestamp: number;
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
}

// API响应
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// 游戏配置
export interface GameConfig {
  hasApiKey: boolean;
  defaultModel: string;
  availableModels: {
    id: string;
    name: string;
    description: string;
    recommended: boolean;
  }[];
  availableIdentities: {
    id: string;
    name: string;
    description: string;
  }[];
  gameConfig: {
    maxTurns: number;
    gridSize: number;
  };
}
