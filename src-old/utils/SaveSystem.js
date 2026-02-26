/**
 * 存档系统 - Save/Load System
 * 支持本地存储和导出/导入
 */

class SaveSystem {
  constructor(gameId) {
    this.gameId = gameId;
    this.storageKey = `72hours_save_${gameId}`;
    this.savesKey = `72hours_saves_list`;
  }

  /**
   * 创建存档
   * @param {Object} gameState - 当前游戏状态
   * @param {string} name - 存档名称（可选）
   * @returns {Object} 存档信息
   */
  createSave(gameState, name = null) {
    const saveData = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `存档 ${new Date().toLocaleString('zh-CN')}`,
      timestamp: Date.now(),
      gameState: this.serializeGameState(gameState),
      turn: gameState.turn,
      datetime: gameState.datetime,
      pressure: gameState.pressure,
      omega: gameState.omega
    };

    // 保存到本地存储
    this.saveToStorage(saveData);
    
    // 更新存档列表
    this.addToSaveList(saveData);

    return saveData;
  }

  /**
   * 序列化游戏状态
   */
  serializeGameState(gameState) {
    return {
      turn: gameState.turn,
      datetime: gameState.datetime,
      pressure: gameState.pressure,
      omega: gameState.omega,
      weather: gameState.weather,
      player: this.serializePlayer(gameState.player),
      npcs: gameState.npcs.map(npc => this.serializeNPC(npc)),
      history: gameState.history,
      config: gameState.config
    };
  }

  /**
   * 序列化玩家
   */
  serializePlayer(player) {
    return {
      id: player.id,
      name: player.name,
      identityType: player.identityType,
      traits: player.traits,
      obsession: player.obsession,
      states: player.states,
      position: player.position,
      bondedNPCs: player.bondedNPCs.map(npc => npc.id),
      inventory: player.inventory,
      memories: player.memories
    };
  }

  /**
   * 序列化NPC
   */
  serializeNPC(npc) {
    return {
      id: npc.id,
      name: npc.name,
      traits: npc.traits,
      obsession: npc.obsession,
      states: npc.states,
      position: npc.position,
      isBonded: npc.isBonded,
      isElite: npc.isElite,
      isUnlocked: npc.isUnlocked,
      knotMap: Array.from(npc.knotMap.entries())
    };
  }

  /**
   * 加载存档
   * @param {string} saveId - 存档ID
   * @returns {Object|null} 游戏状态
   */
  loadSave(saveId) {
    const saveData = this.loadFromStorage(saveId);
    if (!saveData) {
      return null;
    }

    return saveData.gameState;
  }

  /**
   * 获取所有存档列表
   */
  getSaveList() {
    try {
      const savesJson = localStorage.getItem(this.savesKey);
      return savesJson ? JSON.parse(savesJson) : [];
    } catch (e) {
      console.error('读取存档列表失败:', e);
      return [];
    }
  }

  /**
   * 删除存档
   * @param {string} saveId - 存档ID
   */
  deleteSave(saveId) {
    try {
      localStorage.removeItem(`${this.storageKey}_${saveId}`);
      
      // 从列表中移除
      const saves = this.getSaveList();
      const updatedSaves = saves.filter(s => s.id !== saveId);
      localStorage.setItem(this.savesKey, JSON.stringify(updatedSaves));
      
      return true;
    } catch (e) {
      console.error('删除存档失败:', e);
      return false;
    }
  }

  /**
   * 导出存档为文件
   * @param {string} saveId - 存档ID
   * @returns {string} JSON字符串
   */
  exportSave(saveId) {
    const saveData = this.loadFromStorage(saveId);
    if (!saveData) {
      return null;
    }

    return JSON.stringify(saveData, null, 2);
  }

  /**
   * 从文件导入存档
   * @param {string} jsonString - JSON字符串
   * @returns {Object|null} 存档数据
   */
  importSave(jsonString) {
    try {
      const saveData = JSON.parse(jsonString);
      
      // 验证存档格式
      if (!saveData.id || !saveData.gameState) {
        throw new Error('无效的存档格式');
      }

      // 生成新ID避免冲突
      saveData.id = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      saveData.name = `[导入] ${saveData.name}`;
      
      // 保存
      this.saveToStorage(saveData);
      this.addToSaveList(saveData);

      return saveData;
    } catch (e) {
      console.error('导入存档失败:', e);
      return null;
    }
  }

  /**
   * 自动存档
   * @param {Object} gameState - 当前游戏状态
   */
  autoSave(gameState) {
    const autoSaveData = {
      id: `autosave_${this.gameId}`,
      name: '自动存档',
      timestamp: Date.now(),
      gameState: this.serializeGameState(gameState),
      turn: gameState.turn,
      datetime: gameState.datetime,
      pressure: gameState.pressure,
      omega: gameState.omega,
      isAutoSave: true
    };

    try {
      localStorage.setItem(`${this.storageKey}_autosave`, JSON.stringify(autoSaveData));
    } catch (e) {
      console.error('自动存档失败:', e);
    }

    return autoSaveData;
  }

  /**
   * 加载自动存档
   */
  loadAutoSave() {
    try {
      const autoSaveJson = localStorage.getItem(`${this.storageKey}_autosave`);
      return autoSaveJson ? JSON.parse(autoSaveJson) : null;
    } catch (e) {
      console.error('读取自动存档失败:', e);
      return null;
    }
  }

  // ========== 私有方法 ==========

  saveToStorage(saveData) {
    try {
      localStorage.setItem(`${this.storageKey}_${saveData.id}`, JSON.stringify(saveData));
    } catch (e) {
      console.error('保存存档失败:', e);
      throw new Error('存档失败，可能是存储空间不足');
    }
  }

  loadFromStorage(saveId) {
    try {
      const saveJson = localStorage.getItem(`${this.storageKey}_${saveId}`);
      return saveJson ? JSON.parse(saveJson) : null;
    } catch (e) {
      console.error('读取存档失败:', e);
      return null;
    }
  }

  addToSaveList(saveData) {
    try {
      const saves = this.getSaveList();
      
      // 检查是否已存在
      const existingIndex = saves.findIndex(s => s.id === saveData.id);
      if (existingIndex >= 0) {
        saves[existingIndex] = this.getSaveSummary(saveData);
      } else {
        saves.push(this.getSaveSummary(saveData));
      }
      
      // 限制存档数量（最多20个，不包括自动存档）
      const manualSaves = saves.filter(s => !s.isAutoSave);
      const autoSaves = saves.filter(s => s.isAutoSave);
      
      if (manualSaves.length > 20) {
        // 删除最旧的存档
        const sortedSaves = manualSaves.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = sortedSaves.slice(0, manualSaves.length - 20);
        toDelete.forEach(s => this.deleteSave(s.id));
      }
      
      localStorage.setItem(this.savesKey, JSON.stringify([...manualSaves.slice(-20), ...autoSaves]));
    } catch (e) {
      console.error('更新存档列表失败:', e);
    }
  }

  getSaveSummary(saveData) {
    return {
      id: saveData.id,
      name: saveData.name,
      timestamp: saveData.timestamp,
      turn: saveData.turn,
      datetime: saveData.datetime,
      pressure: saveData.pressure,
      omega: saveData.omega,
      isAutoSave: saveData.isAutoSave || false
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SaveSystem };
}
