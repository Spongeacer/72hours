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
   */
  generateObsession() {
    const traitIds = this.traits.map(t => t.id || t);
    
    // 基于身份+特质组合涌现执念
    const obsessionMap = {
      scholar: {
        calm_curious: '发现隐藏的真相',
        brave_zealous: '为信仰传播而牺牲',
        craven_greedy: '用知识换取安全',
        deceitful_ambitious: '利用知识谋取私利'
      },
      landlord: {
        greedy_ambitious: '扩大势力成为土皇帝',
        compassionate_family: '散尽家财保护村民',
        craven_paranoid: '怀疑所有人要夺产',
        deceitful_calm: '两边下注保平安'
      },
      soldier: {
        loyal_brutal: '完成命令不择手段',
        craven_greedy: '搜刮后逃跑',
        just_calm: '在乱世中维持秩序',
        brave_homesick: '活着回去见家人'
      },
      cultist: {
        zealous_brave: '建立天国，不怕牺牲',
        compassionate_family: '保护教友和家人',
        deceitful_ambitious: '利用教门往上爬',
        pious_calm: '在信仰中寻找平静'
      }
    };
    
    const identityObsessions = obsessionMap[this.identityType] || {};
    const key = traitIds.slice(0, 2).sort().join('_');
    
    this.obsession = identityObsessions[key] || '在乱世中活下去';
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
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Player };
}
