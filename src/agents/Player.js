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
   * 基于身份 + 性格特质，由AI动态生成
   */
  generateObsession() {
    const personalityTraits = this.traits
      .filter(t => t.type === 'personality')
      .map(t => t.id || t);
    
    // 如果没有性格特质，使用默认
    if (personalityTraits.length === 0) {
      personalityTraits.push('calm', 'curious');
    }
    
    // 构建提示词，让AI基于特质生成执念
    const identityName = this.identity.name;
    const traitsDesc = personalityTraits
      .map(t => {
        const traitInfo = require('../utils/Constants').GAME_CONFIG.PERSONALITY_TRAITS[t];
        return traitInfo ? `${t}(${traitInfo.name})` : t;
      })
      .join('、');
    
    // 返回提示词，供叙事引擎生成
    this.obsession = {
      type: 'dynamic',
      identity: this.identityType,
      identityName: identityName,
      traits: personalityTraits,
      traitsDesc: traitsDesc,
      prompt: `生成一个${identityName}的执念，该角色具有以下特质：${traitsDesc}。执念应该体现这些特质，与1851年金田起义的历史背景相关，简洁有力（15字以内）。`
    };
    
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
