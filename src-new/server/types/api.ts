/**
 * API 类型定义
 * 统一响应格式
 */

// ==================== 基础响应 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== HTTP 状态码 ====================

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// ==================== 错误码 ====================

export enum ErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 游戏错误
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_ALREADY_OVER = 'GAME_ALREADY_OVER',
  INVALID_IDENTITY = 'INVALID_IDENTITY',
  INVALID_CHOICE = 'INVALID_CHOICE',
  
  // 存档错误
  SAVE_NOT_FOUND = 'SAVE_NOT_FOUND',
  SAVE_LIMIT_EXCEEDED = 'SAVE_LIMIT_EXCEEDED',
  INVALID_SAVE_DATA = 'INVALID_SAVE_DATA',
  
  // AI 错误
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_TIMEOUT = 'AI_TIMEOUT',
  
  // 配置错误
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_MODEL = 'INVALID_MODEL'
}

// ==================== 请求类型 ====================

export interface CreateGameRequest {
  identity: string;
  model: string;
  apiKey?: string;
}

export interface ExecuteTurnRequest {
  choice?: {
    id: string;
    text: string;
  };
}

export interface CreateSaveRequest {
  name?: string;
}

export interface ImportSaveRequest {
  saveData: string;
}

// ==================== 响应类型 ====================

export interface CreateGameResponse {
  gameId: string;
  player: PlayerSummary;
  bondedNPCs: NPCSummary[];
  opening: string;
  state: GameStateSummary;
}

export interface PlayerSummary {
  id: string;
  identity: string;
  traits: string[];
  obsession: string;
}

export interface NPCSummary {
  id: string;
  name: string;
  traits: string[];
  isBonded: boolean;
}

export interface GameStateSummary {
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  weather: string;
}

export interface TurnResponse {
  turn: number;
  narrative: string;
  choices: ChoiceSummary[];
  result?: string;
  state: GameStateSummary;
  gameOver?: GameOverInfo;
}

export interface ChoiceSummary {
  id: string;
  text: string;
  type: 'normal' | 'hidden';
}

export interface GameOverInfo {
  type: 'death' | 'escape' | 'completed';
  reason: string;
  epilogue?: string;
}

export interface SaveSummary {
  id: string;
  name: string;
  timestamp: number;
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  isAutoSave: boolean;
}

export interface ConfigResponse {
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

// ==================== 游戏相关类型（简化版） ====================

interface Player {
  id: string;
  identity: string;
  traits: Trait[];
  obsession: string;
}

interface Trait {
  id: string;
  type: string;
}

interface NPC {
  id: string;
  name: string;
  traits: Trait[];
  isBonded: boolean;
}

interface GameState {
  turn: number;
  datetime: string;
  pressure: number;
  omega: number;
  weather: string;
  player: Player;
  npcs: NPC[];
}
