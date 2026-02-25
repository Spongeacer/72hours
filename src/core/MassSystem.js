/**
 * 质量系统 - 角色质量计算与更新
 */

const { GAME_CONFIG } = require('../utils/Constants');
const { Utils } = require('../utils/Utils');

class MassSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
  }

  /**
   * 计算总质量
   * M = B + S + K + O
   */
  calculateMass(agent) {
    const B = agent.baseMass;
    const S = agent.storyMass || 0;
    const K = this.calculateTotalKnot(agent);
    const O = agent.objectMass || 0;
    
    return B + S + K + O;
  }

  /**
   * 计算总关系羁绊
   */
  calculateTotalKnot(agent) {
    if (!agent.knotMass || agent.knotMass.size === 0) return 0;
    
    let total = 0;
    for (const value of agent.knotMass.values()) {
      total += value;
    }
    return total;
  }

  /**
   * 获取与特定对象的关系羁绊
   */
  getKnotWith(agent, targetId) {
    return agent.knotMass?.get(targetId) || 0;
  }

  /**
   * 更新关系羁绊
   */
  updateKnot(agent, targetId, delta) {
    if (!agent.knotMass) agent.knotMass = new Map();
    
    const current = agent.knotMass.get(targetId) || 0;
    const updated = Math.max(0, current + delta);
    
    agent.knotMass.set(targetId, updated);
    return updated;
  }

  /**
   * 增加叙事权重（经历事件）
   */
  addStoryMass(agent, eventImpact = 1) {
    if (!agent.storyMass) agent.storyMass = 0;
    agent.storyMass += eventImpact * this.config.MASS.STORY_PER_EVENT;
  }

  /**
   * 更新道具质量
   */
  updateObjectMass(agent) {
    if (!agent.inventory) {
      agent.objectMass = 0;
      return;
    }
    
    agent.objectMass = agent.inventory.reduce((sum, item) => {
      return sum + (item.massO || 0);
    }, 0);
  }

  /**
   * 道具转移时的质量迁移
   */
  transferObjectMass(fromAgent, toAgent, item) {
    // 减少原持有者质量
    fromAgent.objectMass -= item.massO || 0;
    if (fromAgent.objectMass < 0) fromAgent.objectMass = 0;
    
    // 增加新持有者质量
    toAgent.objectMass += item.massO || 0;
    
    // 更新库存
    fromAgent.inventory = fromAgent.inventory.filter(i => i.id !== item.id);
    toAgent.inventory.push(item);
  }

  /**
   * 质量坍缩（NPC死亡）
   */
  collapseMass(agent) {
    // 死亡NPC质量变为极大负值（斥力）
    agent.baseMass = -100;
    agent.storyMass = 0;
    agent.objectMass = 0;
    // knotMass保留，作为记忆
  }

  /**
   * 检查质量坍缩效果
   */
  isCollapsed(agent) {
    return agent.baseMass < 0;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MassSystem };
}
