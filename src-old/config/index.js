/**
 * 统一配置管理
 * 集中管理所有游戏配置
 */

// 游戏基础配置
const GAME_CONFIG = {
  // 网格与世界
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  START_DATE: new Date('1851-01-08T00:00:00'),
  
  // 物理参数
  GRAVITY: {
    G: 0.8,
    PRESSURE_MULTIPLIER: 0.05
  },
  
  // 压强系统
  PRESSURE: {
    BASE_GROWTH: 0.8,
    VIOLENCE_BONUS: 5,
    THRESHOLD_RAID: 50,
    THRESHOLD_DIVINE: 60
  },
  
  // 全局因子 Ω
  OMEGA: {
    INITIAL: 1.0,
    LINEAR_GROWTH: 0.02,
    EXPONENTIAL_THRESHOLD: 60,
    EXPONENTIAL_BASE: 1.05,
    MAX: 5.0
  },
  
  // 质量系统
  MASS: {
    BASE: {
      ELITE: 5,
      NORMAL: 2,
      PLAYER: 3
    },
    STORY_PER_EVENT: 0.1,
    KNOT_PER_INTERACTION: 0.5,
    OBJECT_KEY: 3,
    OBJECT_NORMAL: 1
  },
  
  // 引力陷阱
  TRAP: {
    INITIAL: 0,
    BONUS_PER_DEEP_EVENT: 1.0,
    DECAY_RATE: 0.1,
    MAX: 5.0
  },
  
  // NPC移动
  MOVEMENT: {
    FEAR_ESCAPE_THRESHOLD: 70,
    FEAR_BIAS_FACTOR: 0.5,
    RANDOM_WALK_RANGE: 2
  },
  
  // 状态阈值
  STATES: {
    FEAR_ESCAPE: 70,
    AGGRESSION_VIOLENT: 70,
    HUNGER_DESPERATE: 70,
    INJURY_FATAL: 100
  }
};

// 身份配置
const IDENTITIES = {
  SCHOLAR: {
    id: 'scholar',
    name: '村中的读书人',
    baseMass: 3,
    traits: ['scholar'],
    pressureModifier: 0.8,
    initialStates: { fear: 30, aggression: 20, hunger: 40, injury: 0 }
  },
  LANDLORD: {
    id: 'landlord',
    name: '金田村的地主',
    baseMass: 6,
    traits: ['wealthy', 'landlord'],
    pressureModifier: 1.0,
    initialStates: { fear: 40, aggression: 30, hunger: 20, injury: 0 }
  },
  SOLDIER: {
    id: 'soldier',
    name: '官府的士兵',
    baseMass: 5,
    traits: ['soldier'],
    pressureModifier: 1.2,
    initialStates: { fear: 20, aggression: 60, hunger: 50, injury: 0 }
  },
  CULTIST: {
    id: 'cultist',
    name: '教会的受众',
    baseMass: 4,
    traits: ['cultist'],
    pressureModifier: 1.0,
    initialStates: { fear: 50, aggression: 40, hunger: 30, injury: 0 }
  }
};

// AI 模型配置
const AI_MODELS = {
  MINIMAX: {
    id: 'Pro/MiniMaxAI/MiniMax-M2.5',
    name: 'MiniMax-M2.5',
    description: '速度快',
    recommended: true
  },
  DEEPSEEK: {
    id: 'deepseek-ai/DeepSeek-V3.2',
    name: 'DeepSeek-V3.2',
    description: '质量好，较慢',
    recommended: false
  }
};

// 天气配置
const WEATHER = {
  TYPES: ['clear', 'rain', 'fog', 'night'],
  TRANSITION: {
    hour6_18: 'clear',
    hour20_5: 'night',
    default: 'fog'
  }
};

// 导出
module.exports = {
  GAME_CONFIG,
  IDENTITIES,
  AI_MODELS,
  WEATHER,
  
  // 辅助函数
  getIdentityConfig(id) {
    return Object.values(IDENTITIES).find(i => i.id === id) || IDENTITIES.SCHOLAR;
  },
  
  getModelConfig(id) {
    return Object.values(AI_MODELS).find(m => m.id === id) || AI_MODELS.MINIMAX;
  }
};
