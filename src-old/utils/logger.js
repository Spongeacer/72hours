/**
 * 日志系统
 * 使用简单的日志级别控制
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 从环境变量获取日志级别，默认为 INFO
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  error(message, ...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(`${this.prefix}[ERROR] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(`${this.prefix}[WARN] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix}[INFO] ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(`${this.prefix}[DEBUG] ${message}`, ...args);
    }
  }
}

// 创建默认 logger
const logger = new Logger('72Hours');

module.exports = {
  Logger,
  logger,
  LOG_LEVELS
};
