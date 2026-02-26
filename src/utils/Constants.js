/**
 * 72Hours 游戏常量配置（优化版 - 基于 DESIGN.md v1.1）
 */

const GAME_CONFIG = {
  // 网格与世界
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  START_DATE: new Date('1851-01-08T00:00:00'),
  
  // 物理参数 - 优化后的数值
  GRAVITY: {
    G: 0.8,                     // 引力常数（调整为更合理的范围）
    PRESSURE_MULTIPLIER: 0.05   // 压强调制系数
  },
  
  // 压强系统 - 优化后的数值
  PRESSURE: {
    BASE_GROWTH: 0.8,           // 每回合基础增长（72回合后约67）
    VIOLENCE_BONUS: 5,          // 暴力行为增加
    THRESHOLD_RAID: 50,         // 官兵搜查阈值
    THRESHOLD_DIVINE: 60        // 天父下凡阈值
  },
  
  // 全局因子 Ω - 优化后的数值
  OMEGA: {
    INITIAL: 1.0,
    LINEAR_GROWTH: 0.02,         // 线性阶段每回合增长
    EXPONENTIAL_THRESHOLD: 60,   // 60回合后开始指数增长
    EXPONENTIAL_BASE: 1.05,      // 指数增长基数
    MAX: 5.0                     // 最大Ω值
  },
  
  // 质量系统 - 优化后的数值
  MASS: {
    BASE: {
      ELITE: 5,                  // 精英NPC基础质量
      NORMAL: 2,                 // 普通NPC基础质量
      PLAYER: 3                  // 玩家基础质量
    },
    STORY_PER_EVENT: 0.1,        // 每个事件增加0.1
    KNOT_PER_INTERACTION: 0.5,   // 每次深度交互增加0.5
    OBJECT_KEY: 3,               // 关键道具加成
    OBJECT_NORMAL: 1             // 普通道具加成
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
      initialStates: { fear: 30, aggression: 20, hunger: 40, injury: 0 },
      // 读书人适合的特质
      suitableTraits: ['calm', 'curious', 'honest', 'analytical', 'reserved', 'idealistic']
    },
    LANDLORD: {
      id: 'landlord',
      name: '金田村的地主',
      baseMass: 6,
      traits: ['wealthy', 'landlord'],
      pressureModifier: 1.0,
      initialStates: { fear: 40, aggression: 30, hunger: 20, injury: 0 },
      // 地主适合的特质
      suitableTraits: ['greedy', 'ambitious', 'calculating', 'worldly', 'proud', 'pragmatic']
    },
    SOLDIER: {
      id: 'soldier',
      name: '官府的士兵',
      baseMass: 5,
      trait: 'soldier',
      pressureModifier: 1.2,
      initialStates: { fear: 20, aggression: 60, hunger: 50, injury: 0 },
      // 士兵适合的特质
      suitableTraits: ['brave', 'brutal', 'loyal', 'disciplined', 'callous', 'vigilant']
    },
    CULTIST: {
      id: 'cultist',
      name: '教会的受众',
      baseMass: 4,
      trait: 'cultist',
      pressureModifier: 1.0,
      initialStates: { fear: 50, aggression: 40, hunger: 30, injury: 0 },
      // 教徒适合的特质
      suitableTraits: ['zealous', 'pious', 'fanatical', 'hopeful', 'fearful', 'devoted']
    }
  },

  // 通用性格特质库（用于随机抽取）
  PERSONALITY_TRAITS: {
    // 冷静类
    calm: { name: '冷静', description: '在压力下保持理智' },
    analytical: { name: '善分析', description: '善于观察和推理' },
    reserved: { name: '内敛', description: '不轻易表露情感' },
    
    // 好奇类
    curious: { name: '好奇', description: '对未知充满兴趣' },
    idealistic: { name: '理想主义', description: '相信世界可以更好' },
    
    // 勇敢类
    brave: { name: '勇敢', description: '面对危险不退缩' },
    loyal: { name: '忠诚', description: '对信任的人坚定不移' },
    disciplined: { name: '自律', description: '严格遵守规矩' },
    
    // 贪婪类
    greedy: { name: '贪婪', description: '渴望财富和权力' },
    ambitious: { name: '野心勃勃', description: '追求更高的地位' },
    calculating: { name: '精于算计', description: '每一步都深思熟虑' },
    
    // 残忍类
    brutal: { name: '残忍', description: '对他人痛苦漠不关心' },
    callous: { name: '冷酷', description: '情感冷漠' },
    
    // 虔诚类
    zealous: { name: '狂热', description: '对信仰极度执着' },
    pious: { name: '虔诚', description: '严格遵守教义' },
    fanatical: { name: '极端', description: '为信仰可以牺牲一切' },
    devoted: { name: '忠诚', description: '全身心投入信仰' },
    
    // 恐惧类
    fearful: { name: '胆怯', description: '容易被恐惧支配' },
    craven: { name: '懦弱', description: '在危险面前退缩' },
    
    // 狡猾类
    deceitful: { name: '狡猾', description: '善于欺骗和隐瞒' },
    worldly: { name: '世故', description: '深谙人情世故' },
    pragmatic: { name: '务实', description: '只关心实际利益' },
    
    // 善良类
    honest: { name: '诚实', description: '不说谎，不欺骗' },
    compassionate: { name: '慈悲', description: '对他人苦难感同身受' },
    hopeful: { name: '乐观', description: '相信未来会更好' },
    
    // 傲慢类
    proud: { name: '骄傲', description: '自尊心强' },
    arrogant: { name: '傲慢', description: '看不起他人' },
    
    // 警惕类
    vigilant: { name: '警惕', description: '时刻保持警觉' },
    paranoid: { name: '多疑', description: '怀疑一切' },
    
    // 神秘/超自然类
    mystical: { name: '神秘', description: '对超自然现象敏感' },
    insane: { name: '精神错乱', description: '能看到常人看不到的东西' },
    prophetic: { name: '预言', description: '偶尔能看到未来的碎片' },
    cursed: { name: '诅咒', description: '身上带着某种诅咒' },
    
    // 特殊类
    addicted: { name: '成瘾', description: '对某种物质或行为上瘾' },
    amnesiac: { name: '失忆', description: '忘记了自己的过去' },
    haunted: { name: '被附身', description: '体内有另一个存在' },
    immortal: { name: '不死', description: '无法死亡，但会感受痛苦' }
  },

  // 特质数量配置
  TRAIT_CONFIG: {
    MIN_TRAITS: 2,  // 最少性格特质数
    MAX_TRAITS: 3   // 最多性格特质数
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_CONFIG };
}
