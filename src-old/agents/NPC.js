/**
 * NPC 非玩家角色类
 */

const { Agent } = require('./Agent');
const { GAME_CONFIG } = require('../utils/Constants');
const { Utils } = require('../utils/Utils');

class NPC extends Agent {
  constructor(data = {}) {
    super(data);
    
    this.isNPC = true;
    this.isElite = data.isElite || false;
    this.isBonded = data.isBonded || false;
    this.isUnlocked = data.isUnlocked || false;
    
    // 精英NPC解锁条件
    this.unlockCondition = data.unlockCondition || null;
    
    // 行为库
    this.behaviors = data.behaviors || [];
    
    // 存在时间（普通NPC）
    this.ttl = data.ttl || null; // 回合数，null表示永久
    
    // 初始K值（关联NPC）
    this.initialKnot = data.initialKnot || 0;
    
    // 执念
    this.obsession = null;
  }

  /**
   * 生成执念数据（供AI生成使用）
   */
  generateObsession() {
    const personalityTraits = this.traits
      .filter(t => t.type === 'personality')
      .map(t => t.id || t);
    
    if (personalityTraits.length === 0) {
      personalityTraits.push('calm');
    }
    
    const traitsDesc = personalityTraits
      .map(t => {
        const traitInfo = GAME_CONFIG.PERSONALITY_TRAITS[t];
        return traitInfo ? `${t}(${traitInfo.name})` : t;
      })
      .join('、');
    
    return {
      type: 'npc',
      identity: this.name,
      identityName: this.name,
      traits: personalityTraits,
      traitsDesc: traitsDesc,
      prompt: `生成一个NPC「${this.name}」的执念，该角色具有以下特质：${traitsDesc}。身份是${this.isBonded ? '玩家的关联NPC' : '普通村民'}，时代背景是1851年金田村。执念应该简洁有力（15字以内），体现角色特点。`
    };
  }

  /**
   * 检查解锁条件
   */
  checkUnlock(gameState) {
    if (this.isUnlocked) return true;
    if (!this.unlockCondition) {
      this.isUnlocked = true;
      return true;
    }
    
    const { turn, pressure, player, npcs } = gameState;
    const condition = this.unlockCondition;
    
    // 回合条件
    if (condition.minTurn && turn < condition.minTurn) return false;
    
    // 压强条件
    if (condition.minPressure && pressure < condition.minPressure) return false;
    
    // 玩家特质条件
    if (condition.playerTrait && !player.hasTrait(condition.playerTrait)) return false;
    
    // 玩家道具条件
    if (condition.playerItem) {
      const hasItem = player.inventory.some(i => 
        i.tags?.includes(condition.playerItem)
      );
      if (!hasItem) return false;
    }
    
    // 其他NPC解锁条件
    if (condition.requireNPC) {
      const requiredNPC = npcs.find(n => n.id === condition.requireNPC);
      if (!requiredNPC?.isUnlocked) return false;
    }
    
    this.isUnlocked = true;
    return true;
  }

  /**
   * 计算行为倾向
   */
  calculateBehaviorTendency(behaviorType, player, env) {
    const weights = GAME_CONFIG.BEHAVIOR[behaviorType.toUpperCase()];
    if (!weights) return 0;
    
    let tendency = 0;
    
    // 特质权重
    for (const [trait, weight] of Object.entries(weights)) {
      if (this.hasTrait(trait)) {
        tendency += weight;
      }
    }
    
    // 状态权重
    if (weights.highFear && this.states.fear > 60) tendency += weights.highFear;
    if (weights.highHunger && this.states.hunger > 70) tendency += weights.highHunger;
    if (weights.highAggression && this.states.aggression > 70) tendency += weights.highAggression;
    
    // 关系权重
    if (weights.existingKnot) {
      const knot = this.getKnotWith(player.id);
      if (knot > 0) tendency += weights.existingKnot * (knot / 10);
    }
    
    if (weights.deepKnot) {
      const knot = this.getKnotWith(player.id);
      if (knot >= 5) tendency += weights.deepKnot;
    }
    
    // 环境权重
    if (weights.highPressure && env.pressure > 70) tendency += weights.highPressure;
    if (weights.lowPressure && env.pressure < 30) tendency += weights.lowPressure;
    
    // 记忆权重
    if (weights.betrayalMemory) {
      const betrayalMemories = this.getMemoriesWith(player.id)
        .filter(m => m.type === 'betrayal');
      if (betrayalMemories.length > 0) tendency += weights.betrayalMemory;
    }
    
    if (weights.gratitudeMemory) {
      const gratitudeMemories = this.getMemoriesWith(player.id)
        .filter(m => m.type === 'gratitude');
      if (gratitudeMemories.length > 0) tendency += weights.gratitudeMemory;
    }
    
    // 道具权重
    if (weights.hasValuableItem) {
      const hasValuable = player.inventory.some(i => 
        i.tags?.includes('高价值')
      );
      if (hasValuable) tendency += weights.hasValuableItem;
    }
    
    return tendency;
  }

  /**
   * 选择行为
   */
  selectBehavior(player, env) {
    const behaviors = ['seizure', 'conflict', 'eavesdrop', 'conversation', 'request', 'give'];
    const tendencies = behaviors.map(b => ({
      type: b,
      tendency: this.calculateBehaviorTendency(b, player, env)
    }));
    
    // 添加随机扰动
    tendencies.forEach(t => {
      t.tendency += (Math.random() - 0.5) * 0.2;
    });
    
    // 排序选择
    tendencies.sort((a, b) => b.tendency - a.tendency);
    
    return tendencies[0];
  }

  /**
   * 移动
   */
  move(player, gravityEngine, coordinateSystem) {
    return coordinateSystem.randomWalk(this, player, gravityEngine);
  }

  /**
   * 衰减TTL
   */
  decayTTL() {
    if (this.ttl !== null) {
      this.ttl--;
    }
  }

  /**
   * 检查是否应该消失
   */
  shouldDisappear() {
    return this.ttl !== null && this.ttl <= 0;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NPC };
}
