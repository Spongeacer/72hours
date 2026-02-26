/**
 * Agent 角色基类
 */

const { MassSystem } = require('../core/MassSystem');

class Agent {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '无名';
    this.position = data.position || { x: 0, y: 0 };
    
    // 质量组件
    this.baseMass = data.baseMass || 1;
    this.storyMass = data.storyMass || 0;
    this.knotMass = new Map(); // targetId -> knotValue
    this.objectMass = data.objectMass || 0;
    
    // 特质与执念
    this.traits = data.traits || [];
    this.obsession = data.obsession || null;
    
    // 状态
    this.states = {
      fear: data.states?.fear ?? 50,
      aggression: data.states?.aggression ?? 50,
      hunger: data.states?.hunger ?? 50,
      injury: data.states?.injury ?? 0
    };
    
    // 记忆
    this.memories = [];
    
    // 道具
    this.inventory = data.inventory || [];
    
    // 引力陷阱
    this.trapConstant = data.trapConstant || 0;
    
    // 敌对值
    this.hostility = new Map(); // targetId -> hostilityValue
    
    // 初始化关系羁绊
    if (data.initialKnots) {
      for (const [targetId, value] of Object.entries(data.initialKnots)) {
        this.knotMass.set(targetId, value);
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * 计算总质量
   */
  getTotalMass() {
    const massSystem = new MassSystem();
    return massSystem.calculateMass(this);
  }

  /**
   * 获取与特定对象的关系羁绊
   */
  getKnotWith(targetId) {
    return this.knotMass.get(targetId) || 0;
  }

  /**
   * 更新关系羁绊
   */
  updateKnot(targetId, delta) {
    const current = this.knotMass.get(targetId) || 0;
    const updated = Math.max(0, current + delta);
    this.knotMass.set(targetId, updated);
    return updated;
  }

  /**
   * 获取敌对值
   */
  getHostility(targetId) {
    return this.hostility.get(targetId) || 0;
  }

  /**
   * 更新敌对值
   */
  updateHostility(targetId, delta) {
    const current = this.hostility.get(targetId) || 0;
    const updated = Math.max(0, Math.min(100, current + delta));
    this.hostility.set(targetId, updated);
    return updated;
  }

  /**
   * 更新状态
   */
  updateStates(delta) {
    for (const [key, value] of Object.entries(delta)) {
      if (this.states.hasOwnProperty(key)) {
        this.states[key] = Math.max(0, Math.min(100, this.states[key] + value));
      }
    }
  }

  /**
   * 添加记忆
   */
  addMemory(memory) {
    this.memories.push({
      ...memory,
      turn: memory.turn || 0,
      timestamp: Date.now()
    });
    
    // 限制记忆数量
    if (this.memories.length > 20) {
      this.memories.shift();
    }
  }

  /**
   * 获取特定类型的记忆
   */
  getMemoriesByType(type) {
    return this.memories.filter(m => m.type === type);
  }

  /**
   * 获取与特定对象的记忆
   */
  getMemoriesWith(targetId) {
    return this.memories.filter(m => m.targetId === targetId);
  }

  /**
   * 检查是否有特定特质
   */
  hasTrait(traitId) {
    return this.traits.some(t => t.id === traitId || t === traitId);
  }

  /**
   * 更新引力陷阱
   */
  updateTrap(delta) {
    this.trapConstant = Math.max(0, this.trapConstant + delta);
  }

  /**
   * 衰减引力陷阱
   */
  decayTrap() {
    this.trapConstant *= (1 - 0.1); // 每回合衰减10%
  }

  /**
   * 检查是否死亡
   */
  isDead() {
    return this.states.injury >= 100;
  }

  /**
   * 序列化
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      baseMass: this.baseMass,
      storyMass: this.storyMass,
      knotMass: Array.from(this.knotMass.entries()),
      objectMass: this.objectMass,
      traits: this.traits,
      obsession: this.obsession,
      states: this.states,
      memories: this.memories,
      inventory: this.inventory,
      trapConstant: this.trapConstant,
      hostility: Array.from(this.hostility.entries())
    };
  }

  /**
   * 反序列化
   */
  static fromJSON(json) {
    const agent = new Agent(json);
    agent.knotMass = new Map(json.knotMass || []);
    agent.hostility = new Map(json.hostility || []);
    return agent;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Agent };
}
