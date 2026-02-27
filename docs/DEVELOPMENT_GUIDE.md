# 72Hours 叙事引擎 - 开发文档

> 基于引力模型的涌现式历史叙事系统
> 核心机制：叙事对撞机 (Narrative Collider)
> 首个 Demo：太平天国金田起义（1851年1月8日-11日，72回合）

---

## 文档说明

本文档是 **最新的权威开发文档**，包含当前代码实现的详细规范。

**所有文档已同步更新**，你可以放心参考任何一份：
- [DESIGN.md](./DESIGN.md) - 设计理念（与本文档同步）
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构（与本文档同步）
- [TYPING_GUIDE.md](./TYPING_GUIDE.md) - 类型系统规范

**注意**: 所有文档的数值和结构都已统一，以本文档的实现细节为准。

---

## 目录

1. [项目概述](#项目概述)
2. [架构设计](#架构设计)
3. [目录结构](#目录结构)
4. [核心模块详解](#核心模块详解)
5. [类型系统规范](#类型系统规范)
6. [配置管理](#配置管理)
7. [API 接口规范](#api-接口规范)
8. [开发规范](#开发规范)

---

## 项目概述

### 核心理念

**玩家作为催化剂**
- 玩家不是故事的主角，而是催化剂——在场，影响，但故事自己流淌
- 无玩家时：故事默默进行，无人知晓
- 有玩家时：玩家的存在改变周围的"场"，故事因你而变

**涌现式叙事**
- 不是预设公式，而是故事自己长出来
- 输入：此刻的所有在场者 + 环境 + 信号 + 记忆
- 共鸣（不是计算，是共振）
- 故事自然流淌

### 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: React + TypeScript + Tailwind CSS
- **AI 接口**: SiliconFlow / Kimi API

---

## 架构设计

### 四层架构

```
┌─────────────────────────────────────────┐
│  表现层 (Presentation)                   │
│  - React 前端组件                        │
│  - 文本渲染、状态面板                     │
│  - 氛围可视化（雨、血、火光）              │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  叙事对撞机 (Narrative Collider)         │
│  - 聚光灯选择器（最大F NPC）              │
│  - 行为涌现器（从行为库自然选择）          │
│  - 叙事生成器（共振式文本生成）            │
│  - 逻辑冲突仲裁器（Hesitation）           │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  物理引擎 (Physics Engine)               │
│  - 引力计算：F = G×M₁×M₂/r²×P×Ω          │
│  - 质量系统：M = B + S + K + O            │
│  - 压强系统：P = P_history × P_traits    │
│  - 坐标系统：5×5网格、随机漂移、引力陷阱   │
│  - 信号系统：环境广播激活NPC行为           │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  数据层 (Data Layer)                     │
│  - Profile系统：标签、特质、执念           │
│  - 记忆系统：事件历史、关系图谱            │
│  - 行为模式库：抢夺/冲突/偷听/聊天/请求/给予 │
│  - 道具库：O值、标签、流转逻辑             │
│  - 叙事语料库：氛围词、意象、情感共振点     │
└─────────────────────────────────────────┘
```

---

## 目录结构

```
72hours/
├── client/                    # 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── services/          # API 客户端
│   │   ├── stores/            # 状态管理 (Zustand)
│   │   ├── types/             # 前端类型定义
│   │   └── App.tsx            # 应用入口
│   └── package.json
│
├── shared/                    # 前后端共享代码
│   └── types/                 # 共享类型定义
│       ├── index.ts           # 统一导出
│       ├── base.ts            # 基础类型
│       ├── player.ts          # 玩家类型
│       ├── npc.ts             # NPC类型
│       ├── game.ts            # 游戏状态
│       └── save.ts            # 存档类型
│
├── src/                       # 后端源码
│   ├── config/                # 配置文件
│   │   └── GameConfig.ts      # 游戏核心配置
│   │
│   ├── core/                  # 核心引擎
│   │   ├── AIReactionGenerator.ts    # AI反应生成
│   │   ├── GravityEngine.ts          # 引力引擎
│   │   └── ReactionGenerator.ts      # 反应生成器
│   │
│   ├── game/                  # 游戏逻辑
│   │   ├── index.ts           # 统一导出
│   │   ├── Agent.ts           # 智能体基类
│   │   ├── Game72Hours.ts     # 游戏主类
│   │   ├── NPC.ts             # NPC类
│   │   ├── Player.ts          # 玩家类
│   │   └── TurnManager.ts     # 回合管理
│   │
│   ├── narrative/             # 叙事系统
│   │   ├── BackgroundManager.ts      # 背景管理
│   │   ├── EmergentNarrativeEngine.ts # 涌现式叙事
│   │   ├── interfaces/        # 接口定义
│   │   └── backgrounds/       # 背景实现
│   │
│   ├── server/                # 服务器
│   │   ├── index.ts           # 服务入口
│   │   ├── constants/         # 常量定义
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由
│   │   ├── services/          # 服务层
│   │   ├── types/             # 后端类型
│   │   └── utils/             # 工具函数
│   │
│   └── utils/                 # 工具
│       └── Constants.ts       # 常量配置
│
├── docs/                      # 文档
│   ├── ARCHITECTURE.md        # 架构说明
│   ├── TYPING_GUIDE.md        # 类型规范
│   └── DESIGN.md              # 设计文档
│
├── shared/                    # 共享类型
├── package.json
└── tsconfig.json
```

---

## 核心模块详解

### 1. 物理引擎 (GravityEngine)

**位置**: `src/core/GravityEngine.ts`

**核心公式**: `F = G × M₁ × M₂ / r² × P × Ω`

| 参数 | 含义 | 默认值 | 范围 |
|------|------|--------|------|
| G | 引力常数 | 0.8 | - |
| M₁, M₂ | 双方质量 | - | 1-20 |
| r | 欧几里得距离 | - | ≥0.1 |
| P | 环境压强调制 | 1 + pressure × 0.05 | 1-2 |
| Ω | 全局因子调制 | - | 1-20 |

**质量模型**: `M = B + S + K + O`

| 分量 | 全称 | 说明 |
|------|------|------|
| B | Base（基础质量） | 角色预设 |
| S | Story（叙事权重） | 经历事件累积 |
| K | Knot（关系系数） | 交互次数 |
| O | Object（道具加成） | 持有道具 |

**使用示例**:

```typescript
import { GravityEngine } from '../core/GravityEngine';

const engine = new GravityEngine(pressure, omega);
const force = engine.calculateForce(playerMass, npcMass);
```

---

### 2. 游戏主类 (Game72Hours)

**位置**: `src/game/Game72Hours.ts`

**核心属性**:

| 属性 | 类型 | 说明 |
|------|------|------|
| config | GameConfig | 游戏配置 |
| gameState | GameState | 游戏状态 |
| narrativeEngine | EmergentNarrativeEngine | 叙事引擎 |
| turnManager | TurnManager | 回合管理器 |
| isRunning | boolean | 是否运行中 |
| isGameOver | boolean | 是否结束 |

**核心方法**:

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| initGame() | identityType: string | GameInitResult | 初始化游戏 |
| executeTurn() | choice?: Choice | TurnResult | 执行回合 |
| checkGameOver() | - | GameOverInfo \| null | 检查游戏结束 |

---

### 3. 玩家类 (Player)

**位置**: `src/game/Player.ts`

**继承**: `Agent`

**核心属性**:

| 属性 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| identityType | IdentityType | 身份类型 | 'scholar' \| 'landlord' \| 'soldier' \| 'cultist' |
| identity | Identity | 身份详情 | { name, baseMass, initialStates } |
| obsession | string \| ObsessionData | 执念 | "但求苟全于乱世" |
| traits | Trait[] | 特质列表 | [{ id: 'calm', type: 'personality' }] |
| states | PlayerStates | 状态 | { fear, aggression, hunger, injury } |
| bondedNPCs | NPC[] | 关联NPC | - |

**状态范围**: 1-20

| 状态 | 初始值 | 说明 |
|------|--------|------|
| fear | 6 | 恐惧 |
| aggression | 4 | 攻击性 |
| hunger | 8 | 饥饿 |
| injury | 1 | 伤势 |

---

### 4. NPC 类 (NPC)

**位置**: `src/game/NPC.ts`

**继承**: `Agent`

**核心属性**:

| 属性 | 类型 | 说明 |
|------|------|------|
| isNPC | boolean | 是否为NPC |
| isElite | boolean | 是否为精英 |
| isBonded | boolean | 是否关联玩家 |
| isUnlocked | boolean | 是否解锁 |
| unlockCondition | UnlockCondition \| null | 解锁条件 |
| behaviors | string[] | 行为库 |
| ttl | number \| null | 存在时间 |
| initialKnot | number | 初始K值 |

**解锁条件**:

| 条件 | 类型 | 说明 |
|------|------|------|
| minTurn | number | 最小回合数 |
| minPressure | number | 最小压强 |
| playerTrait | string | 玩家特质要求 |
| playerItem | string | 玩家道具要求 |
| requireNPC | string | 需要其他NPC解锁 |

---

### 5. 回合管理器 (TurnManager)

**位置**: `src/game/TurnManager.ts`

**核心流程**:

1. 更新物理场（压强、Ω）
2. 解锁NPC
3. 选择聚光灯NPC（基于引力）
4. 生成共振式叙事
5. 生成涌现式选择

**压强增长**:
- 每回合增长: 0.16
- 上限: 20

**Ω增长**:
- 基础增长: 0.4
- 高压加速: 当 pressure ≥ 12 时，Ω增长 ×1.02
- 蝴蝶效应: 30%概率+0，30%概率+0.1，40%概率+0.2
- 上限: 20

---

### 6. 叙事引擎 (EmergentNarrativeEngine)

**位置**: `src/narrative/EmergentNarrativeEngine.ts`

**核心方法**:

| 方法 | 说明 |
|------|------|
| generateNarrative() | 生成共振式叙事 |
| selectSpotlightNPC() | 选择聚光灯NPC |
| collectEnvironmentalSignals() | 收集环境信号 |
| calculateCollectiveMood() | 计算集体情绪 |

**环境信号类型**:

| 类型 | 说明 |
|------|------|
| visual | 视觉信号（雾、火光） |
| auditory | 听觉信号（雨声、喊杀） |
| olfactory | 嗅觉信号（烟味、血腥味） |
| atmospheric | 氛围信号（紧张、宿命） |

---

## 类型系统规范

### 目录规范

```
shared/types/          # 前后端共享类型
src/server/types/      # 后端专属类型
client/src/types/      # 前端专属类型
src/game/index.ts      # 游戏核心统一导出
```

### 使用规范

```typescript
// ✅ 推荐
import type { Player, GameState } from '../game';
import type { ApiResponse } from '../types';

// ❌ 避免
import type { Player } from '../game/Player';
import type { Player } from '../../shared/types/player';
```

### 类型扩展

```typescript
// 使用继承扩展
export interface FrontendTurnResult extends TurnResult {
  spotlightNPC?: NPC | null;
  playerAura?: string;
}
```

详见: [TYPING_GUIDE.md](./TYPING_GUIDE.md)

---

## 配置管理

### 游戏配置 (GameConfig)

**位置**: `src/config/GameConfig.ts`

| 配置项 | 值 | 说明 |
|--------|-----|------|
| MAX_TURNS | 36 | 总回合数 |
| HOURS_PER_TURN | 2 | 每回合小时数 |
| START_DATE | '1851-01-08T00:00:00' | 初始时间 |
| INITIAL_PRESSURE | 2 | 初始压强 (1-20) |
| INITIAL_OMEGA | 2 | 初始Ω (1-20) |
| PRESSURE_INCREASE | 0.16 | 压强每回合增长 |
| OMEGA_BASE_INCREASE | 0.4 | Ω基础增长 |
| HIGH_PRESSURE_THRESHOLD | 12 | 高压阈值 |
| MAX_PRESSURE | 20 | 压强上限 |
| MAX_OMEGA | 20 | Ω上限 |

### 身份配置

| 身份 | 名称 | 基础质量 | 初始状态 |
|------|------|----------|----------|
| scholar | 村中的读书人 | 3 | fear:6, aggression:4, hunger:8 |
| landlord | 金田村的地主 | 6 | fear:8, aggression:6, hunger:4 |
| soldier | 官府的士兵 | 5 | fear:4, aggression:12, hunger:10 |
| cultist | 教会的受众 | 4 | fear:10, aggression:8, hunger:6 |

### NPC 配置

| 配置项 | 值 |
|--------|-----|
| TOTAL_NPC_COUNT | 10 |
| INITIAL_UNLOCKED_COUNT | 4 |

**解锁阈值**:
- EVENT_2: Ω ≥ 5，解锁第5-8个NPC
- EVENT_3: Ω ≥ 10，解锁第9-10个NPC + 历史人物
- EVENT_4: Ω ≥ 15，最终阶段

---

## API 接口规范

### 基础响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

### 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/games | 创建游戏 |
| GET | /api/games/:id/state | 获取游戏状态 |
| POST | /api/games/:id/turns | 执行回合 |
| GET | /api/games/:id/history | 获取历史记录 |
| DELETE | /api/games/:id | 删除游戏 |
| GET | /api/config | 获取配置 |

### 创建游戏请求

```typescript
POST /api/games
{
  identity?: 'scholar' | 'landlord' | 'soldier' | 'cultist';
  model?: string;
  apiKey?: string;
}
```

### 执行回合请求

```typescript
POST /api/games/:id/turns
{
  choice?: {
    id: string;
    text: string;
  }
}
```

---

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 优先使用 `type` 定义类型
- 接口使用 `interface`，类型别名使用 `type`
- 导出类型使用 `export type`

### 命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| 类 | PascalCase | `Game72Hours`, `Player` |
| 接口 | PascalCase | `GameState`, `PlayerStates` |
| 类型别名 | PascalCase | `IdentityType`, `WeatherType` |
| 枚举 | PascalCase | `HttpStatus`, `ErrorCode` |
| 函数 | camelCase | `calculateForce`, `generateNarrative` |
| 常量 | UPPER_SNAKE_CASE | `MAX_TURNS`, `INITIAL_PRESSURE` |

### 文件组织

- 每个类/接口单独文件
- 相关类型放在同一目录
- 统一使用 `index.ts` 导出

### 注释规范

```typescript
/**
 * 计算引力
 * F = G × M₁ × M₂ / r² × P × Ω
 * 
 * @param obj1 - 物体1
 * @param obj2 - 物体2
 * @returns 引力向量
 */
```

---

## 附录

### 物理公式速查

**引力公式**:
```
F = G × M₁ × M₂ / r² × P × Ω
```

**质量模型**:
```
M = B + S + K + O
```

**压强系统**:
```
P = P_history × P_traits
```

### 状态范围

| 系统 | 范围 | 说明 |
|------|------|------|
| 压强 | 1-20 | 环境紧张程度 |
| Ω | 1-20 | 历史必然感 |
| 玩家状态 | 1-20 | fear, aggression, hunger, injury |
| K值 | -10 ~ 10 | 关系强度 |

---

*文档版本: 1.0*
*最后更新: 2026-02-27*
