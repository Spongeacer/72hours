/**
 * 72Hours Narrative Engine
 * 基于引力模型的涌现式历史叙事系统
 */

// ==================== 核心配置 ====================
const CONFIG = {
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  START_DATE: new Date('1851-01-08T00:00:00'),
  
  // 引力计算参数
  GRAVITY: {
    G: 1.0,                    // 基础引力常数
    PRESSURE_MULTIPLIER: 0.02  // 压强对引力的调制系数
  },
  
  // 引力陷阱参数
  TRAP: {
    INITIAL: 0,                // 初始 G_trap
    BONUS_PER_EVENT: 0.5,      // 每次深度交互累加值
    DECAY_RATE: 0.1,           // 每回合衰减 10%
    MAX: 3.0                   // 上限
  },
  
  // 环境压强参数
  PRESSURE: {
    BASE_GROWTH: 0.5,          // 每回合基础增长
    VIOLENCE_BONUS: 5,         // 暴力选择增加量
    THRESHOLD_EARLY: 80        // 起义提前阈值
  },
  
  // NPC 移动参数
  MOVEMENT: {
    FEAR_ESCAPE_THRESHOLD: 80, // 恐惧逃跑阈值
    FEAR_BIAS_FACTOR: 0.3      // 恐惧对移动的偏向系数
  }
};

// ==================== 工具函数 ====================
const Utils = {
  // 欧几里得距离
  distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  },
  
  // 随机整数 [min, max]
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // 限制数值范围
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  
  // 向量归一化
  normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }
};

// ==================== 引力引擎 ====================
class GravityEngine {
  constructor(config) {
    this.config = config;
  }
  
  // 计算两个实体间的引力
  calculateGravity(entity1, entity2, pressure) {
    const r = Utils.distance(entity1.position, entity2.position);
    if (r === 0) return Infinity; // 同一位置，最大引力
    
    const m1 = entity1.getMass();
    const m2 = entity2.getMass();
    const G = this.config.GRAVITY.G;
    const P = 1 + (pressure * this.config.GRAVITY.PRESSURE_MULTIPLIER);
    
    return (G * m1 * m2 / (r * r)) * P;
  }
  
  // 计算引力陷阱偏移
  calculateTrapOffset(npc, player) {
    if (npc.trapConstant <= 0) return { x: 0, y: 0 };
    
    const r = Utils.distance(npc.position, player.position);
    const K = npc.knot;
    const offset = (npc.trapConstant * K) / (r + 1);
    
    // 计算朝向玩家的方向
    const direction = {
      x: player.position.x - npc.position.x,
      y: player.position.y - npc.position.y
    };
    const normalized = Utils.normalize(direction);
    
    // 如果 NPC 处于敌对状态，方向反转
    const hostilityMultiplier = npc.hostility > 50 ? -1 : 1;
    
    return {
      x: normalized.x * offset * hostilityMultiplier,
      y: normalized.y * offset * hostilityMultiplier
    };
  }
}

// ==================== 环境压强系统 ====================
class PressureSystem {
  constructor(config) {
    this.config = config;
    this.pressure = 10;  // 初始压强
  }
  
  // 回合更新
  update(turn, playerAction) {
    // 基础增长
    this.pressure += this.config.PRESSURE.BASE_GROWTH;
    
    // 玩家行为影响
    if (playerAction?.violent) {
      this.pressure += this.config.PRESSURE.VIOLENCE_BONUS;
    }
    
    // 限制范围
    this.pressure = Utils.clamp(this.pressure, 0, 100);
    
    return this.pressure;
  }
  
  // 检查起义提前
  checkEarlyUprising() {
    return this.pressure >= this.config.PRESSURE.THRESHOLD_EARLY;
  }
  
  getPressure() {
    return this.pressure;
  }
}

// ==================== 角色基类 ====================
class Agent {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position || { x: 0, y: 0 };
    
    // 质量组件
    this.baseMass = data.baseMass || 1;
    this.storyEvents = 0;
    this.knot = 0;
    
    // 属性
    this.traits = data.traits || [];
    this.obsession = data.obsession;
    this.states = {
      hunger: data.states?.hunger || 50,
      fear: data.states?.fear || 50,
      aggression: data.states?.aggression || 50
    };
    
    // 引力陷阱
    this.trapConstant = CONFIG.TRAP.INITIAL;
    this.hostility = 0;
    
    // 记忆
    this.memories = [];
  }
  
  // 计算总质量
  getMass() {
    return this.baseMass + this.storyEvents + this.knot;
  }
  
  // 增加关系羁绊
  addKnot(amount) {
    this.knot += amount;
    this.knot = Math.max(0, this.knot);
  }
  
  // 记录事件
  addStoryEvent() {
    this.storyEvents++;
  }
  
  // 添加记忆
  addMemory(memory) {
    this.memories.push(memory);
    if (this.memories.length > 20) {
      this.memories.shift(); // 保留最近20条
    }
  }
  
  // 更新引力陷阱
  updateTrap(bonus) {
    this.trapConstant += bonus;
    this.trapConstant = Utils.clamp(
      this.trapConstant, 
      0, 
      CONFIG.TRAP.MAX
    );
  }
  
  // 衰减引力陷阱
  decayTrap() {
    this.trapConstant *= (1 - CONFIG.TRAP.DECAY_RATE);
  }
  
  // 更新状态
  updateStates(delta) {
    this.states.hunger = Utils.clamp(this.states.hunger + (delta.hunger || 0), 0, 100);
    this.states.fear = Utils.clamp(this.states.fear + (delta.fear || 0), 0, 100);
    this.states.aggression = Utils.clamp(this.states.aggression + (delta.aggression || 0), 0, 100);
  }
}

// ==================== 玩家角色 ====================
class Player extends Agent {
  constructor(data) {
    super(data);
    this.isPlayer = true;
    this.position = { x: 0, y: 0 }; // 玩家始终在原点
  }
}

// ==================== NPC 角色 ====================
class NPC extends Agent {
  constructor(data) {
    super(data);
    this.isPlayer = false;
    this.behaviors = data.behaviors || [];
  }
  
  // 随机移动（带恐惧偏向和引力陷阱）
  move(player, gravityEngine) {
    // 基础随机移动
    let newX = Utils.randomInt(-2, 2);
    let newY = Utils.randomInt(-2, 2);
    
    // 恐惧偏向：高恐惧时远离玩家
    if (this.states.fear > CONFIG.MOVEMENT.FEAR_ESCAPE_THRESHOLD) {
      const escapeDir = Utils.normalize({
        x: this.position.x - player.position.x,
        y: this.position.y - player.position.y
      });
      newX += escapeDir.x * CONFIG.MOVEMENT.FEAR_BIAS_FACTOR * 2;
      newY += escapeDir.y * CONFIG.MOVEMENT.FEAR_BIAS_FACTOR * 2;
    }
    
    // 引力陷阱偏移
    const trapOffset = gravityEngine.calculateTrapOffset(this, player);
    newX += trapOffset.x;
    newY += trapOffset.y;
    
    // 应用移动并限制在网格内
    this.position.x = Utils.clamp(
      Math.round(this.position.x + newX),
      -CONFIG.GRID_SIZE,
      CONFIG.GRID_SIZE
    );
    this.position.y = Utils.clamp(
      Math.round(this.position.y + newY),
      -CONFIG.GRID_SIZE,
      CONFIG.GRID_SIZE
    );
  }
  
  // 检查是否触发行为
  checkBehaviorTrigger(player, worldState) {
    for (const behavior of this.behaviors) {
      if (behavior.check(this, player, worldState)) {
        return behavior;
      }
    }
    return null;
  }
}

// ==================== 回合管理器 ====================
class TurnManager {
  constructor(config) {
    this.config = config;
    this.turn = 1;
    this.gravityEngine = new GravityEngine(config);
    this.pressureSystem = new PressureSystem(config);
    this.history = [];
  }
  
  // 执行一个回合
  executeTurn(player, npcs, playerAction) {
    // 1. 更新世界状态
    const pressure = this.pressureSystem.update(this.turn, playerAction);
    
    // 2. NPC 移动
    for (const npc of npcs) {
      npc.move(player, this.gravityEngine);
      npc.decayTrap(); // 衰减引力陷阱
    }
    
    // 3. 计算引力，找出聚光灯 NPC
    let maxGravity = -1;
    let spotlightNPC = null;
    
    for (const npc of npcs) {
      const gravity = this.gravityEngine.calculateGravity(npc, player, pressure);
      if (gravity > maxGravity) {
        maxGravity = gravity;
        spotlightNPC = npc;
      }
    }
    
    // 4. 检查历史锚点
    const historicalEvent = this.checkHistoricalAnchor();
    
    // 5. 处理玩家行动结果
    if (playerAction) {
      this.processPlayerAction(player, spotlightNPC, playerAction);
    }
    
    // 6. 记录历史
    this.history.push({
      turn: this.turn,
      spotlightNPC: spotlightNPC?.name,
      pressure: pressure,
      playerAction: playerAction
    });
    
    // 7. 回合推进
    this.turn++;
    
    return {
      turn: this.turn - 1,
      spotlightNPC,
      pressure,
      historicalEvent,
      nextTurn: this.turn
    };
  }
  
  // 处理玩家行动
  processPlayerAction(player, npc, action) {
    // 更新玩家状态
    player.updateStates(action.stateDelta || {});
    
    // 如果有交互对象，更新关系
    if (npc && action.interaction) {
      if (action.interaction.deep) {
        // 深度交互：增加关系羁绊和引力陷阱
        npc.addKnot(action.interaction.knotDelta || 1);
        npc.updateTrap(CONFIG.TRAP.BONUS_PER_EVENT);
        npc.addMemory({
          type: 'interaction',
          content: action.description,
          turn: this.turn,
          impact: action.interaction.knotDelta || 1
        });
      }
      
      // 更新敌对值
      if (action.interaction.hostile) {
        npc.hostility += action.interaction.hostile;
      }
    }
  }
  
  // 检查历史锚点
  checkHistoricalAnchor() {
    // 第72回合：金田起义爆发
    if (this.turn === 72) {
      return {
        type: 'uprising',
        description: '金田起义爆发，太平天国建立',
        unavoidable: true
      };
    }
    
    // 环境压强触发提前起义
    if (this.pressureSystem.checkEarlyUprising() && this.turn >= 60) {
      return {
        type: 'early_uprising',
        description: `起义提前爆发（第${this.turn}回合）`,
        unavoidable: true
      };
    }
    
    return null;
  }
  
  getCurrentTurn() {
    return this.turn;
  }
  
  getHistory() {
    return this.history;
  }
}

// ==================== 叙事生成器 ====================
class NarrativeGenerator {
  constructor() {
    this.templates = {
      encounter: [
        "{weather}中，{npc}出现在{distance}。",
        "{npc}从{direction}走来，{state}。",
        "你注意到{npc}正在{action}。"
      ],
      interaction: [
        "\"{dialog}\"，{npc}{action}。",
        "{npc}看着你，{expression}。",
        "空气中弥漫着{tension}。"
      ]
    };
  }
  
  // 生成场景描述
  generateScene(spotlightNPC, player, worldState) {
    const distance = this.describeDistance(spotlightNPC.position);
    const weather = this.describeWeather(worldState.weather);
    const state = this.describeNPCState(spotlightNPC);
    
    // 根据玩家戾气值调整文本
    const aggression = player.states.aggression;
    let tension = "平静";
    if (aggression > 70) tension = "火药味";
    else if (aggression > 40) tension = "紧张";
    
    return {
      description: `${weather}，${spotlightNPC.name}出现在${distance}。${state}`,
      tension,
      npc: spotlightNPC,
      choices: this.generateChoices(spotlightNPC, player, worldState)
    };
  }
  
  // 描述距离
  describeDistance(position) {
    const r = Math.sqrt(position.x ** 2 + position.y ** 2);
    if (r <= 1) return "极近距离";
    if (r <= 2) return "附近";
    if (r <= 3) return "不远处";
    return "远处";
  }
  
  // 描述天气
  describeWeather(weather) {
    const map = {
      clear: "天清气朗",
      rain: "雨水淅沥",
      fog: "雾气弥漫",
      night: "夜色深沉"
    };
    return map[weather] || "";
  }
  
  // 描述 NPC 状态
  describeNPCState(npc) {
    if (npc.states.fear > 70) return "神色慌张";
    if (npc.states.aggression > 70) return "目露凶光";
    if (npc.knot > 5) return "似乎有话要对你说";
    return "若无其事地忙碌着";
  }
  
  // 生成选择项
  generateChoices(npc, player, worldState) {
    const choices = [];
    
    // 基础选择
    choices.push({
      id: 'observe',
      text: '观察对方',
      stateDelta: {},
      description: '你保持警惕，观察着对方的举动。'
    });
    
    // 根据 NPC 特质生成特定选择
    if (npc.traits.includes('贪婪')) {
      choices.push({
        id: 'bribe',
        text: '尝试贿赂',
        interaction: { deep: true, knotDelta: 1 },
        stateDelta: { aggression: -5 },
        description: '你掏出一些银两，试图收买对方。'
      });
    }
    
    if (npc.states.fear > 50) {
      choices.push({
        id: 'threaten',
        text: '出言威胁',
        interaction: { deep: true, hostile: 20 },
        stateDelta: { aggression: 10 },
        description: '你压低声音，暗示对方你知道他的秘密。'
      });
    }
    
    // 高戾气时增加暴力选项
    if (player.states.aggression > 60) {
      choices.push({
        id: 'attack',
        text: '动手',
        violent: true,
        interaction: { deep: true, hostile: 50 },
        stateDelta: { aggression: 15 },
        description: '你按捺不住，准备动手。'
      });
    }
    
    return choices;
  }
}

// ==================== 游戏主类 ====================
class Game72Hours {
  constructor() {
    this.config = CONFIG;
    this.turnManager = new TurnManager(CONFIG);
    this.narrativeGenerator = new NarrativeGenerator();
    this.player = null;
    this.npcs = [];
    this.worldState = {
      weather: 'night',
      chaos: 5,
      uprisingProgress: 0
    };
  }
  
  // 初始化游戏
  init(playerData, npcDataList) {
    this.player = new Player(playerData);
    this.npcs = npcDataList.map(data => new NPC(data));
    
    // 随机分布 NPC
    for (const npc of this.npcs) {
      npc.position = {
        x: Utils.randomInt(-CONFIG.GRID_SIZE, CONFIG.GRID_SIZE),
        y: Utils.randomInt(-CONFIG.GRID_SIZE, CONFIG.GRID_SIZE)
      };
    }
  }
  
  // 执行回合
  playTurn(playerAction) {
    const turnResult = this.turnManager.executeTurn(
      this.player,
      this.npcs,
      playerAction
    );
    
    // 更新天气（简单轮换）
    this.updateWeather();
    
    // 生成叙事
    const scene = this.narrativeGenerator.generateScene(
      turnResult.spotlightNPC,
      this.player,
      this.worldState
    );
    
    return {
      ...turnResult,
      scene,
      gameOver: this.checkGameOver()
    };
  }
  
  // 更新天气
  updateWeather() {
    const turn = this.turnManager.getCurrentTurn();
    const hour = turn % 24;
    
    if (hour >= 6 && hour < 18) {
      this.worldState.weather = 'clear';
    } else if (hour >= 20 || hour < 5) {
      this.worldState.weather = 'night';
    } else {
      this.worldState.weather = 'fog';
    }
  }
  
  // 检查游戏结束
  checkGameOver() {
    const turn = this.turnManager.getCurrentTurn();
    return turn > CONFIG.MAX_TURNS;
  }
  
  // 获取游戏状态
  getState() {
    return {
      turn: this.turnManager.getCurrentTurn(),
      player: this.player,
      npcs: this.npcs,
      worldState: this.worldState,
      pressure: this.turnManager.pressureSystem.getPressure()
    };
  }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Game72Hours,
    Player,
    NPC,
    GravityEngine,
    PressureSystem,
    TurnManager,
    NarrativeGenerator,
    Utils,
    CONFIG
  };
}
