/**
 * 事件总线 - 解耦模块间通信
 */

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @returns {Function} 取消订阅函数
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const handlers = this.events.get(event);
    handlers.push(handler);
    
    // 返回取消订阅函数
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * 订阅一次性事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  once(event, handler) {
    const unsubscribe = this.on(event, (data) => {
      handler(data);
      unsubscribe();
    });
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`事件处理错误 [${event}]:`, error);
        }
      });
    }
  }

  /**
   * 取消所有订阅
   * @param {string} event - 事件名称（可选，不传则取消所有）
   */
  off(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 获取事件列表
   * @returns {Array} 事件名称列表
   */
  getEvents() {
    return Array.from(this.events.keys());
  }
}

// 全局事件总线实例
const globalEventBus = new EventBus();

module.exports = { EventBus, globalEventBus };
