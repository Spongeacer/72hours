# 72Hours 类型系统规范

> **TypeScript 类型定义完整参考**
> 
> 版本: 2.0.0 | 最后更新: 2025-02-28

---

## 📋 目录

1. [基础类型](#1-基础类型)
2. [玩家类型](#2-玩家类型)
3. [NPC类型](#3-npc类型)
4. [游戏状态类型](#4-游戏状态类型)
5. [叙事类型](#5-叙事类型)
6. [存档类型](#6-存档类型)
7. [API类型](#7-api类型)
8. [使用示例](#8-使用示例)

---

## 1. 基础类型

**文件**: `shared/types/base.ts`

### 1.1 身份类型

```typescript
/**
 * 玩家身份类型
 * - scholar: 读书人，知识渊博但体力较弱
 * - landlord: 地主，资源丰富但目标明显
 * - soldier: 士兵，战斗力强但道德负担
 * - cultist: 教徒，信仰坚定但受排斥
 */
export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist';
```

### 1.2 天气类型

```typescript
/**
 * 天气/环境类型
 * 影响叙事氛围和NPC行为
 */
export type WeatherType = 'clear' | 'rain' | 'fog' | 'night';
```

### 1.3 特质类型

```typescript
/**
 * 特质来源类型
 * - identity: 身份固有特质
 * - personality: 随机性格特质
 */
export type TraitType = 'identity' | 'personality';

/**
 * 特质定义
 */
export interface Trait {
  id: string;           // 特质标识符
  type: TraitType;      // 特质来源
  name?: string;        // 显示名称（可选）
  description?: string; // 描述（可选）
}
```

### 1.4 位置类型

```typescript
/**
 * 2D坐标位置
 * 用于物理引擎计算距离和引力
 */
export interface Position {
  x: number;
  y: number;
}
```

---

## 2. 玩家类型

**文件**: `shared/types/player.ts`

### 2.1 玩家状态

```typescript
/**
 * 玩家/NPC状态
 * 所有值范围为 1-20
 */
export interface PlayerStates {
  fear: number;        // 恐惧 (1-20)
  aggression: number;  // 攻击性 (1-20)
  hunger: number;      // 饥饿 (1-20)
  injury: number;      // 伤势 (1-20)
}
```

### 2.2 身份定义

```typescript
/**
 * 身份配置
 * 定义不同身份的基础属性
 */
export interface Identity {
  id: string;                    // 身份ID
  name: string;                  // 显示名称
  baseMass: number;              // 基础质量
  pressureModifier: number;      // 压强调制系数
  initialStates: PlayerStates;   // 初始状态
  suitableTraits?: string[];     // 适合特质列表
  // 旧版本兼容字段
  trait?: string;
  traits?: string[];
}
```

### 2.3 执念数据

```typescript
/**
 * 动态执念数据结构
 * 用于AI生成执念
 */
export interface ObsessionData {
  type: 'dynamic';
  identity: IdentityType;    // 身份类型
  identityName: string;      // 身份名称
  traits: string[];          // 相关特质
  traitsDesc: string;        // 特质描述
  prompt: string;            // AI生成提示词
}
```

### 2.4 物品

```typescript
/**
 * 物品/道具
 */
export interface Item {
  id: string;           // 物品ID
  name: string;         // 名称
  description: string;  // 描述
  tags: string[];       // 标签（用于条件判断）
}
```

### 2.5 记忆

```typescript
/**
 * 记忆类型
 */
export type MemoryType = 'betrayal' | 'gift' | 'rescue' | 'conflict';

/**
 * 记忆条目
 * 记录NPC间的重要事件
 */
export interface Memory {
  id: string;           // 记忆ID
  turn: number;         // 发生回合
  npcId: string;        // 相关NPC
  type: MemoryType;     // 记忆类型
  description: string;  // 描述
  intensity: number;    // 强度 (1-10)
}
```

### 2.6 玩家完整定义

```typescript
/**
 * 玩家接口
 * 完整的玩家数据结构
 */
export interface Player {
  id: string;                           // 唯一ID
  name: string;                         // 名称（通常为"你"）
  identityType: IdentityType;           // 身份类型
  identity: Identity;                   // 身份详情
  traits: Trait[];                      // 特质列表
  obsession: string | ObsessionData;    // 执念
  states: PlayerStates;                 // 当前状态
  position: Position;                   // 位置
  bondedNPCs: string[];                 // 关联NPC的ID列表
  inventory: Item[];                    // 物品栏
  memories: Memory[];                   // 记忆
}
```

---

## 3. NPC类型

**文件**: `shared/types/npc.ts`

### 3.1 NPC状态

```typescript
/**
 * NPC状态
 * 与PlayerStates结构相同
 */
export interface NPCStates {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}
```

### 3.2 NPC完整定义

```typescript
/**
 * NPC接口
 */
export interface NPC {
  id: string;                    // 唯一ID
  name: string;                  // 名称
  baseMass: number;              // 基础质量
  traits: Trait[];               // 特质列表
  obsession: string;             // 执念
  states: NPCStates;             // 当前状态
  position: Position;            // 位置
  
  // NPC类型标记
  isBonded: boolean;             // 是否关联NPC
  isElite: boolean;              // 是否精英NPC
  isUnlocked: boolean;           // 是否已解锁
  
  // 可选运行时属性
  isNPC?: boolean;               // 运行时标记
  initialKnot?: number;          // 初始K值
  unlockCondition?: {            // 解锁条件
    minTurn?: number;
    minPressure?: number;
  } | null;
  behaviors?: string[];          // 行为库
  ttl?: number | null;           // 存在时间（普通NPC）
}
```

---

## 4. 游戏状态类型

**文件**: `shared/types/game.ts`

### 4.1 游戏配置

```typescript
/**
 * 游戏配置
 */
export interface GameConfig {
  MAX_TURNS: number;    // 最大回合数（36）
  GRID_SIZE: number;    // 地图网格大小
  START_DATE: string;   // 开始日期（ISO格式）
}
```

### 4.2 游戏状态

```typescript
/**
 * 完整游戏状态
 * 包含游戏进行中的所有信息
 */
export interface GameState {
  turn: number;              // 当前回合
  datetime: string;          // 当前时间（ISO格式）
  pressure: number;          // 压强 (1-20)
  omega: number;             // Ω值 (1-20)
  weather: WeatherType;      // 天气
  player: Player;            // 玩家
  npcs: NPC[];               // NPC列表
  history: HistoryEntry[];   // 历史记录
  isGameOver: boolean;       // 是否结束
  config: GameConfig;        // 配置
}
```

### 4.3 历史记录

```typescript
/**
 * 历史记录条目
 * 记录每回合的关键信息
 */
export interface HistoryEntry {
  turn: number;              // 回合数
  narrative: string;         // 叙事文本
  choice?: Choice;           // 玩家选择（如果有）
  result?: string;           // 结果描述
}
```

### 4.4 选择

```typescript
/**
 * 玩家选择
 */
export interface Choice {
  id: string;                // 选择ID
  text: string;              // 显示文本
  type?: 'normal' | 'hidden'; // 类型
  isHidden?: boolean;        // 是否隐藏
  condition?: ChoiceCondition; // 条件
}

/**
 * 选择条件
 */
export interface ChoiceCondition {
  minKnot?: number;          // 最小K值
  maxFear?: number;          // 最大恐惧值
  hasTrait?: string;         // 需要特质
  hasItem?: string;          // 需要物品
}
```

### 4.5 场景

```typescript
/**
 * 场景描述
 */
export interface Scene {
  location: string;          // 地点
  description: string;       // 描述
  atmosphere: string;        // 氛围
}
```

### 4.6 游戏事件

```typescript
/**
 * 游戏事件
 * 历史锚点事件
 */
export interface GameEvent {
  type: string;              // 事件类型
  name: string;              // 名称
  description: string;       // 描述
}
```

### 4.7 回合上下文

```typescript
/**
 * 回合上下文
 * 用于生成叙事和选择
 */
export interface TurnContext {
  scene: Scene;              // 场景
  spotlight: NPC | null;     // 聚光灯NPC
  player: Player;            // 玩家
  event: GameEvent | null;   // 当前事件
  memories: Memory[];        // 相关记忆
}
```

### 4.8 回合结果

```typescript
/**
 * 回合执行结果
 */
export interface TurnResult {
  turn: number;              // 回合数
  narrative: string;         // 叙事文本
  choices: Choice[];         // 可选选择
  context: TurnContext;      // 回合上下文
  state: GameState;          // 游戏状态
  // 前端扩展字段
  spotlightNPC?: NPC | null;
  playerAura?: string;
}
```

### 4.9 选择结果

```typescript
/**
 * 选择执行结果
 */
export interface ChoiceResult {
  text: string;              // 结果文本
  stateChanges?: StateChanges; // 状态变化
  gameOver?: GameOverInfo;   // 游戏结束信息
}

/**
 * 状态变化
 */
export interface StateChanges {
  fear?: number;
  aggression?: number;
  hunger?: number;
  injury?: number;
  knot?: number;
}

/**
 * 游戏结束信息
 */
export interface GameOverInfo {
  type: 'death' | 'escape' | 'completed';
  reason: string;
}
```

### 4.10 游戏初始化结果

```typescript
/**
 * 游戏初始化返回
 */
export interface GameInitResult {
  gameId: string;            // 游戏ID
  player: Player;            // 玩家
  bondedNPCs: NPC[];         // 关联NPC
  opening: string;           // 开场白
  state: GameState;          // 初始状态
}
```

---

## 5. 叙事类型

**文件**: `src/narrative/EmergentNarrativeEngine.ts`

### 5.1 共鸣上下文

```typescript
/**
 * 共鸣上下文
 * 用于AI生成叙事
 */
export interface ResonanceContext {
  turn: number;
  datetime: string;
  weather: string;
  pressure: number;
  omega: number;
  player: {
    identity: string;
    traits: string[];
    obsession: string;
    states: PlayerStates;
    aura: string;
    position: Position;
  };
  spotlightNPC: SpotlightNPC | null;
  environmentalSignals: EnvironmentalSignal[];
  collectiveMood: string;
}
```

### 5.2 聚光灯NPC

```typescript
/**
 * 聚光灯NPC信息
 */
export interface SpotlightNPC {
  id: string;
  name: string;
  obsession: string;
  traits: string[];
  states: PlayerStates;
  memories: Memory[];
  knotWithPlayer: number;
  distance: number;
  force: number;
  behavior: string;
}
```

### 5.3 环境信号

```typescript
/**
 * 环境信号
 * 用于叙事生成
 */
export interface EnvironmentalSignal {
  type: 'visual' | 'auditory' | 'olfactory' | 'atmospheric';
  description: string;
  intensity: number;      // 0-100
  emotionalTone: string;
}
```

### 5.4 涌现选择

```typescript
/**
 * 涌现式选择
 */
export interface EmergentChoice {
  id: string;
  text: string;
  type: 'normal' | 'hidden' | 'resonance';
  resonanceLevel?: number;
  catalystType?: 'presence' | 'food' | 'fear' | 'silence' | 'violence';
}
```

---

## 6. 存档类型

**文件**: `shared/types/save.ts`

### 6.1 存档数据

```typescript
/**
 * 存档数据
 */
export interface SaveData {
  id: string;              // 存档ID
  gameId: string;          // 游戏ID
  name: string;            // 存档名称
  createdAt: string;       // 创建时间
  turn: number;            // 回合数
  state: GameState;        // 完整状态
}
```

### 6.2 存档摘要

```typescript
/**
 * 存档摘要（列表显示用）
 */
export interface SaveSummary {
  id: string;
  name: string;
  turn: number;
  createdAt: string;
  playerIdentity: string;
}
```

---

## 7. API类型

### 7.1 API响应

```typescript
/**
 * 标准API响应格式
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

/**
 * API错误
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * API元数据
 */
export interface ApiMeta {
  timestamp: string;
  requestId: string;
}
```

### 7.2 前端API类型

**文件**: `client/src/types/index.ts`

```typescript
/**
 * 前端使用的类型（与共享类型一致）
 */
export type {
  Player,
  NPC,
  GameState,
  TurnResult,
  Choice,
  SaveData
} from '../../../shared/types';

/**
 * 游戏配置（前端扩展）
 */
export interface GameConfig {
  maxTurns: number;
  identities: IdentityConfig[];
  aiProviders: AIProviderConfig[];
}

export interface IdentityConfig {
  id: string;
  name: string;
  description: string;
  traits: string[];
}

export interface AIProviderConfig {
  id: string;
  name: string;
  defaultModel: string;
}
```

---

## 8. 使用示例

### 8.1 导入类型

```typescript
// 方式1: 从共享包导入
import type { 
  Player, 
  NPC, 
  GameState, 
  TurnResult 
} from '../shared/types';

// 方式2: 按需导入
import type { Player } from '../shared/types/player';
import type { GameState } from '../shared/types/game';
```

### 8.2 创建玩家

```typescript
import type { Player, IdentityType } from '../shared/types';

const player: Player = {
  id: 'player_123',
  name: '你',
  identityType: 'scholar' as IdentityType,
  identity: {
    id: 'scholar',
    name: '村中的读书人',
    baseMass: 3,
    pressureModifier: 0.8,
    initialStates: { fear: 6, aggression: 4, hunger: 8, injury: 1 }
  },
  traits: [
    { id: 'calm', type: 'personality' },
    { id: 'curious', type: 'personality' }
  ],
  obsession: '在乱世中活下去',
  states: { fear: 6, aggression: 4, hunger: 8, injury: 1 },
  position: { x: 0, y: 0 },
  bondedNPCs: [],
  inventory: [],
  memories: []
};
```

### 8.3 创建NPC

```typescript
import type { NPC } from '../shared/types';

const npc: NPC = {
  id: 'npc_456',
  name: '村中长老',
  baseMass: 5,
  traits: [{ id: 'wise', type: 'personality' }],
  obsession: '保护村子平安',
  states: { fear: 5, aggression: 3, hunger: 5, injury: 1 },
  position: { x: 2, y: 3 },
  isBonded: false,
  isElite: false,
  isUnlocked: true
};
```

### 8.4 类型守卫

```typescript
// 检查是否为ObsessionData
function isObsessionData(obsession: string | ObsessionData): obsession is ObsessionData {
  return typeof obsession === 'object' && obsession.type === 'dynamic';
}

// 使用
if (isObsessionData(player.obsession)) {
  console.log(player.obsession.prompt);
} else {
  console.log(player.obsession); // string
}
```

### 8.5 类型断言

```typescript
// 当知道具体类型时使用
const npcClass = npc as unknown as NPCClass;
const playerClass = player as unknown as PlayerClass;

// 访问运行时属性
const totalMass = playerClass.getTotalMass();
```

---

## 附录: 类型关系图

```
┌─────────────────────────────────────────────────────────┐
│                      基础类型                            │
│  IdentityType ──┬── 'scholar'                           │
│                 ├── 'landlord'                          │
│                 ├── 'soldier'                           │
│                 └── 'cultist'                           │
│                                                         │
│  WeatherType ───┬── 'clear'                             │
│                 ├── 'rain'                              │
│                 ├── 'fog'                               │
│                 └── 'night'                             │
│                                                         │
│  Position ────── { x: number, y: number }               │
│  Trait ───────── { id, type, name?, description? }      │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    Player     │  │     NPC       │  │   GameState   │
├───────────────┤  ├───────────────┤  ├───────────────┤
│ id            │  │ id            │  │ turn          │
│ name          │  │ name          │  │ datetime      │
│ identityType  │  │ baseMass      │  │ pressure      │
│ identity      │  │ traits        │  │ omega         │
│ traits        │  │ obsession     │  │ weather       │
│ obsession     │  │ states        │  │ player        │
│ states        │  │ position      │  │ npcs          │
│ position      │  │ isBonded      │  │ history       │
│ bondedNPCs    │  │ isElite       │  │ isGameOver    │
│ inventory     │  │ isUnlocked    │  │ config        │
│ memories      │  │ ...           │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 相关文档

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - 完整开发文档
- [DESIGN.md](./DESIGN.md) - 设计理念与核心机制
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构说明

---

*"类型安全是涌现式叙事的基石。"*
