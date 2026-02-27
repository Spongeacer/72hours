/**
 * 游戏核心配置
 * 所有可调参数集中管理
 */

// ==================== 引力引擎配置 ====================
export const GRAVITY_CONFIG = {
  // 引力常数
  G: 0.8,
  
  // 压强调制系数
  PRESSURE_MULTIPLIER: 0.05,
  
  // 最小距离（防止除以0）
  MIN_DISTANCE: 0.1,
  
  // 最大引力限制
  MAX_FORCE: 10.0,
  
  // 移动缩放因子
  MOVEMENT_SCALE: 0.1,
  
  // 恐惧阈值（1-20范围，超过则逃离）
  FEAR_ESCAPE_THRESHOLD: 14,
  
  // 恐惧逃离速度倍率
  FEAR_ESCAPE_MULTIPLIER: 2.0,
  
  // K值跟随阈值（超过则更倾向跟随）
  KNOT_FOLLOW_THRESHOLD: 10,
  
  // K值跟随速度倍率
  KNOT_FOLLOW_MULTIPLIER: 1.5
};

// ==================== AI API 配置 ====================
export const AI_CONFIG = {
  // 默认提供商
  DEFAULT_PROVIDER: 'siliconflow',
  
  // 提供商配置
  PROVIDERS: {
    siliconflow: {
      name: 'SiliconFlow',
      apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
      defaultModel: 'Pro/MiniMaxAI/MiniMax-M2.5',
      defaultApiKey: ''
    },
    kimi: {
      name: 'Kimi',
      apiUrl: 'https://api.kimi.com/coding/v1/chat/completions',
      defaultModel: 'k2p5',
      defaultApiKey: ''
    }
  },
  
  // 默认模型参数
  DEFAULT_PARAMS: {
    model: 'Pro/MiniMaxAI/MiniMax-M2.5',
    temperature: 0.8,
    maxTokens: 400,
    systemPrompt: '你是一个涌现式叙事引擎。'
  }
};

// ==================== 游戏核心配置 ====================
export const GAME_CONFIG = {
  // 总回合数
  MAX_TURNS: 36,
  
  // 每回合小时数
  HOURS_PER_TURN: 2,
  
  // 初始时间
  START_DATE: '1851-01-08T00:00:00',
  
  // 初始压强 (1-20范围)
  INITIAL_PRESSURE: 2,
  
  // 初始Ω值 (1-20范围)
  INITIAL_OMEGA: 2,
  
  // 压强每回合增长
  PRESSURE_INCREASE: 0.16,
  
  // Ω基础增长
  OMEGA_BASE_INCREASE: 0.4,
  
  // 高压阈值（超过则Ω加速）
  HIGH_PRESSURE_THRESHOLD: 12,
  
  // 高压时Ω增长倍率
  OMEGA_HIGH_PRESSURE_MULTIPLIER: 1.02,
  
  // 压强上限
  MAX_PRESSURE: 20,
  
  // Ω上限
  MAX_OMEGA: 20
};

// ==================== NPC配置 ====================
export const NPC_CONFIG = {
  // 初始NPC总数
  TOTAL_NPC_COUNT: 10,
  
  // 初始解锁NPC数
  INITIAL_UNLOCKED_COUNT: 4,
  
  // 剧本事件解锁阈值（Ω值）
  STORY_EVENT_THRESHOLDS: {
    EVENT_2: 5,   // 解锁第5-8个NPC
    EVENT_3: 10,  // 解锁第9-10个NPC + 历史人物
    EVENT_4: 15   // 最终阶段
  },
  
  // 关键历史人物
  HISTORICAL_FIGURES: ['洪秀全', '杨秀清', '萧朝贵'],
  
  // NPC名字池
  NPC_NAME_POOL: [
    '母亲', '教书先生', '同窗好友', '邻家少女', '老猎人',
    '货郎', '寡妇', '赌徒', '郎中', '乞丐'
  ]
};

// ==================== 玩家配置 ====================
export const PLAYER_CONFIG = {
  // 可用身份
  IDENTITIES: {
    scholar: {
      name: '村中的读书人',
      baseMass: 3,
      pressureModifier: 0.8,
      initialStates: { fear: 6, aggression: 4, hunger: 8, injury: 1 },
      suitableTraits: ['calm', 'curious', 'honest', 'analytical', 'reserved', 'idealistic']
    },
    landlord: {
      name: '金田村的地主',
      baseMass: 6,
      pressureModifier: 1.0,
      initialStates: { fear: 8, aggression: 6, hunger: 4, injury: 1 },
      suitableTraits: ['greedy', 'ambitious', 'calculating', 'worldly', 'proud', 'pragmatic']
    },
    soldier: {
      name: '官府的士兵',
      baseMass: 5,
      pressureModifier: 1.2,
      initialStates: { fear: 4, aggression: 12, hunger: 10, injury: 1 },
      suitableTraits: ['brave', 'brutal', 'loyal', 'disciplined', 'callous', 'vigilant']
    },
    cultist: {
      name: '教会的受众',
      baseMass: 4,
      pressureModifier: 1.0,
      initialStates: { fear: 10, aggression: 8, hunger: 6, injury: 1 },
      suitableTraits: ['zealous', 'pious', 'fanatical', 'hopeful', 'fearful', 'devoted']
    }
  },
  
  // 执念池
  OBSESSIONS: [
    '但求苟全于乱世',
    '人不为己，天诛地灭',
    '我以我的力量所做的一切事情，包括一些罪恶，只是为了保护我的家人和我的朋友。',
    '守住祖传的家业',
    '寻找失散的兄弟',
    '扶清灭洋，尊孔复礼，消灭太平教',
    '驱除鞑虏，恢复中华，新造共和',
    '全世界无产者和被压迫民族联合起来'
  ],
  
  // 特质池
  TRAITS: [
    { id: 'calm', type: 'personality' },
    { id: 'curious', type: 'personality' },
    { id: 'brave', type: 'personality' },
    { id: 'greedy', type: 'personality' },
    { id: 'compassionate', type: 'personality' },
    { id: 'deceitful', type: 'personality' },
    { id: 'honest', type: 'personality' },
    { id: 'fearful', type: 'personality' }
  ],
  
  // 特质数量范围
  MIN_TRAITS: 2,
  MAX_TRAITS: 3,
  
  // 状态上限
  MAX_STATE_VALUE: 20,
  MIN_STATE_VALUE: 1
};

// ==================== 蝴蝶效应配置 ====================
export const BUTTERFLY_EFFECT_CONFIG = {
  // 基础线性增长（保证事件稳定触发）
  BASE_OMEGA_INCREASE: 0.4,  // 每回合固定增长
  
  // 玩家选择的额外加速（随机加成）
  // 无额外加速概率
  NO_BOOST_CHANCE: 0.3,
  
  // 轻微加速概率
  MINOR_BOOST_CHANCE: 0.3,
  
  // 显著加速概率（剩余部分）
  SIGNIFICANT_BOOST_CHANCE: 0.4,
  
  // 加速值
  BOOST_VALUES: {
    NO_BOOST: 0,
    MINOR: 0.1,
    SIGNIFICANT: 0.2
  }
};

// ==================== 服务器配置 ====================
export const SERVER_CONFIG = {
  PORT: 3000,
  VERSION: '2.0.0'
};

// 导出所有配置
export default {
  GRAVITY: GRAVITY_CONFIG,
  AI: AI_CONFIG,
  GAME: GAME_CONFIG,
  NPC: NPC_CONFIG,
  PLAYER: PLAYER_CONFIG,
  BUTTERFLY: BUTTERFLY_EFFECT_CONFIG,
  SERVER: SERVER_CONFIG
};
