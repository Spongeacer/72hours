"use strict";
/**
 * API 响应统一格式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.validateGameId = validateGameId;
exports.validateChoice = validateChoice;
exports.validateIdentity = validateIdentity;
exports.validateModel = validateModel;
/**
 * 创建成功响应
 */
function createSuccessResponse(data, requestId) {
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
function createErrorResponse(code, message, details, requestId) {
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
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * 验证游戏ID格式
 */
function validateGameId(gameId) {
    return /^game_\d+_[a-z0-9]+$/.test(gameId);
}
/**
 * 验证选择对象
 */
function validateChoice(choice) {
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
 */
function validateIdentity(identity) {
    return ['scholar', 'landlord', 'soldier', 'cultist'].includes(identity);
}
/**
 * 验证模型名称
 */
function validateModel(model) {
    const validModels = [
        'Pro/MiniMaxAI/MiniMax-M2.5',
        'deepseek-ai/DeepSeek-V3.2'
    ];
    return validModels.includes(model);
}
//# sourceMappingURL=apiResponse.js.map