/**
 * 共享类型定义 - 前后端共用
 */

// ==================== 基础类型 ====================

export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';
export type TraitType = 'identity' | 'personality';

export interface Position {
  x: number;
  y: number;
}

// ==================== 特质 ====================

export interface Trait {
  id: string;
  type: TraitType;
  name?: string;
  description?: string;
}

// ==================== 状态 ====================

export interface PlayerStates {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}

export interface NPCStates {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}

// ==================== 玩家 ====================

export interface Player {
  id: string;
  name: string;
  identityType: IdentityType;
  identity: Identity;
  traits: Trait[];
  obsession: string;
  states: PlayerStates;
  position: Position;
  bondedNPCs: string[];
  inventory: Item[];
  memories: Memory[];
}

export interface Identity {
  id: string;
  name: string;
  baseMass: number;
  pressureModifier: number;
  initialStates: PlayerStates;
  suitableTraits?: string[];
}

// ==================== NPC ====================

export interface NPC {
  id: string;
  name: string;
  baseMass: number;
  traits: Trait[];
  obsession: string;
  states: NPCStates;
  position: Position;
  isBonded: boolean;
  isElite: boolean;
  isUnlocked: boolean;
  initialKnot?: number;
}

// ==================== 游戏状态 ====================

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

export interface GameConfig {
  MAX_TURNS: number;
  GRID_SIZE: number;
  START_DATE: string;
}

// ==================== 回合 ====================

export interface TurnContext {
  scene: Scene;
  spotlight: NPC | null;
  player: Player;
  event: GameEvent | null;
  memories: Memory[];
}

export interface Scene {
  location: string;
  description: string;
  atmosphere: string;
}

export interface GameEvent {
  type: string;
  name: string;
  description: string;
}

export interface HistoryEntry {
  turn: number;
  narrative: string;
  choice?: Choice;
  result?: string;
}

// ==================== 选择 ====================

export interface Choice {
  id: string;
  text: string;
  type?: 'normal' | 'hidden';
  isHidden?: boolean;
  condition?: ChoiceCondition;
}

export interface ChoiceCondition {
  minKnot?: number;
  maxFear?: number;
  hasTrait?: string;
  hasItem?: string;
}

// ==================== 回合结果 ====================

export interface TurnResult {
  turn: number;
  narrative: string;
  choices: Choice[];
  context: TurnContext;
  state: GameState;
}

export interface ChoiceResult {
  text: string;
  stateChanges?: StateChanges;
  gameOver?: GameOverInfo;
}

export interface StateChanges {
  fear?: number;
  aggression?: number;
  hunger?: number;
  injury?: number;
  knot?: number;
}

export interface GameOverInfo {
  type: 'death' | 'escape' | 'completed';
  reason: string;
}

// ==================== 物品 ====================

export interface Item {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

// ==================== 记忆 ====================

export interface Memory {
  id: string;
  turn: number;
  npcId: string;
  type: 'betrayal' | 'gift' | 'rescue' | 'conflict';
  description: string;
  intensity: number;
}

// ==================== API 响应 ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

// ==================== 存档 ====================

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

// ==================== 游戏初始化 ====================

export interface GameInitResult {
  gameId: string;
  player: Player;
  bondedNPCs: NPC[];
  opening: string;
  state: GameState;
}

// ==================== 常量配置 ====================

export interface GameConstants {
  GRID_SIZE: number;
  MAX_TURNS: number;
  START_DATE: string;
  
  GRAVITY: {
    G: number;
    PRESSURE_MULTIPLIER: number;
  };
  
  PRESSURE: {
    BASE_GROWTH: number;
    VIOLENCE_BONUS: number;
    THRESHOLD_RAID: number;
    THRESHOLD_DIVINE: number;
  };
  
  OMEGA: {
    INITIAL: number;
    LINEAR_GROWTH: number;
    EXPONENTIAL_THRESHOLD: number;
    EXPONENTIAL_BASE: number;
    MAX: number;
  };
}
