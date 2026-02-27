/**
 * 游戏类型定义
 * 统一使用这些类型替代 any
 */

export interface PlayerState {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}

export interface Player {
  id: string;
  name: string;
  identityType: 'scholar' | 'landlord' | 'soldier' | 'cultist';
  identity: {
    name: string;
    baseMass: number;
    initialStates: PlayerState;
  };
  traits: Array<{ id: string; type: string }>;
  obsession: string;
  states: PlayerState;
  position: { x: number; y: number };
}

export interface NPC {
  id: string;
  name: string;
  traits: string[];
  isBonded: boolean;
  isUnlocked: boolean;
  unlockStage: number;
}

export interface GameState {
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  weather: 'clear' | 'rain' | 'fog' | 'night';
  player: Player;
  npcs: NPC[];
  history: HistoryEntry[];
  isGameOver: boolean;
  storyEvent: number;
}

export interface HistoryEntry {
  turn: number;
  choice?: string;
  result?: string;
  timestamp: string;
}

export interface Game {
  id: string;
  state: GameState;
  model: string;
  apiKey?: string;
}

export interface Choice {
  id: string;
  text: string;
  type: 'obsession' | 'trait' | 'instinct';
}

export interface TurnResponse {
  turn: number;
  narrative?: string;
  choices?: Choice[];
  result?: string;
  state: {
    turn: number;
    datetime: string;
    pressure: number;
    omega: number;
    weather: string;
    isGameOver: boolean;
  };
  gameOver?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
