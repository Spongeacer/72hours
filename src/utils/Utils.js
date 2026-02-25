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
   * 计算游戏内时间
   */
  calculateGameTime(turn) {
    const date = new Date('1851-01-08T00:00:00');
    date.setHours(date.getHours() + turn);
    return date;
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
