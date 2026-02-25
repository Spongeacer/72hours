# 72Hours 架构设计文档

## 1. 项目目录结构

```
72Hours/
├── src/
│   ├── core/           # 物理引擎核心
│   │   ├── GravityEngine.js      # 引力计算
│   │   ├── PressureSystem.js     # 压强系统
│   │   ├── MassSystem.js         # 质量系统
│   │   ├── CoordinateSystem.js   # 坐标系统
│   │   └── TurnManager.js        # 回合管理
│   │
│   ├── agents/         # 角色系统
│   │   ├── Agent.js              # 角色基类
│   │   ├── Player.js             # 玩家角色
│   │   ├── NPC.js                # NPC角色
│   │   ├── EliteNPC.js           # 精英NPC
│   │   └── BondedNPC.js          # 关联NPC
│   │
│   ├── narrative/      # 叙事系统
│   │   ├── NarrativeEngine.js    # 叙事引擎
│   │   ├── BehaviorSelector.js   # 行为选择
│   │   ├── SceneAssembler.js     # 场景拼装
│   │   └── AIInterface.js        # AI接口
│   │
│   ├── data/           # 数据层
│   │   ├── TraitDatabase.js      # 特质库
│   │   ├── NPCDatabase.js        # NPC数据库
│   │   ├── EventDatabase.js      # 事件数据库
│   │   └── MemorySystem.js       # 记忆系统
│   │
│   └── utils/          # 工具函数
│       ├── Random.js             # 随机工具
│       ├── Distance.js           # 距离计算
│       └── Constants.js          # 常量定义
│
├── config/             # 配置文件
│   ├── gameConfig.js             # 游戏配置
│   └── narrativePrompts.js       # AI提示词
│
├── tests/              # 测试文件
│   └── integration.test.js       # 集成测试
│
└── docs/               # 文档
    ├── DESIGN.md
    ├── TRAITS.md
    ├── NPCS.md
    ├── PLAYERS.md
    └── EVENTS.md
```

---

## 2. 核心类图

### 2.1 物理引擎层

```javascript
class GravityEngine {
  calculateGravity(agent1, agent2, pressure, omega)
  calculateTrapOffset(npc, player)
  findSpotlightNPC(player, npcs, pressure, omega)
}

class PressureSystem {
  P_history: number          // 历史压强
  update(turn, playerAction)
  getTotalPressure(playerTraits, npcTraits)
  checkAnchorTrigger(anchorId)
}

class MassSystem {
  calculateMass(agent)       // M = B + S + K + O
  updateStoryMass(agent, event)
  updateKnotMass(agent1, agent2, delta)
  updateObjectMass(agent, item)
}

class CoordinateSystem {
  gridSize: 5
  randomWalk(agent, fear, trapOffset)
  calculateDistance(pos1, pos2)
  clampPosition(pos)
}
```

### 2.2 角色系统

```javascript
class Agent {
  id: string
  name: string
  position: {x, y}
  baseMass: number           // B
  storyMass: number          // S
  knotMass: Map<id, number>  // K
  objectMass: number         // O
  
  traits: Trait[]
  obsession: Obsession
  states: {fear, aggression, hunger, injury}
  memories: Memory[]
  inventory: Item[]
  
  getTotalMass()
  updateStates(delta)
  addMemory(memory)
}

class Player extends Agent {
  identity: Identity         // 读书人/地主/士兵/教徒
  bondedNPCs: NPC[]          // 关联NPC
  
  generateObsession()
  checkDeath()
  checkEscape()
}

class NPC extends Agent {
  isElite: boolean
  isBonded: boolean
  unlockCondition: Condition
  trapConstant: number
  hostility: Map<id, number>
  
  checkUnlock(gameState)
  calculateBehaviorTendency(player, env)
  move(player, gravityEngine)
}
```

### 2.3 叙事系统

```javascript
class NarrativeEngine {
  generateScene(context)
  generateChoices(context)
  generateResult(context, choice)
  generateDeathEpilogue(player)
  generateEndingEpilogue(player)
}

class BehaviorSelector {
  behaviors: [Seizure, Conflict, Eavesdrop, Conversation, Request, Give]
  
  selectBehavior(npc, player, env)
  calculateTendency(behavior, npc, player, env)
}

class AIInterface {
  promptTemplate: string
  
  generateNarrative(promptData)
  parseResponse(response)
}
```

### 2.4 回合管理

```javascript
class TurnManager {
  turn: number
  maxTurns: 72
  
  gameState: GameState
  gravityEngine: GravityEngine
  pressureSystem: PressureSystem
  narrativeEngine: NarrativeEngine
  
  executeTurn(playerChoice)
  checkEventTrigger()
  checkAnchorTrigger()
  checkGameOver()
  
  updateWorldState()
  moveAllNPCs()
  calculateGravity()
  selectSpotlight()
  generateNarrative()
  processChoice()
  updateRelationships()
}

class GameState {
  turn: number
  datetime: Date
  pressure: number
  omega: number
  weather: string
  
  player: Player
  npcs: NPC[]
  unlockedElites: Set<id>
  activeEvents: Event[]
  history: TurnRecord[]
}
```

---

## 3. 数据流图

### 3.1 回合流程

```
┌─────────────────────────────────────────────────────────────┐
│                         回合开始                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. 更新世界状态                                               │
│    - turn++                                                   │
│    - Ω = calculateOmega(turn)                                │
│    - P_history = calculatePressureHistory(turn)              │
│    - weather = updateWeather(turn)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 检查事件触发                                               │
│    - checkAnchorTriggers()                                    │
│    - checkRandomEvents()                                      │
│    - IF 触发: event = getEvent()                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. NPC移动                                                   │
│    - FOR each NPC:                                            │
│      - trapOffset = gravityEngine.calculateTrapOffset()      │
│      - fearBias = calculateFearBias(npc.states.fear)         │
│      - newPos = coordinateSystem.randomWalk()                │
│      - npc.position = newPos                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 计算引力 + 选择聚光灯                                       │
│    - FOR each NPC:                                            │
│      - F = gravityEngine.calculateGravity(npc, player)       │
│    - spotlight = max(F)                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 生成叙事                                                   │
│    - context = assembleContext(player, spotlight, event)     │
│    - narrative = narrativeEngine.generateScene(context)      │
│    - choices = narrativeEngine.generateChoices(context)      │
│    - DISPLAY: narrative + choices                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 等待玩家选择                                               │
│    - playerChoice = getPlayerInput()                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. 处理选择结果                                               │
│    - result = narrativeEngine.generateResult(context, choice)│
│    - updatePlayerStates(player, result)                      │
│    - updateNPCStates(spotlight, result)                      │
│    - updateRelationships(player, spotlight, result)          │
│    - IF itemTransfer: updateObjectMass()                     │
│    - DISPLAY: result                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. 检查游戏结束                                               │
│    - IF player.dead: generateDeathEpilogue() → END           │
│    - IF player.escaped: generateEscapeEpilogue() → END       │
│    - IF turn >= 72: generateEndingEpilogue() → END           │
│    - ELSE: 回合结束 → 下一回合                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. AI叙事接口设计

### 4.1 Prompt结构

```javascript
const narrativePrompt = {
  role: "你是《72Hours》的叙事导演。",
  
  input: {
    scene: {
      time: "深夜",
      location: "破庙",
      weather: "雨",
      pressure: 65,
      omega: 1.4
    },
    
    spotlight: {
      name: "逃兵李三",
      traits: ["怯懦", "饥饿"],
      obsession: "苟活下去",
      fear: 80,
      hunger: 70,
      knotWithPlayer: 3
    },
    
    player: {
      identity: "读书人",
      traits: ["冷静", "多疑"],
      states: {fear: 40, aggression: 20},
      inventory: ["线装书"],
      aura: "沉默的警惕"
    },
    
    event: {
      id: "官兵搜查",
      triggered: false
    },
    
    memory: "玩家曾给予李三食物"
  },
  
  output: {
    narrative: "100-150字的场景描述",
    atmosphere: "压抑/紧张/温情/绝望",
    choices: [
      { id: 1, text: "开放描述的选择1" },
      { id: 2, text: "开放描述的选择2" },
      { id: 3, text: "开放描述的选择3" }
    ]
  },
  
  style: {
    tone: "粗粝、留白、时代感",
    focus: ["动作细节", "环境渗透", "不解释心理"],
    avoid: ["解释动机", "直白情感", "现代用语"]
  }
};
```

### 4.2 响应解析

```javascript
class AIResponseParser {
  parseNarrative(response) {
    return {
      text: extractNarrative(response),
      atmosphere: extractAtmosphere(response),
      keyImagery: extractImagery(response)
    };
  }
  
  parseChoices(response) {
    return response.choices.map((c, i) => ({
      id: i + 1,
      text: c.text,
      impliedAction: inferAction(c.text)
    }));
  }
}
```

---

## 5. 常量定义

```javascript
// config/gameConfig.js
const GAME_CONFIG = {
  // 网格
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  
  // 物理参数（待填充）
  GRAVITY_CONSTANT: 1.0,           // G
  PRESSURE_BASE_GROWTH: 0.5,       // P_history每回合增长
  OMEGA_GROWTH_RATE: 0.02,         // Ω指数增长率
  
  // 质量参数
  BASE_MASS_RANGE: { min: 1, max: 10 },
  STORY_MASS_PER_EVENT: 1,
  KNOT_MASS_PER_INTERACTION: 0.5,
  
  // 引力陷阱
  TRAP_INITIAL: 0,
  TRAP_BONUS_PER_DEEP_EVENT: 0.5,
  TRAP_DECAY_RATE: 0.1,            // 每回合衰减10%
  TRAP_MAX: 3.0,
  
  // 行为倾向权重（待填充）
  BEHAVIOR_WEIGHTS: {
    seizure: { greed: 0.4, fear: 0.2, valueItem: 0.3 },
    conflict: { hostility: 0.5, bloodlust: 0.3, aggression: 0.3 },
    // ...
  },
  
  // 锚点阈值
  ANCHOR_THRESHOLDS: {
    raid: { pressure: 50, aggression: 70 },
    divine: { cultistMass: 50, yangXiuqingF: 8 }
  }
};
```

---

## 6. 测试策略

### 6.1 单元测试
- GravityEngine: 引力计算正确性
- PressureSystem: 压强增长曲线
- MassSystem: 质量更新逻辑
- TurnManager: 回合流程完整性

### 6.2 集成测试
- 完整回合流程
- 事件触发机制
- NPC升格机制
- 死亡/逃离判定

### 6.3 完整测试用例
- 72回合完整故事线
- 不同身份通关路径
- 提前结束场景

---

*文档版本：v1.0*
*日期：2026-02-24*
