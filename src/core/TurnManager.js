/**
 * 回合管理器 - 核心游戏流程控制
 */

const { GravityEngine } = require('../core/GravityEngine');
const { PressureSystem } = require('../core/PressureSystem');
const { MassSystem } = require('../core/MassSystem');
const { CoordinateSystem } = require('../core/CoordinateSystem');
const { SceneLocationSystem } = require('../core/SceneLocationSystem');
const { ClueSystem } = require('../core/ClueSystem');
const { AtmosphereSystem } = require('../core/AtmosphereSystem');
const { ResultDiversitySystem } = require('../core/ResultDiversitySystem');
const { TimeProgressionSystem } = require('../core/TimeProgressionSystem');
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
    this.sceneLocationSystem = new SceneLocationSystem();
    this.clueSystem = new ClueSystem(); // 线索系统
    this.atmosphereSystem = new AtmosphereSystem(); // 氛围系统
    this.resultDiversitySystem = new ResultDiversitySystem(); // 结果多样性系统
    this.timeProgressionSystem = new TimeProgressionSystem(); // 时间推进系统
    
    this.turn = 0;
    
    // NPC轮换追踪（基于 DESIGN.md 涌现式原则）
    this.spotlightHistory = []; // 记录最近几回合的聚光灯NPC
    this.maxConsecutiveRounds = 3; // 同一NPC最多连续3回合
    this.rotationCooldown = new Map(); // NPC轮换冷却
    
    // 场景转换追踪
    this.lastPlayerPosition = null; // 上回合玩家位置
    this.currentLocation = null; // 当前位置
  }

  /**
   * 执行一个回合
   */
  async executeTurn(playerChoice = null) {
    this.turn++;
    
    // 1. 更新世界状态
    this.updateWorldState();
    
    // 2. 生成场景转换描述（如果位置变化）
    const transition = this.generateSceneTransition();
    
    // 3. 检查事件触发
    const triggeredEvent = this.checkEventTrigger();
    
    // 4. NPC移动
    this.moveAllNPCs();
    
    // 5. 计算引力，选择聚光灯
    const { npc: spotlightNPC, gravity } = this.selectSpotlight();
    
    // 6. 生成叙事
    const narrativeContext = this.assembleContext(spotlightNPC, triggeredEvent, transition);
    const narrative = await this.narrativeEngine.generateScene(narrativeContext);
    
    // 7. 从叙事中提取线索
    const extractedClues = this.clueSystem.extractCluesFromNarrative(
      narrative, this.turn, this.gameState.npcs
    );
    for (const clueData of extractedClues) {
      this.clueSystem.introduceClue({ ...clueData, turn: this.turn });
    }
    
    // 8. 生成选择
    const choices = await this.narrativeEngine.generateChoices(narrativeContext);
    
    // 将 choices 添加到 context，供后续使用
    narrativeContext.choices = choices;
    
    // 9. 返回叙事和选择给玩家
    return {
      turn: this.turn,
      narrative,
      choices,
      context: narrativeContext,
      transition: transition,
      clues: {
        extracted: extractedClues,
        active: this.clueSystem.getActiveClues()
      }
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
    let result = await this.narrativeEngine.generateResult(context, choice);
    
    // 8. 应用结果多样性（基于 DESIGN.md：物理驱动叙事）
    result = this.resultDiversitySystem.generateDiverseResult(choice, context, result);
    
    // 9. 更新状态
    this.updatePlayerStates(player, result);
    this.updateNPCStates(spotlightNPC, result);
    this.updateRelationships(player, spotlightNPC, result);
    
    // 10. 应用额外效果（来自结果多样性系统）
    this.applyDiverseEffects(result, player, spotlightNPC);
    
    // 11. 检查游戏结束
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
  /**
   * 更新世界状态
   * 使用 TimeProgressionSystem 进行变速时间推进
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
    
    // 使用 TimeProgressionSystem 计算游戏时间（变速推进）
    this.gameState.datetime = this.timeProgressionSystem.calculateGameTime(this.turn);
    
    // 获取当前小时数用于天气计算
    const currentHour = this.gameState.datetime.getHours();
    
    // 更新天气（基于时间和回合）
    this.gameState.weather = this.timeProgressionSystem.calculateWeather(this.turn, currentHour);
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
   * 选择聚光灯NPC（带轮换机制）
   * 基于 DESIGN.md：物理驱动叙事，玩家是催化剂
   * 
   * 轮换原则：
   * 1. 同一NPC最多连续3回合（避免故事线单一）
   * 2. 高K值NPC有回归优先权（羁绊深的NPC会主动找你）
   * 3. 物理引力仍是主要决定因素（F = G×M₁×M₂/r²×P×Ω）
   * 4. 轮换不是强制，而是物理状态的涌现结果
   */
  selectSpotlight() {
    const { player, npcs, pressure, omega } = this.gameState;
    const unlockedNPCs = npcs.filter(n => n.isUnlocked);
    
    if (unlockedNPCs.length === 0) {
      return { npc: null, gravity: 0 };
    }
    
    // 计算所有NPC的引力
    const npcGravities = unlockedNPCs.map(npc => ({
      npc,
      gravity: this.gravityEngine.calculateGravity(npc, player, pressure, omega),
      knot: npc.getKnotWith(player.id)
    }));
    
    // 检查是否需要轮换（同一NPC连续超过3回合）
    const lastNPC = this.spotlightHistory[this.spotlightHistory.length - 1];
    const consecutiveCount = this.getConsecutiveCount(lastNPC);
    
    if (consecutiveCount >= this.maxConsecutiveRounds && unlockedNPCs.length > 1) {
      // 需要轮换 - 暂时降低当前聚光灯NPC的引力权重
      // 这不是强制，而是模拟"故事自然流转"的涌现效果
      const currentSpotlight = npcGravities.find(g => g.npc.id === lastNPC?.id);
      if (currentSpotlight) {
        currentSpotlight.gravity *= 0.5; // 降低50%权重，给其他NPC机会
        currentSpotlight.rotationPenalty = true; // 标记为轮换惩罚
      }
    }
    
    // 高K值NPC的回归机制（羁绊深的NPC会主动找你）
    // 这是"玩家是催化剂"的体现 - 你的存在改变了NPC的行为
    npcGravities.forEach(g => {
      if (g.knot >= 5 && g.npc.id !== lastNPC?.id) {
        // 羁绊≥5的NPC，如果不在聚光灯，会增加"回归"引力
        // 模拟NPC主动寻找玩家的行为
        g.gravity *= (1 + (g.knot - 5) * 0.1); // 最多增加30%
        g.regressionBoost = true; // 标记为回归增强
      }
    });
    
    // 按引力排序，选择最高的
    npcGravities.sort((a, b) => b.gravity - a.gravity);
    const selected = npcGravities[0];
    
    // 记录历史
    this.spotlightHistory.push({
      npcId: selected.npc.id,
      turn: this.turn,
      gravity: selected.gravity,
      knot: selected.knot,
      rotationPenalty: selected.rotationPenalty || false,
      regressionBoost: selected.regressionBoost || false
    });
    
    // 只保留最近10回合的历史
    if (this.spotlightHistory.length > 10) {
      this.spotlightHistory.shift();
    }
    
    return { npc: selected.npc, gravity: selected.gravity };
  }
  
  /**
   * 获取同一NPC连续出现的回合数
   */
  getConsecutiveCount(npc) {
    if (!npc || this.spotlightHistory.length === 0) return 0;
    
    let count = 0;
    for (let i = this.spotlightHistory.length - 1; i >= 0; i--) {
      if (this.spotlightHistory[i].npcId === npc.id) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * 组装叙事上下文
   */
  assembleContext(spotlightNPC, event, transition = null) {
    const { player, pressure, omega, weather, turn } = this.gameState;
    
    // 获取轮换信息
    const rotationInfo = this.getRotationInfo(spotlightNPC);
    
    // 获取当前位置信息
    const currentLocation = this.currentLocation || 
      this.sceneLocationSystem.getLocationByCoordinates(player.position.x, player.position.y);
    
    // 生成氛围信息
    const timeOfDay = this.getTimeOfDay();
    const atmosphere = this.atmosphereSystem.generateAtmosphere(pressure, omega, weather, timeOfDay);
    const atmosphereHints = this.atmosphereSystem.generateNarrativeHints(pressure, omega);
    
    // 获取时间推进信息
    const timeProgression = this.timeProgressionSystem.getTimeProgressionDescription(turn);
    const timeNarrativeHint = this.timeProgressionSystem.generateTimeNarrativeHint(turn);
    const timeStats = this.timeProgressionSystem.getTimeStats(turn);
    
    return {
      turn,
      scene: {
        time: Utils.formatDate(Utils.calculateGameTime(turn)),
        weather,
        pressure,
        omega: omega.toFixed(2),
        location: currentLocation ? {
          id: currentLocation.id,
          name: currentLocation.name,
          description: currentLocation.description,
          tags: currentLocation.tags
        } : null,
        atmosphere: {
          ...atmosphere,
          hints: atmosphereHints
        },
        timeProgression: {
          ...timeProgression,
          hint: timeNarrativeHint,
          stats: timeStats
        }
      },
      spotlight: spotlightNPC ? {
        name: spotlightNPC.name,
        traits: spotlightNPC.traits,
        obsession: spotlightNPC.obsession,
        states: spotlightNPC.states,
        knotWithPlayer: spotlightNPC.getKnotWith(player.id),
        rotationInfo: rotationInfo
      } : null,
      spotlightNPC: spotlightNPC,
      player: {
        identity: player.getIdentityDescription(),
        traits: player.traits,
        states: player.states,
        inventory: player.inventory.map(i => i.name),
        aura: player.getAura(),
        position: player.position
      },
      playerRef: player,
      event: event ? { id: event.id, early: event.early } : null,
      memories: this.getRelevantMemories(player, spotlightNPC),
      rotation: {
        history: this.spotlightHistory.slice(-5),
        consecutiveCount: this.getConsecutiveCount(spotlightNPC)
      },
      transition: transition,
      clues: {
        followUps: this.clueSystem.checkFollowUps(turn, player, spotlightNPC),
        active: this.clueSystem.getActiveClues(),
        stats: this.clueSystem.getStats()
      }
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
   * 应用多样化的效果
   * 基于 DESIGN.md：物理驱动叙事，玩家是催化剂
   */
  applyDiverseEffects(result, player, npc) {
    // 应用NPC移动效果
    if (result.npcMove && npc) {
      if (result.npcMove.action === 'follow') {
        // NPC跟随玩家
        npc.position = { ...player.position };
        console.log(`[结果多样性] ${npc.name}决定跟随玩家`);
      } else if (result.npcMove.action === 'leave') {
        // NPC离开当前位置
        const escapeDir = {
          x: npc.position.x - player.position.x,
          y: npc.position.y - player.position.y
        };
        const normalized = this.normalizeVector(escapeDir);
        npc.position.x += normalized.x * 2;
        npc.position.y += normalized.y * 2;
        console.log(`[结果多样性] ${npc.name}选择离开`);
      }
    }
    
    // 应用位置变化效果
    if (result.positionChange) {
      player.position = result.positionChange;
      console.log(`[结果多样性] 玩家位置变化`);
    }
  }
  
  /**
   * 向量归一化辅助函数
   */
  normalizeVector(vec) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vec.x / length, y: vec.y / length };
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
   * 生成场景转换描述
   * 基于 DESIGN.md：物理驱动叙事，故事自己涌现
   */
  generateSceneTransition() {
    const { player, weather } = this.gameState;
    
    // 获取当前位置
    const currentPos = player.position;
    
    // 如果是第一回合，初始化位置
    if (!this.lastPlayerPosition) {
      this.lastPlayerPosition = { ...currentPos };
      this.currentLocation = this.sceneLocationSystem.getLocationByCoordinates(
        currentPos.x, currentPos.y
      );
      return null;
    }
    
    // 检查位置是否变化
    const distance = Math.sqrt(
      Math.pow(currentPos.x - this.lastPlayerPosition.x, 2) +
      Math.pow(currentPos.y - this.lastPlayerPosition.y, 2)
    );
    
    // 位置没有显著变化，不生成转换
    if (distance < 0.5) {
      return null;
    }
    
    // 生成转换描述
    const timeOfDay = this.getTimeOfDay();
    const transition = this.sceneLocationSystem.generateTransition(
      this.lastPlayerPosition.x,
      this.lastPlayerPosition.y,
      currentPos.x,
      currentPos.y,
      weather,
      timeOfDay
    );
    
    // 更新位置记录
    this.lastPlayerPosition = { ...currentPos };
    this.currentLocation = this.sceneLocationSystem.getLocationByCoordinates(
      currentPos.x, currentPos.y
    );
    
    return transition;
  }
  
  /**
   * 获取当前时间段
   */
  getTimeOfDay() {
    const hour = this.gameState.datetime.getHours();
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 13) return 'noon';
    if (hour >= 13 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  }
  getTurn() {
    return this.turn;
  }
  
  /**
   * 获取轮换信息（用于叙事提示）
   * 基于 DESIGN.md：物理驱动叙事，故事自己涌现
   */
  getRotationInfo(spotlightNPC) {
    if (!spotlightNPC || this.spotlightHistory.length === 0) {
      return { type: 'first_meeting', description: '初次相遇' };
    }
    
    const lastEntry = this.spotlightHistory[this.spotlightHistory.length - 1];
    const consecutive = this.getConsecutiveCount(spotlightNPC);
    const knot = spotlightNPC.getKnotWith(this.gameState.player.id);
    
    // 根据轮换状态生成叙事提示
    if (consecutive >= 3) {
      return {
        type: 'deep_engagement',
        description: '你们已经深入交流多时，故事在此刻聚焦',
        hint: '可以体现羁绊的深化或关系的转折'
      };
    }
    
    if (lastEntry.npcId !== spotlightNPC.id && knot >= 5) {
      return {
        type: 'regression',
        description: `${spotlightNPC.name}主动找到你`,
        hint: '羁绊深的NPC会主动寻找玩家，体现"玩家是催化剂"'
      };
    }
    
    if (lastEntry.rotationPenalty && lastEntry.npcId === spotlightNPC.id) {
      return {
        type: 'forced_rotation',
        description: '故事自然流转，新的角色进入视野',
        hint: '避免单一NPC过度聚焦，保持故事多样性'
      };
    }
    
    return {
      type: 'natural_flow',
      description: '故事自然流淌',
      hint: '物理引力决定聚光灯，玩家在场即影响'
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TurnManager };
}
