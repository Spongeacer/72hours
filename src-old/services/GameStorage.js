/**
 * 游戏存储服务
 * 封装存储操作，便于切换存储方式
 */

const { config } = require('../config');

class GameStorage {
  constructor(storageType = 'session') {
    this.storage = storageType === 'local' ? localStorage : sessionStorage;
    this.prefix = config.storage.prefix;
  }

  /**
   * 保存会话
   * @param {Object} data - 会话数据
   */
  saveSession(data) {
    this._set(config.storage.sessionKey, data.sessionId);
    this._set(config.storage.identityKey, data.identity);
    this._set(config.storage.traitsKey, data.traits);
    this._set(config.storage.gameDataKey, data.gameData);
  }

  /**
   * 加载会话
   * @returns {Object|null} 会话数据
   */
  loadSession() {
    const sessionId = this._get(config.storage.sessionKey);
    
    if (!sessionId) {
      return null;
    }

    return {
      sessionId,
      identity: this._get(config.storage.identityKey),
      traits: this._get(config.storage.traitsKey) || [],
      gameData: this._get(config.storage.gameDataKey) || {}
    };
  }

  /**
   * 清除会话
   */
  clearSession() {
    this._remove(config.storage.sessionKey);
    this._remove(config.storage.identityKey);
    this._remove(config.storage.traitsKey);
    this._remove(config.storage.gameDataKey);
  }

  /**
   * 保存游戏状态
   * @param {Object} state - 游戏状态
   */
  saveGameState(state) {
    this._set('gameState', state);
  }

  /**
   * 加载游戏状态
   * @returns {Object|null} 游戏状态
   */
  loadGameState() {
    return this._get('gameState');
  }

  /**
   * 设置值
   * @private
   */
  _set(key, value) {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      this.storage.setItem(fullKey, serialized);
    } catch (error) {
      console.error('存储失败:', error);
    }
  }

  /**
   * 获取值
   * @private
   */
  _get(key) {
    try {
      const fullKey = this.prefix + key;
      const serialized = this.storage.getItem(fullKey);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.error('读取失败:', error);
      return null;
    }
  }

  /**
   * 移除值
   * @private
   */
  _remove(key) {
    try {
      const fullKey = this.prefix + key;
      this.storage.removeItem(fullKey);
    } catch (error) {
      console.error('删除失败:', error);
    }
  }
}

// 默认实例
const defaultStorage = new GameStorage('session');

module.exports = { GameStorage, defaultStorage };
