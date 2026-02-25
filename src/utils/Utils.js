/**
 * 72Hours 工具函数库
 */

const Utils = {
  /**
   * 计算欧几里得距离
   */
  distance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 随机整数 [min, max]
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 限制数值范围
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * 向量归一化
   */
  normalize(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / length,
      y: vector.y / length
    };
  },

  /**
   * 随机选择数组元素
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * 随机打乱数组
   */
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * 计算加权随机选择
   */
  weightedRandom(items, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    return items[items.length - 1];
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return Math.random().toString(36).substring(2, 15);
  },

  /**
   * 深拷贝对象
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * 计算游戏内时间（基础版，每回合1小时）
   * 注意：实际游戏中使用 TimeProgressionSystem 进行更复杂的时间计算
   */
  calculateGameTime(turn) {
    const date = new Date('1851-01-08T00:00:00');
    date.setHours(date.getHours() + turn);
    return date;
  },
  
  /**
   * 计算游戏内时间（优化版，支持变速推进）
   * 前期：每回合1小时
   * 中期：每回合1.5小时
   * 后期：每回合2小时
   * 最终阶段：每回合4小时
   */
  calculateGameTimeOptimized(turn) {
    const baseDate = new Date('1851-01-08T00:00:00');
    let totalHours = 0;
    
    // 前期（1-24回合）：每回合1小时
    if (turn <= 24) {
      totalHours = turn;
    }
    // 中期（25-48回合）：每回合1.5小时
    else if (turn <= 48) {
      totalHours = 24 + (turn - 24) * 1.5;
    }
    // 后期（49-66回合）：每回合2小时
    else if (turn <= 66) {
      totalHours = 24 + 36 + (turn - 48) * 2;
    }
    // 最终阶段（67-72回合）：每回合4小时
    else {
      totalHours = 24 + 36 + 36 + (turn - 66) * 4;
    }
    
    baseDate.setHours(baseDate.getHours() + Math.floor(totalHours));
    return baseDate;
  },

  /**
   * 根据时间判断天气
   */
  calculateWeather(turn) {
    const hour = turn % 24;
    if (hour >= 6 && hour < 18) return 'clear';
    if (hour >= 20 || hour < 5) return 'night';
    return 'fog';
  },

  /**
   * 格式化日期显示
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    return `${year}年${month}月${day}日 ${hour}:00`;
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Utils };
}
