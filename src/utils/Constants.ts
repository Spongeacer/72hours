/**
 * 游戏常量配置
 * 注意：GAME_CONFIG已移至 src/config/GameConfig.ts
 * 此文件保留身份、特质、AI模型等配置
 */

import { Identity, PersonalityTrait } from '../shared/types';

// 注意：以下配置已移至 src/config/GameConfig.ts
// - GAME_CONFIG (游戏核心配置)
// - GRAVITY_CONFIG (引力引擎配置)
// - NPC_CONFIG (NPC配置)
// - PLAYER_CONFIG (玩家配置)
// 
// 此文件保留：
// - IDENTITIES (身份详细定义)
// - PERSONALITY_TRAITS (性格特质库)
// - AI_MODELS (AI模型配置)
// - WEATHER (天气配置)

// 玩家身份配置
export const IDENTITIES: Record<string, Identity> = {
  SCHOLAR: {
    id: 'scholar',
    name: '村中的读书人',
    baseMass: 3,
    trait: 'scholar',
    pressureModifier: 0.8,
    initialStates: { fear: 6, aggression: 4, hunger: 8, injury: 1 },
    suitableTraits: ['calm', 'curious', 'honest', 'analytical', 'reserved', 'idealistic']
  },
  LANDLORD: {
    id: 'landlord',
    name: '金田村的地主',
    baseMass: 6,
    traits: ['wealthy', 'landlord'],
    pressureModifier: 1.0,
    initialStates: { fear: 8, aggression: 6, hunger: 4, injury: 1 },
    suitableTraits: ['greedy', 'ambitious', 'calculating', 'worldly', 'proud', 'pragmatic']
  },
  SOLDIER: {
    id: 'soldier',
    name: '官府的士兵',
    baseMass: 5,
    trait: 'soldier',
    pressureModifier: 1.2,
    initialStates: { fear: 4, aggression: 12, hunger: 10, injury: 1 },
    suitableTraits: ['brave', 'brutal', 'loyal', 'disciplined', 'callous', 'vigilant']
  },
  CULTIST: {
    id: 'cultist',
    name: '教会的受众',
    baseMass: 4,
    trait: 'cultist',
    pressureModifier: 1.0,
    initialStates: { fear: 10, aggression: 8, hunger: 6, injury: 1 },
    suitableTraits: ['zealous', 'pious', 'fanatical', 'hopeful', 'fearful', 'devoted']
  }
};

// 性格特质库
export const PERSONALITY_TRAITS: Record<string, PersonalityTrait> = {
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
};

// AI 模型配置
export const AI_MODELS = {
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
export const WEATHER = {
  TYPES: ['clear', 'rain', 'fog', 'night'],
  TRANSITION: {
    hour6_18: 'clear',
    hour20_5: 'night',
    default: 'fog'
  }
};
