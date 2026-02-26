/**
 * Player 玩家角色类
 */

const { Agent } = require('./Agent');
const { GAME_CONFIG } = require('../utils/Constants');

class Player extends Agent {
  constructor(identityType = 'scholar') {
    const identity = GAME_CONFIG.IDENTITIES[identityType.toUpperCase()];
    
    super({
      name: '你',
      baseMass: identity.baseMass,
      traits: [], // 将在生成时填充
      states: {
        fear: 30,
        aggression: 20,
        hunger: 40,
        injury: 0
      }
    });
    
    this.identity = identity;
    this.identityType = identityType;
    this.isPlayer = true;
    this.position = { x: 0, y: 0 }; // 玩家始终在原点
    
    // 关联NPC
    this.bondedNPCs = [];
    
    // 游戏状态
    this.escaped = false;
    this.captured = false;
  }

  /**
   * 生成执念
   * 基于身份 + 性格特质 + 背景故事生成
   */
  generateObsession() {
    const traitIds = this.traits
      .filter(t => t.type === 'personality')
      .map(t => t.id || t);
    
    // 如果没有性格特质，使用默认
    if (traitIds.length === 0) {
      traitIds.push('calm', 'curious');
    }
    
    // 基于身份 + 特质组合生成执念
    const obsessionMap = {
      scholar: {
        // 冷静 + 好奇类
        calm_curious: '发现隐藏的真相',
        calm_analytical: '看透乱世的本质',
        curious_idealistic: '用文字改变时代',
        reserved_honest: '守护最后的良知',
        
        // 恐惧类
        calm_fearful: '在乱世中保全家人',
        craven_curious: '用知识换取安全',
        
        // 野心类
        ambitious_calculating: '利用知识谋取私利',
        ambitious_deceitful: '成为乱世的谋士',
        
        // 善良类
        honest_compassionate: '保护无辜的村民',
        idealistic_hopeful: '重建读书人的理想',
        
        // 默认
        default: '在乱世中活下去'
      },
      landlord: {
        // 贪婪类
        greedy_ambitious: '扩大势力成为土皇帝',
        greedy_calculating: '在乱世中发横财',
        ambitious_proud: '保住家族的荣耀',
        
        // 恐惧类
        fearful_craven: '带着家产逃离',
        fearful_paranoid: '怀疑所有人要夺产',
        
        // 务实类
        pragmatic_worldly: '两边下注保平安',
        calculating_pragmatic: '用土地换取安全',
        
        // 善良类
        compassionate_family: '散尽家财保护村民',
        honest_worldly: '做个有良心的地主',
        
        // 默认
        default: '保住祖宗留下的产业'
      },
      soldier: {
        // 忠诚类
        loyal_brave: '完成使命不负上峰',
        loyal_disciplined: '严格执行军令',
        brave_callous: '成为最强的战士',
        
        // 残忍类
        brutal_callous: '用杀戮建立秩序',
        brutal_ambitious: '踩着尸体往上爬',
        
        // 恐惧类
        fearful_craven: '活着回去见家人',
        craven_greedy: '搜刮后逃跑',
        
        // 正义类
        just_brave: '在乱世中维持正义',
        disciplined_vigilant: '守护一方平安',
        
        // 默认
        default: '活着拿到军饷'
      },
      cultist: {
        // 狂热类
        zealous_fanatical: '为建立天国不惜牺牲',
        zealous_brave: '成为天父的先锋',
        fanatical_devoted: '用血证明信仰',
        
        // 虔诚类
        pious_devoted: '在信仰中寻找救赎',
        pious_hopeful: '等待天国的降临',
        
        // 恐惧类
        fearful_devoted: '用虔诚换取救赎',
        fearful_hopeful: '相信上帝会拯救',
        
        // 野心类
        ambitious_zealous: '利用教门往上爬',
        deceitful_ambitious: '成为教中的领袖',
        
        // 善良类
        compassionate_family: '保护教友和家人',
        devoted_compassionate: '用爱传播信仰',
        
        // 默认
        default: '等待天国的降临'
      }
    };
    
    const identityObsessions = obsessionMap[this.identityType] || obsessionMap.scholar;
    
    // 尝试匹配前两个特质
    const key = traitIds.slice(0, 2).sort().join('_');
    
    // 尝试单个特质匹配
    const singleKey = traitIds[0];
    
    // 查找匹配的执念
    this.obsession = identityObsessions[key] || 
                     identityObsessions[singleKey] || 
                     identityObsessions.default;
    
    return this.obsession;
  }

  /**
   * 检查死亡
   */
  checkDeath() {
    return this.states.injury >= 100 || this.states.hunger >= 100;
  }

  /**
   * 检查逃离
   */
  checkEscape() {
    return this.escaped || 
           (this.states.fear >= 100 && this.position.x > 5);
  }

  /**
   * 检查疯癫
   */
  checkMadness() {
    // 压力值满 + 精神状态
    return false; // 待实现
  }

  /**
   * 获取压强调制系数
   */
  getPressureModifier() {
    return this.identity.pressureModifier || 1.0;
  }

  /**
   * 添加关联NPC
   */
  addBondedNPC(npc) {
    this.bondedNPCs.push(npc);
    // 设置初始K值
    this.updateKnot(npc.id, npc.initialKnot || 2);
    npc.updateKnot(this.id, npc.initialKnot || 2);
  }

  /**
   * 获取关联NPC
   */
  getBondedNPCs() {
    return this.bondedNPCs;
  }

  /**
   * 获取玩家状态描述（用于AI叙事）
   */
  getAura() {
    const states = this.states;
    
    if (states.fear > 70) return '恐惧的颤抖';
    if (states.aggression > 70) return '压抑的愤怒';
    if (states.hunger > 70) return '饥饿的虚弱';
    if (states.injury > 50) return '带伤的疲惫';
    
    return '沉默的警惕';
  }

  /**
   * 获取玩家身份描述
   */
  getIdentityDescription() {
    return this.identity.name;
  }

  /**
   * 获取性格特质列表（用于显示）
   */
  getPersonalityTraits() {
    const { PERSONALITY_TRAITS } = require('../utils/Constants').GAME_CONFIG;
    
    return this.traits
      .filter(t => t.type === 'personality')
      .map(t => {
        const traitId = t.id || t;
        const traitInfo = PERSONALITY_TRAITS[traitId];
        return traitInfo ? traitInfo.name : traitId;
      });
  }

  /**
   * 获取特质描述字符串（用于开场显示）
   */
  getTraitsDescription() {
    const traits = this.getPersonalityTraits();
    if (traits.length === 0) return '';
    return traits.join(' · ');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Player };
}
