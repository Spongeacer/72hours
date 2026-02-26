/**
 * 坐标系统 - 网格移动与位置管理
 */

const { GAME_CONFIG } = require('../utils/Constants');
const { Utils } = require('../utils/Utils');

class CoordinateSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    this.gridSize = config.GRID_SIZE;
  }

  /**
   * 随机移动（带恐惧偏向和引力陷阱）
   */
  randomWalk(agent, player, gravityEngine) {
    const fear = agent.states?.fear || 50;
    
    // 基础随机移动
    let deltaX = Utils.randomInt(-this.config.MOVEMENT.RANDOM_WALK_RANGE, 
                                   this.config.MOVEMENT.RANDOM_WALK_RANGE);
    let deltaY = Utils.randomInt(-this.config.MOVEMENT.RANDOM_WALK_RANGE,
                                   this.config.MOVEMENT.RANDOM_WALK_RANGE);
    
    // 恐惧偏向：高恐惧时远离玩家
    if (fear > this.config.MOVEMENT.FEAR_ESCAPE_THRESHOLD) {
      const escapeDir = Utils.normalize({
        x: agent.position.x - player.position.x,
        y: agent.position.y - player.position.y
      });
      deltaX += escapeDir.x * this.config.MOVEMENT.FEAR_BIAS_FACTOR * 2;
      deltaY += escapeDir.y * this.config.MOVEMENT.FEAR_BIAS_FACTOR * 2;
    }
    
    // 引力陷阱偏移
    if (gravityEngine) {
      const trapOffset = gravityEngine.calculateTrapOffset(agent, player);
      deltaX += trapOffset.x;
      deltaY += trapOffset.y;
    }
    
    // 应用移动并限制在网格内
    const newX = Utils.clamp(
      Math.round(agent.position.x + deltaX),
      -this.gridSize,
      this.gridSize
    );
    const newY = Utils.clamp(
      Math.round(agent.position.y + deltaY),
      -this.gridSize,
      this.gridSize
    );
    
    agent.position = { x: newX, y: newY };
    return agent.position;
  }

  /**
   * 计算欧几里得距离
   */
  distance(pos1, pos2) {
    return Utils.distance(pos1, pos2);
  }

  /**
   * 检查位置是否在网格内
   */
  isValidPosition(pos) {
    return pos.x >= -this.gridSize && pos.x <= this.gridSize &&
           pos.y >= -this.gridSize && pos.y <= this.gridSize;
  }

  /**
   * 限制位置在网格内
   */
  clampPosition(pos) {
    return {
      x: Utils.clamp(pos.x, -this.gridSize, this.gridSize),
      y: Utils.clamp(pos.y, -this.gridSize, this.gridSize)
    };
  }

  /**
   * 生成随机位置
   */
  randomPosition() {
    return {
      x: Utils.randomInt(-this.gridSize, this.gridSize),
      y: Utils.randomInt(-this.gridSize, this.gridSize)
    };
  }

  /**
   * 生成玩家附近的位置
   */
  positionNearPlayer(player, maxDistance = 2) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * maxDistance;
    
    return {
      x: Utils.clamp(Math.round(player.position.x + Math.cos(angle) * distance),
                     -this.gridSize, this.gridSize),
      y: Utils.clamp(Math.round(player.position.y + Math.sin(angle) * distance),
                     -this.gridSize, this.gridSize)
    };
  }

  /**
   * 计算方向向量
   */
  direction(from, to) {
    return Utils.normalize({
      x: to.x - from.x,
      y: to.y - from.y
    });
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoordinateSystem };
}
