/**
 * 游戏核心配置
 * 所有可调参数集中管理
 * 
 * 注意：历史背景、剧本特定内容在 ScriptConfig.ts 中定义
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

  // 初始时间：1851年1月8日 18:00（金田起义前72小时）
  START_DATE: '1851-01-08T18:00:00',

  // 初始压强 (10/20)
  INITIAL_PRESSURE: 10,

  // 初始Ω值 (1-20范围)
  INITIAL_OMEGA: 2,

  // 压强每回合增长 (+1.5)
  PRESSURE_INCREASE: 1.5,

  // Ω基础增长
  OMEGA_BASE_INCREASE: 0.4,

  // 高压阈值（超过则Ω加速）
  HIGH_PRESSURE_THRESHOLD: 12,

  // 高压时Ω增长倍率
  OMEGA_HIGH_PRESSURE_MULTIPLIER: 1.02,

  // 压强上限
  MAX_PRESSURE: 20,

  // Ω上限
  MAX_OMEGA: 20,

  // 压强配置
  PRESSURE: {
    INITIAL: 10,        // 起始 10/20
    BASE_GROWTH: 1.5,   // 每回合 +1.5
    VIOLENCE_BONUS: 0.5,
    MAX: 20,            // 上限 20/20
    EXPONENTIAL_THRESHOLD: 12
  },

  // Ω配置
  OMEGA: {
    INITIAL: 2,
    LINEAR_GROWTH: 0.4,
    EXPONENTIAL_THRESHOLD: 12,
    EXPONENTIAL_BASE: 1.02,
    MAX: 20
  },

  // 网格配置
  GRID_SIZE: 10,

  // 特质配置
  TRAIT_CONFIG: {
    MIN_TRAITS: 2,
    MAX_TRAITS: 4
  },

  // 性格特质库
  PERSONALITY_TRAITS: {
    calm: { name: '冷静', description: '在压力下保持清醒' },
    curious: { name: '好奇', description: '对未知充满探索欲' },
    honest: { name: '诚实', description: '不愿欺骗他人' },
    analytical: { name: '分析', description: '善于逻辑思考' },
    reserved: { name: '内敛', description: '不轻易表露情感' },
    idealistic: { name: '理想主义', description: '相信美好的可能' },
    greedy: { name: '贪婪', description: '追求物质利益' },
    ambitious: { name: '野心', description: '渴望权力地位' },
    calculating: { name: '算计', description: '精于利益权衡' },
    worldly: { name: '世故', description: '懂得人情冷暖' },
    proud: { name: '骄傲', description: '自尊心强' },
    pragmatic: { name: '务实', description: '注重实际效果' },
    brave: { name: '勇敢', description: '敢于面对危险' },
    brutal: { name: '残忍', description: '对敌人毫不留情' },
    loyal: { name: '忠诚', description: '坚守承诺' },
    disciplined: { name: '纪律', description: '严格遵守规则' },
    callous: { name: '冷酷', description: '不被情感左右' },
    vigilant: { name: '警惕', description: '时刻保持警觉' },
    zealous: { name: '狂热', description: '对信仰极度虔诚' },
    pious: { name: '虔诚', description: '敬畏神灵' },
    fanatical: { name: '极端', description: '为信仰不惜一切' },
    hopeful: { name: '希望', description: '相信未来会更好' },
    fearful: { name: '恐惧', description: '对危险敏感' },
    devoted: { name: '奉献', description: '愿意为信仰牺牲' },
    // 新增特质
    wise: { name: '智慧', description: '拥有丰富的人生经验' },
    patient: { name: '耐心', description: '能够等待最佳时机' },
    respected: { name: '受尊敬', description: '获得他人敬重' },
    traditional: { name: '传统', description: '坚守旧有规矩' },
    authoritative: { name: '权威', description: '具有领导气质' },
    experienced: { name: '老练', description: '经历丰富，处事圆滑' },
    sociable: { name: '善交际', description: '善于与人打交道' },
    shrewd: { name: '精明', description: '善于判断形势' },
    tolerant: { name: '宽容', description: '能够包容他人' },
    observant: { name: '善于观察', description: '留意细节' },
    hospitable: { name: '好客', description: '热情招待客人' },
    enlightened: { name: '开悟', description: '拥有超脱的智慧' },
    ascetic: { name: '苦行', description: '能够忍受艰苦' },
    prophetic: { name: '预言', description: '似乎能预见未来' },
    serene: { name: '宁静', description: '内心平和' },
    spiritual: { name: '灵性', description: '与精神世界连接' },
    detached: { name: '超脱', description: '不被世俗牵绊' },
    desperate: { name: '绝望', description: '处于绝境之中' },
    protective: { name: '保护欲', description: '想要保护他人' },
    resilient: { name: '坚韧', description: '能够承受打击' },
    loving: { name: '慈爱', description: '充满爱心' },
    determined: { name: '坚定', description: '意志坚强' },
    vulnerable: { name: '脆弱', description: '容易受伤' },
    stubborn: { name: '固执', description: '坚持己见' },
    strong: { name: '强壮', description: '身体强健' },
    hardworking: { name: '勤劳', description: '努力工作' },
    principled: { name: '有原则', description: '坚守底线' },
    independent: { name: '独立', description: '不依赖他人' },
    skilled: { name: '熟练', description: '技艺精湛' },
    intuitive: { name: '直觉', description: '凭直觉行事' },
    eloquent: { name: '口才', description: '善于言辞' },
    enigmatic: { name: '莫测', description: '难以捉摸' },
    perceptive: { name: '敏锐', description: '洞察力强' },
    cunning: { name: '狡猾', description: '善于谋略' },
    guilty: { name: '内疚', description: '心怀愧疚' },
    wary: { name: '谨慎', description: '小心翼翼' },
    secretive: { name: '隐秘', description: '保守秘密' },
    traumatized: { name: '创伤', description: '受过心理创伤' },
    committed: { name: '坚定', description: '忠于信念' },
    ruthless: { name: '无情', description: '不择手段' },
    intelligent: { name: '聪明', description: '智力出众' },
    charming: { name: '迷人', description: '具有魅力' },
    adaptable: { name: '适应', description: '善于适应环境' },
    resourceful: { name: '机智', description: '善于应变' },
    innocent: { name: '天真', description: '纯真无邪' },
    childlike: { name: '童真', description: '保持童心' },
    content: { name: '满足', description: '知足常乐' },
    unpredictable: { name: '难以预测', description: '行为不定' },
    pure: { name: '纯洁', description: '心灵纯净' },
    mysterious: { name: '神秘', description: '充满谜团' },
    // 府衙清军特质
    cruel: { name: '残忍', description: '冷酷无情，嗜血成性' },
    oppressive: { name: '压迫', description: '喜欢欺压弱小' },
    corrupt: { name: '腐败', description: '贪婪成性，中饱私囊' },
    violent: { name: '暴力', description: '崇尚武力，动辄动手' },
    domineering: { name: '霸道', description: '横行霸道，不可一世' },
    fearsome: { name: '可怖', description: '令人恐惧，望而生畏' }
  }
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

  // 关键历史人物（从剧本配置读取）
  // HISTORICAL_FIGURES: ['洪秀全', '杨秀清', '萧朝贵'],

  // NPC预设模板（身份预设，特质随机）
  NPC_TEMPLATES: [
    {
      id: 'village_elder',
      role: '村中长老',
      description: '金田村最有威望的老人，见证过太多风浪',
      baseMass: 5,
      suitableTraits: ['wise', 'cautious', 'worldly', 'proud', 'patient', 'respected', 'traditional', 'authoritative', 'experienced', 'calm']
    },
    {
      id: 'tavern_keeper',
      role: '酒馆老板',
      description: '消息灵通，三教九流都要给他面子',
      baseMass: 4,
      suitableTraits: ['worldly', 'greedy', 'curious', 'deceitful', 'sociable', 'shrewd', 'tolerant', 'observant', 'calculating', 'hospitable']
    },
    {
      id: 'wandering_monk',
      role: '游方僧人',
      description: '云游至此，似乎知道一些未来的事',
      baseMass: 3,
      suitableTraits: ['calm', 'mysterious', 'compassionate', 'honest', 'enlightened', 'ascetic', 'prophetic', 'serene', 'spiritual', 'detached']
    },
    {
      id: 'refugee_woman',
      role: '逃难妇人',
      description: '从北方逃难而来，带着孩子',
      baseMass: 2,
      suitableTraits: ['fearful', 'desperate', 'protective', 'hopeful', 'resilient', 'cautious', 'loving', 'determined', 'vulnerable', 'brave']
    },
    {
      id: 'blacksmith',
      role: '铁匠',
      description: '村里唯一的铁匠，太平军想拉拢他',
      baseMass: 6,
      suitableTraits: ['brave', 'stubborn', 'loyal', 'pragmatic', 'strong', 'honest', 'hardworking', 'principled', 'independent', 'skilled']
    },
    {
      id: 'fortune_teller',
      role: '算命先生',
      description: '据说能看透人心，但没人知道他的来历',
      baseMass: 3,
      suitableTraits: ['mysterious', 'deceitful', 'observant', 'calm', 'intuitive', 'eloquent', 'enigmatic', 'perceptive', 'cunning', 'wise']
    },
    {
      id: 'deserter_soldier',
      role: '逃兵',
      description: '从清军逃出来的，知道一些军情',
      baseMass: 5,
      suitableTraits: ['fearful', 'guilty', 'brave', 'cynical', 'wary', 'secretive', 'traumatized', 'pragmatic', 'loyal', 'desperate']
    },
    {
      id: 'taiping_spy',
      role: '太平军探子',
      description: '潜伏在村里，等待起义的信号',
      baseMass: 4,
      suitableTraits: ['zealous', 'deceitful', 'brave', 'fanatical', 'disciplined', 'secretive', 'committed', 'observant', 'ruthless', 'determined']
    },
    {
      id: 'merchant_daughter',
      role: '商人之女',
      description: '家里做盐货生意，消息灵通',
      baseMass: 3,
      suitableTraits: ['curious', 'ambitious', 'worldly', 'proud', 'intelligent', 'independent', 'charming', 'calculating', 'adaptable', 'resourceful']
    },
    {
      id: 'village_idiot',
      role: '村中痴儿',
      description: '大家都说他傻，但他似乎知道一些秘密',
      baseMass: 2,
      suitableTraits: ['mysterious', 'calm', 'honest', 'simple', 'innocent', 'perceptive', 'childlike', 'content', 'unpredictable', 'pure']
    },
    {
      id: 'qing_soldier',
      role: '府衙清军',
      description: '奉官府之命搜刮粮草，凶狠蛮横，村民闻风丧胆',
      baseMass: 7,
      suitableTraits: ['brutal', 'callous', 'greedy', 'cruel', 'oppressive', 'corrupt', 'violent', 'domineering', 'ruthless', 'fearsome']
    }
  ],

  // NPC名字池（从剧本配置读取）
  // NAME_GENERATION_PROMPT: '...',

  // NPC执念生成提示（从剧本配置读取）
  // OBSESSION_GENERATION_PROMPT: '...',
};

// ==================== 玩家配置 ====================
export const PLAYER_CONFIG = {
  // 可用身份（6个新身份）
  IDENTITIES: {
    // 穷酸书生
    scholar: {
      name: '穷酸书生',
      baseMass: 3,
      pressureModifier: 0.8,
      initialStates: { fear: 6, aggression: 4, hunger: 8, injury: 1 },
      suitableTraits: ['calm', 'curious', 'honest', 'analytical', 'reserved', 'idealistic']
    },
    // 憨厚农民
    farmer: {
      name: '憨厚农民',
      baseMass: 5,
      pressureModifier: 0.9,
      initialStates: { fear: 7, aggression: 5, hunger: 6, injury: 2 },
      suitableTraits: ['honest', 'hardworking', 'strong', 'patient', 'pragmatic', 'resilient']
    },
    // 精明商人
    merchant: {
      name: '精明商人',
      baseMass: 4,
      pressureModifier: 0.9,
      initialStates: { fear: 8, aggression: 5, hunger: 5, injury: 1 },
      suitableTraits: ['greedy', 'calculating', 'worldly', 'shrewd', 'adaptable', 'eloquent']
    },
    // 退伍老兵
    soldier: {
      name: '退伍老兵',
      baseMass: 6,
      pressureModifier: 1.1,
      initialStates: { fear: 4, aggression: 10, hunger: 7, injury: 3 },
      suitableTraits: ['brave', 'disciplined', 'vigilant', 'experienced', 'loyal', 'callous']
    },
    // 江湖郎中
    doctor: {
      name: '江湖郎中',
      baseMass: 3,
      pressureModifier: 0.8,
      initialStates: { fear: 6, aggression: 3, hunger: 6, injury: 1 },
      suitableTraits: ['compassionate', 'observant', 'calm', 'intuitive', 'wise', 'detached']
    },
    // 绿林好汉
    bandit: {
      name: '绿林好汉',
      baseMass: 5,
      pressureModifier: 1.0,
      initialStates: { fear: 5, aggression: 12, hunger: 8, injury: 2 },
      suitableTraits: ['brave', 'brutal', 'cunning', 'resourceful', 'independent', 'ruthless']
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
// 版本号从 package.json 读取
import { version as VERSION } from '../../package.json';

export const SERVER_CONFIG = {
  PORT: 3000,
  VERSION
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
