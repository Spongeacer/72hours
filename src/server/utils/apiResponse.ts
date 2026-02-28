/**
 * API 响应统一格式
 */

import { randomUUID } from 'crypto';
import { getCurrentIdentityIds } from '../../config/ScriptConfig';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId()
    }
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId()
    }
  };
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return randomUUID();
}

/**
 * 验证游戏ID格式
 */
export function validateGameId(gameId: string): boolean {
  return /^game_\d+_[a-z0-9]+$/.test(gameId);
}

/**
 * 验证选择对象
 */
export function validateChoice(choice: any): { valid: boolean; error?: string } {
  if (!choice || typeof choice !== 'object') {
    return { valid: false, error: '选择必须是对象' };
  }
  
  if (!choice.id || typeof choice.id !== 'string') {
    return { valid: false, error: '选择缺少 id 字段' };
  }
  
  if (!choice.text || typeof choice.text !== 'string') {
    return { valid: false, error: '选择缺少 text 字段' };
  }
  
  return { valid: true };
}

/**
 * 验证身份类型
 * 从当前剧本配置中动态获取有效身份列表
 */
export function validateIdentity(identity: string): boolean {
  return getCurrentIdentityIds().includes(identity);
}

/**
 * 验证模型名称
 */
export function validateModel(model: string): boolean {
  const validModels = [
    'Pro/MiniMaxAI/MiniMax-M2.5',
    'deepseek-ai/DeepSeek-V3.2'
  ];
  return validModels.includes(model);
}
