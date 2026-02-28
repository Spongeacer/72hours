/**
 * 剧本配置 - 可拔插的历史背景设定
 * 
 * 原则：
 * 1. 每个剧本是一个独立的历史/虚构场景
 * 2. 剧本包含该场景特有的NPC、背景、提示词
 * 3. 切换剧本只需更改 CURRENT_SCRIPT
 */

// ==================== 剧本类型定义 ====================
export interface Identity {
  id: string;
  name: string;
  description: string;
  baseMass: number;
  traits: string[];
}

export interface Script {
  id: string;
  name: string;
  description: string;
  
  // 时间设定
  year: number;
  startDate: string;  // ISO格式
  eventDate: string;  // 关键事件日期
  
  // 地点
  location: string;
  
  // 历史背景文本（用于prompt）
  historicalContext: string;
  
  // 开场白
  opening: string;
  
  // 关键历史人物/势力
  historicalFigures: string[];
  factions?: string[];  // 可选：势力阵营
  
  // 玩家身份选项
  identities: Identity[];
  
  // AI提示词模板
  aiPrompts: {
    npcName: string;
    npcObsession: string;
    playerObsession: string;
    atmosphere: string;
  };
  
  // 可选：剧本特有机制覆盖
  overrides?: {
    pressure?: { initial: number; perTurn: number; max: number };
    weather?: string[];
  };
}

// ==================== 剧本库 ====================
export const SCRIPTS: Record<string, Script> = {
  taiping: {
    id: 'taiping',
    name: '太平天国：金田起义',
    description: '1851年金田村，起义前72小时的生存故事',
    
    year: 1851,
    startDate: '1851-01-08T18:00:00',
    eventDate: '1851-01-11T00:00:00',
    
    location: '广西金田村',
    
    historicalContext: '故事发生在清末1851年的广西金田村，当地连年闹灾，饥民遍地，拜上帝会暗中迅速发展，举行起义的时机已经成熟。拜上帝会众准备在在1851年1月11日洪秀全生日这一天在金田村"恭祝万寿"起义，但同时多方势力暗流涌动。',
    
    opening: '拜上帝会的团营聚集，势若暴风骤雨，使得本来已经烽烟遍地的广西，愈加动荡不安。广西各地的告急文书，如同雪片般飞向省城桂林。代理广西巡抚劳崇光、署按察使杨彤如等知道拜上帝会谋叛迹象后，深感事态严重，于是急命入桂不久的贵州总兵周凤歧，带领一千多黔兵，会同浔州协副将李殿元，用武力来扑灭这堆即将在金田村燃起的火堆。',
    
    historicalFigures: ['洪秀全', '杨秀清', '萧朝贵', '劳崇光', '周凤歧', '李殿元'],
    factions: ['拜上帝会', '清军', '村民', '流民'],
    
    // 剧本特有的身份选项
    identities: [
      {
        id: 'scholar',
        name: '落第书生',
        description: '科举失利，心怀天下',
        baseMass: 3,
        traits: ['calm', 'curious', 'anxious']
      },
      {
        id: 'farmer',
        name: '失地农民',
        description: '土地被夺，流离失所',
        baseMass: 2,
        traits: ['hardworking', 'fearful', 'resilient']
      },
      {
        id: 'merchant',
        name: '行商',
        description: '走南闯北，消息灵通',
        baseMass: 2,
        traits: ['cunning', 'greedy', 'observant']
      },
      {
        id: 'soldier',
        name: '逃兵',
        description: '不堪军饷，逃离军营',
        baseMass: 3,
        traits: ['brave', 'violent', 'loyal']
      },
      {
        id: 'doctor',
        name: '游方郎中',
        description: '悬壶济世，见多识广',
        baseMass: 2,
        traits: ['compassionate', 'calm', 'knowledgeable']
      },
      {
        id: 'bandit',
        name: '山匪',
        description: '占山为王，劫富济贫',
        baseMass: 3,
        traits: ['aggressive', 'cunning', 'fearless']
      }
    ],
    
    aiPrompts: {
      npcName: '生成一个1851年中国农村NPC的名字，要求：1）符合当时的历史背景；2）体现人物身份特征；3）简洁有力；4）只返回名字，不要解释',
      npcObsession: '生成一个NPC的执念，要求：1）体现人物性格和处境；2）与1851年金田起义的历史背景相关；3）简洁有力（15字以内）；4）只返回执念文本，不要解释',
      playerObsession: '生成一个{identity}的执念，该角色具有以下特质：{traits}。执念应该体现这些特质，与1851年金田起义的历史背景相关，简洁有力（15字以内）。',
      atmosphere: '描述要有氛围感，符合1851年金田村的情境'
    }
  }
  
  // 未来可添加更多剧本：
  // wuchang: { ... }  // 武昌起义
  // boxer: { ... }    // 义和团
  // fantasy: { ... }  // 虚构剧本
};

// ==================== 当前剧本设置 ====================
export const CURRENT_SCRIPT = 'taiping';

// ==================== 便捷访问 ====================
export const getCurrentScript = (): Script => SCRIPTS[CURRENT_SCRIPT];

/**
 * 获取当前剧本的身份列表
 */
export const getCurrentIdentities = (): Identity[] => {
  return getCurrentScript().identities;
};

/**
 * 获取身份ID列表（用于验证）
 */
export const getCurrentIdentityIds = (): string[] => {
  return getCurrentScript().identities.map(i => i.id);
};

/**
 * 验证身份是否有效
 */
export const isValidIdentity = (identityId: string): boolean => {
  return getCurrentIdentityIds().includes(identityId);
};

// 导出默认
export default {
  CURRENT_SCRIPT,
  SCRIPTS,
  getCurrentScript,
  getCurrentIdentities,
  getCurrentIdentityIds,
  isValidIdentity
};
