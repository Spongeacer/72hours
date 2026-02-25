/**
 * 72Hours 游戏常量配置（优化版）
 */

const GAME_CONFIG = {
  // 网格与世界
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  START_DATE: new Date('1851-01-08T00:00:00'),
  
  // 物理参数
  GRAVITY: {
    G: 10.0,                    // 引力常数，放大10倍便于计算
    PRESSURE_MULTIPLIER: 0.05   // 压强调制系数
  },
  
  // 压强系统
  PRESSURE: {
    BASE_GROWTH: 1.0,           // 每回合基础增长
    VIOLENCE_BONUS: 10,         // 暴力行为增加
    THRESHOLD_RAID: 50,         // 官兵搜查阈值
    THRESHOLD_DIVINE: 60        // 天父下凡阈值
  },
  
  // 全局因子 Ω
  OMEGA: {
    INITIAL: 1.0,
    GROWTH_RATE: 0.02,
    EXPONENTIAL_THRESHOLD: 60,   // 60回合后开始指数增长
    MAX: 5.0                     // 最大Ω值
  },
  
  // 质量系统
  MASS: {
    BASE_RANGE: { min: 1, max: 10 },
    STORY_PER_EVENT: 1,          // 每个事件增加1
    KNOT_PER_INTERACTION: 0.5,   // 每次交互增加0.5
    OBJECT_TRANSFER: true
  },
  
  // 引力陷阱
  TRAP: {
    INITIAL: 0,
    BONUS_PER_DEEP_EVENT: 1.0,   // 深度交互增加1
    DECAY_RATE: 0.1,             // 每回合衰减10%
    MAX: 5.0                     // 最大陷阱值
  },
  
  // NPC移动
  MOVEMENT: {
    FEAR_ESCAPE_THRESHOLD: 70,   // 恐惧逃跑阈值
    FEAR_BIAS_FACTOR: 0.5,       // 恐惧偏向系数
    RANDOM_WALK_RANGE: 2         // 随机移动范围
  },
  
  // 行为倾向权重
  BEHAVIOR: {
    SEIZURE: {
      greed: 0.4,
      fear: 0.2,
      hasValuableItem: 0.3,
      highPressure: 0.2,
      massAdvantage: 0.2,
      base: 0.1
    },
    CONFLICT: {
      hostility: 0.5,
      bloodlust: 0.3,
      highAggression: 0.3,
      extremePressure: 0.2,
      betrayalMemory: 0.4,
      base: 0.05
    },
    EAVESDROP: {
      curious: 0.3,
      deceitful: 0.3,
      obsessionTreasure: 0.2,
      highMassTarget: 0.2,
      coverCondition: 0.2,
      base: 0.15
    },
    CONVERSATION: {
      base: 0.3,
      existingKnot: 0.3,
      highFear: 0.2,
      lowPressure: 0.2,
      traitMatch: 0.3
    },
    REQUEST: {
      highFear: 0.3,
      highHunger: 0.3,
      targetCompassion: 0.3,
      deepKnot: 0.3,
      base: 0.1
    },
    GIVE: {
      compassion: 0.3,
      deepKnot: 0.4,
      protectObsession: 0.4,
      gratitudeMemory: 0.5,
      base: 0.05
    }
  },
  
  // 状态阈值
  STATES: {
    FEAR_ESCAPE: 70,
    AGGRESSION_VIOLENT: 70,
    HUNGER_DESPERATE: 70,
    INJURY_FATAL: 100
  },
  
  // 天气轮换
  WEATHER: {
    TYPES: ['clear', 'rain', 'fog', 'night'],
    TRANSITION: {
      hour6_18: 'clear',
      hour20_5: 'night',
      default: 'fog'
    }
  },
  
  // 玩家身份
  IDENTITIES: {
    SCHOLAR: {
      id: 'scholar',
      name: '村中的读书人',
      baseMass: 3,
      trait: 'scholar',
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
      trait: 'soldier',
      pressureModifier: 1.2,
      initialStates: { fear: 20, aggression: 60, hunger: 50, injury: 0 }
    },
    CULTIST: {
      id: 'cultist',
      name: '教会的受众',
      baseMass: 4,
      trait: 'cultist',
      pressureModifier: 1.0,
      initialStates: { fear: 50, aggression: 40, hunger: 30, injury: 0 }
    }
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_CONFIG };
}
