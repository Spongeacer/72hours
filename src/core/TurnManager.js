/**
 * 回合管理器 - 核心游戏流程控制
 */

const { GravityEngine } = require('../core/GravityEngine');
const { PressureSystem } = require('../core/PressureSystem');
const { MassSystem } = require('../core/MassSystem');
const { CoordinateSystem } = require('../core/CoordinateSystem');
const { Utils } = require('../utils/Utils');

class TurnManager {
  constructor(gameState, narrativeEngine) {
    this.gameState = gameState;
    this.narrativeEngine = narrativeEngine;
    
    // 核心系统
    this.gravityEngine = new GravityEngine();
    this.pressureSystem = new PressureSystem();
    this.massSystem = new MassSystem();
    this.coordinateSystem = new CoordinateSystem();
    
    this.turn = 0;
  }

  /**
   * 执行一个回合
   */
  async executeTurn(playerChoice = null) {
    this.turn++;
    
    // 1. 更新世界状态
    this.updateWorldState();
    
    // 2. 检查事件触发
    const triggeredEvent = this.checkEventTrigger();
    
    // 3. NPC移动
    this.moveAllNPCs();
    
    // 4. 计算引力，选择聚光灯
    const { npc: spotlightNPC, gravity } = this.selectSpotlight();
    
    // 5. 生成叙事
    const narrativeContext = this.assembleContext(spotlightNPC, triggeredEvent);
    const narrative = await this.narrativeEngine.generateScene(narrativeContext);
    const choices = await this.narrativeEngine.generateChoices(narrativeContext);
    
    // 将 choices 添加到 context，供后续使用
    narrativeContext.choices = choices;
    
    // 6. 返回叙事和选择给玩家
    return {
      turn: this.turn,
      narrative,
      choices,
      context: narrativeContext
    };
  }

  /**
   * 处理玩家选择
   */
  async processChoice(choice, context) {
    // 使用完整的player实例
    const player = context.playerRef || this.gameState.player;
    const spotlightNPC = context.spotlightNPC;
    
    // 7. 生成结果描述
    const result = await this.narrativeEngine.generateResult(context, choice);
    
    // 8. 更新状态
    this.updatePlayerStates(player, result);
    this.updateNPCStates(spotlightNPC, result);
    this.updateRelationships(player, spotlightNPC, result);
    
    // 9. 检查游戏结束
    const gameOver = this.checkGameOver();
    
    return {
      success: true,
      result,
      gameOver,
      context, // 返回上下文供后续使用
      nextTurn: gameOver ? null : this.turn + 1
    };
  }

  /**
   * 更新世界状态
   */
  updateWorldState() {
    const { player } = this.gameState;
    
    // 更新回合
    this.gameState.turn = this.turn;
    
    // 更新Ω
    this.gameState.omega = this.calculateOmega(this.turn);
    
    // 更新压强
    this.pressureSystem.update(this.turn);
    this.gameState.pressure = this.pressureSystem.getPressure();
    
    // 更新天气
    this.gameState.weather = Utils.calculateWeather(this.turn);
    
    // 更新日期时间
    this.gameState.datetime = Utils.calculateGameTime(this.turn);
  }

  /**
   * 计算全局因子Ω
   * 基于 DESIGN.md v1.1：前期线性增长，60回合后指数增长
   */
  calculateOmega(turn) {
    const config = this.gameState.config || {};
    const OMEGA = config.OMEGA || { 
      INITIAL: 1.0, 
      LINEAR_GROWTH: 0.02,
      EXPONENTIAL_THRESHOLD: 60,
      EXPONENTIAL_BASE: 1.05,
      MAX: 5.0
    };
    
    let omega;
    if (turn <= OMEGA.EXPONENTIAL_THRESHOLD) {
      // 线性阶段：Ω = 1.0 + turn * 0.02
      omega = OMEGA.INITIAL + (turn * OMEGA.LINEAR_GROWTH);
    } else {
      // 指数阶段：线性部分 * (1.05 ^ (turn - 60))
      const linearPart = OMEGA.INITIAL + 
        (OMEGA.EXPONENTIAL_THRESHOLD * OMEGA.LINEAR_GROWTH);
      const expTurns = turn - OMEGA.EXPONENTIAL_THRESHOLD;
      omega = linearPart * Math.pow(OMEGA.EXPONENTIAL_BASE, expTurns);
    }
    
    // 限制最大值
    return Math.min(omega, OMEGA.MAX);
  }

  /**
   * 检查事件触发
   */
  checkEventTrigger() {
    const { turn, pressure, player, npcs } = this.gameState;
    
    // 检查锚点2：官兵搜查
    if (turn >= 18 && turn <= 30) {
      const raidCheck = this.pressureSystem.checkRaidTrigger(player);
      if (raidCheck.triggered) {
        return { id: 'raid', early: raidCheck.early };
      }
    }
    
    // 检查锚点3：天父下凡
    if (turn >= 44 && turn <= 52) {
      const cultistNPCs = npcs.filter(n => n.hasTrait('cultist'));
      const yangXiuqing = npcs.find(n => n.id === 'yang_xiuqing');
      const divineCheck = this.pressureSystem.checkDivineTrigger(
        cultistNPCs, yangXiuqing, player
      );
      if (divineCheck.triggered) {
        return { id: 'divine', early: divineCheck.early };
      }
    }
    
    // 检查随机事件（低概率）
    if (Math.random() < 0.1) {
      return this.selectRandomEvent();
    }
    
    return null;
  }

  /**
   * 选择随机事件
   */
  selectRandomEvent() {
    const events = ['missionary', 'tax_collection', 'plague', 'refugees', 'banquet', 'omen'];
    return { id: Utils.randomChoice(events), random: true };
  }

  /**
   * 移动所有NPC
   */
  moveAllNPCs() {
    const { player, npcs } = this.gameState;
    
    for (const npc of npcs) {
      if (!npc.isUnlocked) continue;
      
      // 移动
      npc.move(player, this.gravityEngine, this.coordinateSystem);
      
      // 衰减引力陷阱
      npc.decayTrap();
      
      // 衰减TTL
      npc.decayTTL();
    }
    
    // 移除应该消失的NPC
    this.gameState.npcs = npcs.filter(n => !n.shouldDisappear());
  }

  /**
   * 选择聚光灯NPC
   */
  selectSpotlight() {
    const { player, npcs, pressure, omega } = this.gameState;
    
    return this.gravityEngine.findSpotlightNPC(
      player, 
      npcs.filter(n => n.isUnlocked),
      pressure,
      omega
    );
  }

  /**
   * 组装叙事上下文
   */
  assembleContext(spotlightNPC, event) {
    const { player, pressure, omega, weather, turn } = this.gameState;
    
    return {
      turn,
      scene: {
        time: Utils.formatDate(Utils.calculateGameTime(turn)),
        weather,
        pressure,
        omega: omega.toFixed(2)
      },
      spotlight: spotlightNPC ? {
        name: spotlightNPC.name,
        traits: spotlightNPC.traits,
        obsession: spotlightNPC.obsession,
        states: spotlightNPC.states,
        knotWithPlayer: spotlightNPC.getKnotWith(player.id)
      } : null,
      spotlightNPC: spotlightNPC, // 保留完整的NPC实例引用
      player: {
        identity: player.getIdentityDescription(),
        traits: player.traits,
        states: player.states,
        inventory: player.inventory.map(i => i.name),
        aura: player.getAura()
      },
      playerRef: player, // 保留完整的player实例引用
      event: event ? { id: event.id, early: event.early } : null,
      memories: this.getRelevantMemories(player, spotlightNPC)
    };
  }

  /**
   * 获取相关记忆
   */
  getRelevantMemories(player, npc) {
    if (!npc) return [];
    
    const memories = [
      ...player.getMemoriesWith(npc.id),
      ...npc.getMemoriesWith(player.id)
    ];
    
    // 按时间排序，取最近5条
    return memories
      .sort((a, b) => b.turn - a.turn)
      .slice(0, 5);
  }

  /**
   * 更新玩家状态
   */
  updatePlayerStates(player, result) {
    if (result.stateDelta) {
      player.updateStates(result.stateDelta);
    }
    
    if (result.itemGained) {
      player.inventory.push(result.itemGained);
      this.massSystem.updateObjectMass(player);
    }
    
    if (result.itemLost) {
      player.inventory = player.inventory.filter(i => i.id !== result.itemLost.id);
      this.massSystem.updateObjectMass(player);
    }
  }

  /**
   * 更新NPC状态
   */
  updateNPCStates(npc, result) {
    if (!npc) return;
    
    if (result.npcStateDelta) {
      npc.updateStates(result.npcStateDelta);
    }
    
    // 添加记忆
    if (result.memory) {
      npc.addMemory({
        ...result.memory,
        targetId: this.gameState.player.id
      });
    }
  }

  /**
   * 更新关系
   */
  updateRelationships(player, npc, result) {
    if (!npc) return;
    
    if (result.knotDelta) {
      player.updateKnot(npc.id, result.knotDelta);
      npc.updateKnot(player.id, result.knotDelta);
    }
    
    if (result.hostilityDelta) {
      npc.updateHostility(player.id, result.hostilityDelta);
    }
    
    if (result.deepInteraction) {
      npc.updateTrap(this.gameState.config?.TRAP?.BONUS_PER_DEEP_EVENT || 0.5);
    }
  }

  /**
   * 检查游戏结束
   */
  checkGameOver() {
    const { player } = this.gameState;
    
    // 死亡
    if (player.checkDeath()) {
      return { type: 'death', reason: 'injury_or_hunger' };
    }
    
    // 逃离
    if (player.checkEscape()) {
      return { type: 'escape' };
    }
    
    // 完成72回合
    if (this.turn >= 72) {
      return { type: 'completed' };
    }
    
    return null;
  }

  /**
   * 获取当前回合
   */
  getTurn() {
    return this.turn;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TurnManager };
}
