/**
 * 后端专属类型定义
 * 
 * 使用方式：
 * import type { ApiResponse, CreateGameRequest } from '../types';
 */

// API 响应和错误
export type {
  ApiResponse,
  ApiError,
  ResponseMeta,
  PaginationMeta,
  HttpStatus,
  ErrorCode
} from './api';

// 请求类型
export type {
  CreateGameRequest,
  ExecuteTurnRequest,
  CreateSaveRequest,
  ImportSaveRequest
} from './api';

// 响应类型
export type {
  CreateGameResponse,
  PlayerSummary,
  NPCSummary,
  GameStateSummary,
  TurnResponse,
  ChoiceSummary,
  GameOverInfo,
  SaveSummary,
  ConfigResponse,
  ModelInfo,
  IdentityInfo
} from './api';
