/**
 * 压强系统 - 环境张力管理
 */

const { GAME_CONFIG } = require('../utils/Constants');
const { Utils } = require('../utils/Utils');

class PressureSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    this.pressure = 10; // 初始压强
  }

  /**
   * 回合更新
   */
  update(turn, playerAction = null) {
    // 基础增长
    this.pressure += this.config.PRESSURE.BASE_GROWTH;
    
    // 玩家行为影响
    if (playerAction) {
      if (playerAction.violent) {
        this.pressure += this.config.PRESSURE.VIOLENCE_BONUS;
      }
    }
    
    // 限制范围
    this.pressure = Utils.clamp(this.pressure, 0, 100);
    
    return this.pressure;
  }

  /**
   * 计算特质扰动后的总压强
   */
  getTotalPressure(playerTraits = [], npcTraits = []) {
    let modifier = 1.0;
    
    // 玩家特质影响
    for (const trait of playerTraits) {
      if (trait.type === 'catalyst') {
        modifier *= trait.deltaP || 1.2;
      } else if (trait.type === 'buffer') {
        modifier *= trait.deltaP || 0.8;
      }
    }
    
    // NPC特质影响（取平均值）
    if (npcTraits.length > 0) {
      let npcModifier = 1.0;
      for (const trait of npcTraits) {
        if (trait.type === 'catalyst') {
          npcModifier *= trait.deltaP || 1.1;
        } else if (trait.type === 'buffer') {
          npcModifier *= trait.deltaP || 0.9;
        }
      }
      modifier *= Math.pow(npcModifier, 1 / npcTraits.length);
    }
    
    return this.pressure * modifier;
  }

  /**
   * 检查锚点2：官兵搜查触发条件
   */
  checkRaidTrigger(player) {
    // 提前条件
    if (this.pressure > this.config.PRESSURE.THRESHOLD_RAID) {
      return { triggered: true, early: true };
    }
    if (player.states.aggression > 70) {
      return { triggered: true, early: true, reason: 'violence_signal' };
    }
    
    // 延后条件
    if (this.pressure < 30 && player.getTotalMass() < 4) {
      return { triggered: false, delayed: true };
    }
    
    return { triggered: false };
  }

  /**
   * 检查锚点3：天父下凡触发条件
   */
  checkDivineTrigger(cultistNPCs, yangXiuqing, player) {
    // 计算会众总质量
    const totalCultistMass = cultistNPCs.reduce((sum, npc) => sum + npc.getTotalMass(), 0);
    
    // 提前条件
    if (totalCultistMass > this.config.PRESSURE.THRESHOLD_DIVINE) {
      return { triggered: true, early: true };
    }
    if (yangXiuqing && yangXiuqing.isUnlocked) {
      const F = new (require('./GravityEngine')).GravityEngine()
        .calculateGravity(yangXiuqing, player, this.pressure, 1.0);
      if (F > 8) {
        return { triggered: true, early: true, reason: 'strong_attraction' };
      }
    }
    
    // 延后条件
    if (yangXiuqing && yangXiuqing.getTotalMass() < 6) {
      return { triggered: false, delayed: true };
    }
    
    return { triggered: false };
  }

  /**
   * 获取当前压强
   */
  getPressure() {
    return this.pressure;
  }

  /**
   * 设置压强（用于事件触发）
   */
  setPressure(value) {
    this.pressure = Utils.clamp(value, 0, 100);
  }

  /**
   * 增加压强（用于事件效果）
   */
  addPressure(delta) {
    this.pressure = Utils.clamp(this.pressure + delta, 0, 100);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PressureSystem };
}
