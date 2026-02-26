"use strict";
/**
 * API 类型定义
 * 统一响应格式
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.HttpStatus = void 0;
// ==================== HTTP 状态码 ====================
var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OK"] = 200] = "OK";
    HttpStatus[HttpStatus["CREATED"] = 201] = "CREATED";
    HttpStatus[HttpStatus["NO_CONTENT"] = 204] = "NO_CONTENT";
    HttpStatus[HttpStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatus[HttpStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatus[HttpStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatus[HttpStatus["CONFLICT"] = 409] = "CONFLICT";
    HttpStatus[HttpStatus["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatus[HttpStatus["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    HttpStatus[HttpStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HttpStatus[HttpStatus["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(HttpStatus || (exports.HttpStatus = HttpStatus = {}));
// ==================== 错误码 ====================
var ErrorCode;
(function (ErrorCode) {
    // 通用错误
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // 游戏错误
    ErrorCode["GAME_NOT_FOUND"] = "GAME_NOT_FOUND";
    ErrorCode["GAME_ALREADY_OVER"] = "GAME_ALREADY_OVER";
    ErrorCode["INVALID_IDENTITY"] = "INVALID_IDENTITY";
    ErrorCode["INVALID_CHOICE"] = "INVALID_CHOICE";
    // 存档错误
    ErrorCode["SAVE_NOT_FOUND"] = "SAVE_NOT_FOUND";
    ErrorCode["SAVE_LIMIT_EXCEEDED"] = "SAVE_LIMIT_EXCEEDED";
    ErrorCode["INVALID_SAVE_DATA"] = "INVALID_SAVE_DATA";
    // AI 错误
    ErrorCode["AI_GENERATION_FAILED"] = "AI_GENERATION_FAILED";
    ErrorCode["AI_TIMEOUT"] = "AI_TIMEOUT";
    // 配置错误
    ErrorCode["MISSING_API_KEY"] = "MISSING_API_KEY";
    ErrorCode["INVALID_MODEL"] = "INVALID_MODEL";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
//# sourceMappingURL=api.js.map