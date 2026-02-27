# 72Hours 技术架构文档

> 涌现式叙事游戏引擎的架构设计与实现细节

## 1. 架构概览

### 1.1 设计理念

72Hours 采用**分层架构**设计，核心原则：
- **物理驱动**: 叙事由物理引擎（引力/质量/压强）自然涌现
- **模块化**: 核心引擎与历史背景解耦，支持可拔插扩展
- **AI增强**: 离线模式可用，AI接入后叙事质量提升

### 1.2 四层架构

```
┌─────────────────────────────────────────┐
│  表现层 (Presentation)                   │
│  - React前端 / REST API                  │
│  - 文本渲染、状态面板                     │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  叙事层 (Narrative Layer)                │
│  - NarrativeEngine                       │
│  - EmergentNarrativeEngine               │
│  - BackgroundManager (可拔插背景)         │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  游戏逻辑层 (Game Logic)                 │
│  - Game72Hours (游戏主类)                │
│  - TurnManager (回合管理)                │
│  - Player / NPC / Agent (角色系统)       │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  物理引擎层 (Physics Engine)             │
│  - GravityEngine (引力计算)              │
│  - 质量系统 (M = B + S + K + O)          │
│  - 压强系统 (P) / 全局因子 (Ω)           │
└─────────────────────────────────────────┘
```

## 2. 核心模块详解

### 2.1 物理引擎层

#### GravityEngine

引力计算的核心，实现公式：`F = G × M₁ × M₂ / r² × (1 + Ω × P)`

```typescript
class GravityEngine {
  // 引力常数
  config: GravityConfig = {
    G: 0.8,                       // 引力常数
    PRESSURE_MULTIPLIER: 0.05,    // 压强调制系数
    MIN_DISTANCE: 0.1,            // 最小距离
    MAX_FORCE: 10.0               // 最大引力限制
  };

  // 计算两物体间引力
  calculateForce(obj1: MassObject, obj2: MassObject): ForceVector
  
  // 计算总引力（多物体）
  calculateTotalForce(target: MassObject, others: MassObject[]): ForceVector
  
  // 根据引力计算移动
  calculateMovement(obj: MassObject, force: ForceVector, fear: number, knot: number): Position
  
  // 更新物理状态（每回合调用）
  updatePhysics(turn: number, violenceEvents: number): void
}
```

**关键算法**:
```typescript
// 基础引力计算
const baseForce = G * m1 * m2 / (distance * distance);

// 压强调制（高压增强引力）
const pressureModifier = 1 + omega * PRESSURE_MULTIPLIER;

// 恐惧修正（高恐惧时远离）
if (fear > 70) {
  moveX = -moveX * 2;
  moveY = -moveY * 2;
}

// K值修正（高K值时跟随）
if (knot > 5) {
  moveX *= 1.5;
  moveY *= 1.5;
}
```

#### 质量系统

```
M = B (基础质量) + S (叙事质量) + K (关系质量) + O (道具质量)
```

| 分量 | 说明 | 计算方式 |
|------|------|----------|
| B | Base | 角色预设，范围 1-10 |
| S | Story | 经历事件 × 1，初始为0 |
| K | Knot | 交互次数 × 0.5，可为负（敌对） |
| O | Object | 道具加成，关键道具可瞬间暴增 |

#### 压强与全局因子

```typescript
// 压强增长
pressure += 0.8 + violenceEvents * 2;

// Ω 增长
if (pressure >= 60) {
  // 指数增长（历史必然性显现）
  omega = Math.min(5.0, omega * 1.05);
} else {
  // 线性增长
  omega += 0.02;
}
```

### 2.2 游戏逻辑层

#### Game72Hours

游戏主类，负责：
- 游戏初始化（玩家、NPC、精英角色）
- 执念生成（并发）
- 回合执行
- 结局生成

```typescript
class Game72Hours {
  gameState: GameState;           // 游戏状态
  narrativeEngine: EmergentNarrativeEngine;
  turnManager: TurnManager;

  async init(identityType: IdentityType): Promise<GameInitResult>
  async executeTurn(choice?: Choice): Promise<TurnResult>
  getState(): GameState
}
```

#### TurnManager

回合管理器，协调每回合的执行流程：

```
回合流程:
1. 更新世界状态 (turn++, Ω, P, weather)
2. 检查事件触发 (锚点事件/随机事件)
3. NPC移动 (引力驱动 + 恐惧修正 + K值修正 + 随机漂移)
4. 计算引力 + 选择聚光灯NPC
5. 生成叙事文本
6. 生成玩家选择
7. 等待玩家输入
8. 处理选择结果
9. 检查游戏结束
```

#### 角色系统

**Agent (基类)**:
```typescript
class Agent {
  id: string;
  name: string;
  position: Position;
  
  // 质量分量
  baseMass: number;           // B
  storyMass: number;          // S
  knotMass: Map<string, number>;  // K (与其他角色的关系)
  objectMass: number;         // O
  
  // 状态
  states: {
    fear: number;        // 0-100
    aggression: number;  // 0-100
    hunger: number;      // 0-100
    injury: number;      // 0-100
  };
  
  // 特质与执念
  traits: Trait[];
  obsession: string;
  memories: Memory[];
  
  getTotalMass(): number
  updateKnot(targetId: string, delta: number): void
}
```

**Player (玩家)**:
```typescript
class Player extends Agent {
  identityType: IdentityType;   // scholar | landlord | soldier | cultist
  identity: Identity;
  bondedNPCs: NPC[];            // 关联NPC（由身份决定）
  
  generateObsession(): ObsessionData
  checkDeath(): boolean
  checkEscape(): boolean
}
```

**NPC (非玩家角色)**:
```typescript
class NPC extends Agent {
  isElite: boolean;             // 是否为精英NPC
  isBonded: boolean;            // 是否与玩家关联
  isUnlocked: boolean;          // 是否已解锁
  unlockCondition: Condition;   // 解锁条件
  
  checkUnlock(gameState: GameState): boolean
  calculateBehaviorTendency(player: Player, env: Environment): Behavior
}
```

### 2.3 叙事层

#### NarrativeEngine

基础叙事引擎，支持离线和AI模式：

```typescript
class NarrativeEngine {
  ai: AIInterface | null;
  model: string;

  // 生成执念
  async generateObsession(data: ObsessionData): Promise<string>
  
  // 生成叙事
  async generateNarrative(gameState: GameState): Promise<string>
  
  // 生成选择
  async generateChoices(gameState: GameState): Promise<Choice[]>
  
  // 执行选择
  async executeChoice(choice: Choice, context: TurnContext, gameState: GameState): Promise<Result>
}
```

#### EmergentNarrativeEngine

涌现式叙事引擎（扩展），实现：
- 聚光灯选择（引力 + 随机扰动）
- 行为涌现（感觉场 strongest × 随机前3）
- 环境信号系统

#### BackgroundManager

可拔插背景管理器：

```typescript
interface IStoryBackground {
  id: string;
  name: string;
  description: string;
  
  // 历史事件
  getAnchors(): AnchorEvent[];
  
  // 场景描述
  getSceneDescription(context: SceneContext): string;
  
  // 精英NPC
  getEliteNPCs(): EliteNPCData[];
  
  // 开场白
  getOpening(identity: IdentityType, traits: string[]): string;
}

// 当前实现: TaipingBackground
class TaipingBackground implements IStoryBackground {
  // 太平天国金田起义背景
}
```

### 2.4 表现层

#### Express 后端

```typescript
// 服务器入口
app.use('/api/games', gameRoutes);
app.use('/api/saves', saveRoutes);
app.use('/api/config', configRoutes);

// 游戏路由
POST   /api/games/init          // 初始化游戏
POST   /api/games/:id/turn       // 执行回合
GET    /api/games/:id/state      // 获取状态
DELETE /api/games/:id            // 结束游戏
```

## 3. 数据流图

### 3.1 完整回合数据流

```
┌─────────────┐     POST /api/games/:id/turn     ┌─────────────┐
│   客户端     │ ───────────────────────────────→ │   服务器     │
│  (选择)      │                                  │  games.ts   │
└─────────────┘                                  └──────┬──────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  TurnManager    │
                                              │  executeTurn()  │
                                              └────────┬────────┘
                                                       │
           ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
           │                                           │                                           │
           ▼                                           ▼                                           ▼
  ┌─────────────────┐                        ┌─────────────────┐                        ┌─────────────────┐
  │  更新世界状态    │                        │   NPC移动       │                        │  计算引力        │
  │  - turn++       │                        │  - GravityEngine│                        │  - 聚光灯选择    │
  │  - Ω, P, weather│                        │  - fear修正     │                        │  - 随机扰动      │
  └─────────────────┘                        │  - knot修正     │                        └─────────────────┘
                                             └─────────────────┘                                  │
                                                                                                  ▼
                                                                                       ┌─────────────────┐
                                                                                       │ NarrativeEngine │
                                                                                       │  generateScene()│
                                                                                       └─────────────────┘
                                                                                                  │
           ┌──────────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────┐
  │   返回结果       │
  │  - narrative    │
  │  - choices      │
  │  - state        │
  └─────────────────┘
```

### 3.2 引力计算数据流

```
Player (M=5, pos={0,0})
       │
       │ calculateForce()
       ▼
┌─────────────────────────────────────┐
│         GravityEngine               │
│  F = G * M1 * M2 / r^2 * (1+Ω*P)   │
└─────────────────────────────────────┘
       │
       ├────────────────────────────────────┬──────────────────────────────┐
       ▼                                    ▼                              ▼
NPC1 (M=8)                           NPC2 (M=3)                       NPC3 (M=10)
F = 3.2                              F = 1.2                          F = 4.5 (聚光灯)
```

## 4. 关键算法

### 4.1 聚光灯选择算法

```typescript
function selectSpotlight(player: Player, npcs: NPC[]): NPC {
  const candidates = npcs.filter(n => n.isUnlocked);
  
  // 计算引力 + 随机扰动
  const scored = candidates.map(npc => {
    const force = gravityEngine.calculateForce(player, npc);
    const randomFactor = 0.8 + Math.random() * 0.4;  // 0.8 - 1.2
    return {
      npc,
      score: force.magnitude * randomFactor
    };
  });
  
  // 选择最高分
  return scored.sort((a, b) => b.score - a.score)[0]?.npc;
}
```

### 4.2 行为涌现算法

```typescript
function emergeBehavior(npc: NPC, player: Player, env: Environment): Behavior {
  // 构建感觉场
  const feelings = [
    { type: 'seizure', strength: npc.states.fear * 0.3 + npc.states.hunger * 0.4 },
    { type: 'conflict', strength: npc.states.aggression * 0.5 + env.pressure * 0.2 },
    { type: 'eavesdrop', strength: npc.traits.includes('curious') ? 0.6 : 0.2 },
    { type: 'conversation', strength: (10 - npc.getKnotWith(player.id)) * 0.1 },
    { type: 'request', strength: npc.states.fear > 70 ? 0.8 : 0.1 },
    { type: 'give', strength: npc.traits.includes('compassionate') ? 0.5 : 0.1 }
  ];
  
  // 排序 + 随机选择前3
  feelings.sort((a, b) => b.strength - a.strength);
  const top3 = feelings.slice(0, 3);
  
  // 随机选择（非确定性）
  return top3[Math.floor(Math.random() * top3.length)].type;
}
```

### 4.3 出现概率计算

```typescript
function calculateAppearanceProbability(npc: NPC, player: Player): number {
  const distance = calculateDistance(npc.position, player.position);
  const knot = player.getKnotWith(npc.id);
  
  const distanceFactor = Math.max(0, 1 - distance / 5);
  const knotFactor = (knot + 10) / 20;
  
  return distanceFactor * 0.6 + knotFactor * 0.4;
}
```

## 5. 配置系统

### 5.1 游戏常量

```typescript
// src/utils/Constants.ts
export const GAME_CONFIG = {
  // 网格
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  START_DATE: '1851-01-08T00:00:00+08:00',
  
  // 物理参数
  GRAVITY_CONSTANT: 0.8,
  PRESSURE_BASE_GROWTH: 0.8,
  OMEGA_GROWTH_RATE: 0.02,
  OMEGA_EXPONENTIAL_THRESHOLD: 60,
  
  // 质量参数
  BASE_MASS_RANGE: { min: 1, max: 10 },
  STORY_MASS_PER_EVENT: 1,
  KNOT_MASS_PER_INTERACTION: 0.5,
  
  // 特质配置
  TRAIT_CONFIG: {
    MIN_TRAITS: 2,
    MAX_TRAITS: 4
  }
};
```

### 5.2 身份配置

```typescript
export const IDENTITIES: Record<IdentityType, Identity> = {
  scholar: {
    name: '读书人',
    description: '寒窗十载，却逢乱世',
    trait: 'calm',
    traits: ['curious', 'cautious'],
    bondedNPCs: ['母亲', '教书先生']
  },
  landlord: {
    name: '地主',
    description: '田产千亩，却难安枕',
    trait: 'worldly',
    traits: ['cautious', 'arrogant'],
    bondedNPCs: ['老管家', '佃户老张']
  },
  soldier: {
    name: '士兵',
    description: '刀口舔血，身不由己',
    trait: 'brave',
    traits: ['aggressive', 'loyal'],
    bondedNPCs: ['父亲', '同袍小李']
  },
  cultist: {
    name: '教徒',
    description: '信仰上帝，等待天国',
    trait: 'zealous',
    traits: ['pious', 'fearful'],
    bondedNPCs: ['引路人王叔', '兄长']
  }
};
```

## 6. 扩展机制

### 6.1 添加新历史背景

```typescript
// 1. 实现 IStoryBackground 接口
class NewBackground implements IStoryBackground {
  id = 'new_background';
  name = '新背景';
  
  getAnchors(): AnchorEvent[] {
    return [
      { id: 'event1', turn: 24, condition: (state) => state.pressure > 50 }
    ];
  }
  
  getEliteNPCs(): EliteNPCData[] {
    return [{ id: 'npc1', name: '精英NPC', baseMass: 10 }];
  }
}

// 2. 注册到 BackgroundManager
backgroundManager.register(new NewBackground());
```

### 6.2 添加新行为

```typescript
// 在 BehaviorSelector 中添加
const behaviors: Behavior[] = [
  ...existingBehaviors,
  {
    id: 'new_behavior',
    calculateTendency: (npc, player, env) => {
      // 自定义倾向计算
      return npc.traits.includes('special') ? 0.8 : 0.1;
    }
  }
];
```

## 7. 测试策略

### 7.1 单元测试

```typescript
// GravityEngine 测试
describe('GravityEngine', () => {
  test('calculateForce should return correct magnitude', () => {
    const engine = new GravityEngine(10, 1.0);
    const f = engine.calculateForce(obj1, obj2);
    expect(f.magnitude).toBeGreaterThan(0);
  });
});
```

### 7.2 集成测试

```typescript
// 完整回合测试
async function testFullTurn() {
  const game = new Game72Hours();
  await game.init('scholar');
  
  for (let i = 0; i < 72; i++) {
    const result = await game.executeTurn();
    console.log(`Turn ${i + 1}:`, result.narrative);
  }
}
```

## 8. 性能考虑

### 8.1 优化点

- **并发执念生成**: 使用 `Promise.allSettled` 并行生成所有角色执念
- **引力计算缓存**: NPC位置不变时复用上回合计算结果
- **增量状态更新**: 只传输变化的状态字段

### 8.2 扩展性

- 支持水平扩展（无状态服务器）
- 游戏状态可序列化存储
- AI接口可切换（SiliconFlow / OpenAI / 本地模型）

---

*文档版本: v2.0*
*最后更新: 2026-02-26*
