/**
 * 引力引擎 - 核心物理计算
 */

const { GAME_CONFIG } = require('../utils/Constants');
const { Utils } = require('../utils/Utils');

class GravityEngine {
  constructor(config = GAME_CONFIG) {
    this.config = config;
  }

  /**
   * 计算两个实体间的引力
   * F = G × M₁ × M₂ / r² × P × Ω
   * 基于 DESIGN.md v1.1 引力公式
   */
  calculateGravity(agent1, agent2, pressure, omega) {
    const distance = Utils.distance(agent1.position, agent2.position);
    
    // 同一位置，最大引力
    if (distance === 0) return Infinity;
    
    const m1 = agent1.getTotalMass ? agent1.getTotalMass() : agent1.mass || 3;
    const m2 = agent2.getTotalMass ? agent2.getTotalMass() : agent2.mass || 3;
    const G = this.config.GRAVITY?.G || 0.8; // 优化后的引力常数
    const P = 1 + (pressure * (this.config.GRAVITY?.PRESSURE_MULTIPLIER || 0.05));
    
    return (G * m1 * m2 / (distance * distance)) * P * omega;
  }

  /**
   * 计算引力陷阱偏移
   */
  calculateTrapOffset(npc, player) {
    if (npc.trapConstant <= 0) return { x: 0, y: 0 };
    
    const distance = Utils.distance(npc.position, player.position);
    const K = npc.getKnotWith(player.id);
    const offset = (npc.trapConstant * K) / (distance + 1);
    
    // 计算朝向玩家的方向
    const direction = {
      x: player.position.x - npc.position.x,
      y: player.position.y - npc.position.y
    };
    const normalized = Utils.normalize(direction);
    
    // 如果NPC处于敌对状态，方向反转
    const hostilityMultiplier = npc.getHostility(player.id) > 50 ? -1 : 1;
    
    return {
      x: normalized.x * offset * hostilityMultiplier,
      y: normalized.y * offset * hostilityMultiplier
    };
  }

  /**
   * 找出聚光灯NPC（引力最大）
   */
  findSpotlightNPC(player, npcs, pressure, omega) {
    let maxGravity = -1;
    let spotlightNPC = null;
    
    for (const npc of npcs) {
      // 跳过未解锁的精英NPC
      if (npc.isElite && !npc.isUnlocked) continue;
      
      const gravity = this.calculateGravity(npc, player, pressure, omega);
      
      if (gravity > maxGravity) {
        maxGravity = gravity;
        spotlightNPC = npc;
      }
    }
    
    return { npc: spotlightNPC, gravity: maxGravity };
  }

  /**
   * 计算NPC之间的互吸力（双星系统）
   */
  calculateMutualGravity(npc1, npc2, pressure, omega) {
    // 只有高质量NPC之间才有显著互吸
    const m1 = npc1.getTotalMass();
    const m2 = npc2.getTotalMass();
    
    if (m1 < 5 || m2 < 5) return 0;
    
    const distance = Utils.distance(npc1.position, npc2.position);
    if (distance > 3) return 0; // 距离太远无互吸
    
    // 互吸加权
    const baseGravity = this.calculateGravity(npc1, npc2, pressure, omega);
    return baseGravity * 2; // 互吸系数
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GravityEngine };
}
