/**
 * 统一配置管理
 */

const config = {
  // 游戏配置
  game: {
    maxTurns: 72,
    initialPressure: 10,
    initialOmega: 1.0,
    startDate: '1851-01-08T00:00:00',
    
    // 质量系统
    mass: {
      baseRange: { min: 2, max: 6 },
      storyBonus: 0.5,    // 每回合增加
      knotBonus: 0.3,     // 每次深度交互
      objectMultiplier: 1.0
    },
    
    // 压强系统
    pressure: {
      initial: 10,
      growthRate: 0.8,    // 每回合增长
      max: 100
    },
    
    // 全局因子
    omega: {
      initial: 1.0,
      growthRate: 0.02,   // 前期线性增长
      exponentialThreshold: 60,  // 60回合后指数增长
      exponentialRate: 0.05
    }
  },

  // AI 配置
  ai: {
    defaultProvider: 'siliconflow',
    model: 'deepseek-ai/DeepSeek-V3.2',
    temperature: 0.8,
    maxTokens: 500,
    timeout: 30000,  // 30秒超时
    
    // 流式配置
    stream: {
      enabled: true,
      chunkDelay: 50  // 模拟打字机效果的延迟
    }
  },

  // 特质配置
  traits: {
    maxPerCharacter: 3,
    
    // 特质类型权重（用于随机选择）
    weights: {
      boldness: 1,
      temperament: 1,
      desire: 1,
      sociability: 1,
      morality: 1,
      zeal: 0.5
    }
  },

  // 角色生成配置
  character: {
    ageRange: { min: 20, max: 50 },
    maxItems: 3,
    maxRelations: 2
  },

  // NPC 配置
  npc: {
    bondedCount: 2,     // 每个玩家初始关联NPC数
    eliteCount: 5,      // 精英NPC数量
    unlockThreshold: {  // 解锁条件
      minTurn: 40,
      minPressure: 50
    }
  },

  // 存储配置
  storage: {
    prefix: '72hours_',
    sessionKey: 'sessionId',
    identityKey: 'identity',
    traitsKey: 'traits',
    gameDataKey: 'gameData'
  }
};

/**
 * 获取配置
 * @param {string} path - 配置路径，如 'game.maxTurns'
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

/**
 * 合并配置
 * @param {Object} customConfig - 自定义配置
 */
function mergeConfig(customConfig) {
  Object.assign(config, customConfig);
}

module.exports = { config, getConfig, mergeConfig };
