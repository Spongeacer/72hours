// 前端类型定义
// 与后端 shared/types.ts 保持一致

export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';

export interface Position {
  x: number;
  y: number;
}

export interface Trait {
  id: string;
  type: 'identity' | 'personality';
  name?: string;
}

export interface Identity {
  name: string;
  baseMass: number;
  initialStates: {
    fear: number;
    aggression: number;
    hunger: number;
    injury: number;
  };
}

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
}

export interface NPC {
  id: string;
  name: string;
  traits: Trait[];
  isBonded: boolean;
  isUnlocked: boolean;
}

export interface Choice {
  id: string;
  text: string;
  type?: 'normal' | 'hidden';
  isHidden?: boolean;
}

export interface GameState {
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  weather: WeatherType;
  isGameOver: boolean;
}

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
  spotlightNPC?: NPC | null;
  playerAura?: string;
}

export interface SaveData {
  id: string;
  name: string;
  timestamp: number;
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
}

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
