// 前端类型定义

export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';

export interface GameState {
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  weather: WeatherType;
  isGameOver: boolean;
}

export interface Player {
  id: string;
  name: string;
  identityType: IdentityType;
  identity: {
    name: string;
  };
  traits: Trait[];
  obsession: string;
}

export interface Trait {
  id: string;
  type: 'identity' | 'personality';
  name?: string;
}

export interface NPC {
  id: string;
  name: string;
  traits: Trait[];
  isBonded: boolean;
}

export interface Choice {
  id: string;
  text: string;
  type?: 'normal' | 'hidden';
  isHidden?: boolean;
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
