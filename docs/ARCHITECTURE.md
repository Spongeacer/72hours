# 72Hours 技术架构文档

> 涌现式叙事游戏引擎的技术架构

---

## 文档说明

本文档描述技术架构设计。

**详细实现请参考**: [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

---

## 1. 架构概览

### 1.1 设计理念

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

---

## 2. 核心模块

### 2.1 物理引擎层

#### GravityEngine

**位置**: `src/core/GravityEngine.ts`

**公式**: `F = G × M₁ × M₂ / r² × (1 + Ω × P)`

```typescript
class GravityEngine {
  config: GravityConfig = {
    G: 0.8,                       // 引力常数
    PRESSURE_MULTIPLIER: 0.05,    // 压强调制系数
    MIN_DISTANCE: 0.1,            // 最小距离
    MAX_FORCE: 10.0               // 最大引力限制
  };

  calculateForce(obj1: MassObject, obj2: MassObject): ForceVector
  calculateTotalForce(target: MassObject, others: MassObject[]): ForceVector
  calculateMovement(obj: MassObject, force: ForceVector, fear: number, knot: number): Position
}
```

### 2.2 游戏逻辑层

#### Game72Hours

**位置**: `src/game/Game72Hours.ts`

```typescript
class Game72Hours {
  gameState: GameState;
  narrativeEngine: EmergentNarrativeEngine;
  turnManager: TurnManager;

  async init(identityType: IdentityType): Promise<GameInitResult>
  async executeTurn(choice?: Choice): Promise<TurnResult>
}
```

#### TurnManager

**位置**: `src/game/TurnManager.ts`

**每回合流程**:
1. 更新物理场（压强、Ω）
2. 解锁NPC
3. 选择聚光灯NPC（基于引力）
4. 生成共振式叙事
5. 生成涌现式选择

**压强增长**:
- 每回合: +0.16
- 上限: 20

**Ω增长**:
- 基础: +0.4/回合
- 高压(≥12): ×1.02
- 蝴蝶效应: 30% +0, 30% +0.1, 40% +0.2

### 2.3 叙事层

#### EmergentNarrativeEngine

**位置**: `src/narrative/EmergentNarrativeEngine.ts`

**核心方法**:
- `generateNarrative()` - 生成共振式叙事
- `selectSpotlightNPC()` - 选择聚光灯NPC
- `collectEnvironmentalSignals()` - 收集环境信号

### 2.4 表现层

#### REST API

**基础路径**: `/api`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /games | 创建游戏 |
| GET | /games/:id/state | 获取状态 |
| POST | /games/:id/turns | 执行回合 |
| GET | /games/:id/history | 历史记录 |
| DELETE | /games/:id | 删除游戏 |

---

## 3. 目录结构

```
src/
├── config/                # 游戏配置
│   └── GameConfig.ts      # 核心配置
│
├── core/                  # 物理引擎
│   ├── GravityEngine.ts   # 引力计算
│   ├── AIReactionGenerator.ts
│   └── ReactionGenerator.ts
│
├── game/                  # 游戏逻辑
│   ├── index.ts           # 统一导出
│   ├── Agent.ts           # 智能体基类
│   ├── Game72Hours.ts     # 游戏主类
│   ├── NPC.ts             # NPC
│   ├── Player.ts          # 玩家
│   └── TurnManager.ts     # 回合管理
│
├── narrative/             # 叙事系统
│   ├── EmergentNarrativeEngine.ts
│   ├── BackgroundManager.ts
│   └── backgrounds/
│       └── TaipingBackground.ts
│
├── server/                # 服务器
│   ├── index.ts
│   ├── routes/            # API路由
│   ├── services/          # 服务层
│   ├── types/             # 后端类型
│   └── utils/             # 工具
│
└── utils/                 # 工具
    └── Constants.ts       # 常量

shared/types/              # 共享类型
├── index.ts
├── base.ts
├── player.ts
├── npc.ts
├── game.ts
└── save.ts
```

---

## 4. 类型系统

### 4.1 共享类型 (shared/types/)

前后端共用类型定义，按模块拆分：
- `base.ts` - 基础类型
- `player.ts` - 玩家相关
- `npc.ts` - NPC相关
- `game.ts` - 游戏状态
- `save.ts` - 存档相关

### 4.2 后端类型 (src/server/types/)

API相关类型：
- `api.ts` - ApiResponse, ErrorCode, 请求/响应类型

### 4.3 使用规范

```typescript
// ✅ 推荐
import type { Player, GameState } from '../game';
import type { ApiResponse } from '../types';

// ❌ 避免
import type { Player } from '../game/Player';
```

---

## 5. 参考文档

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - 完整开发文档
- [TYPING_GUIDE.md](./TYPING_GUIDE.md) - 类型系统规范
- [DESIGN.md](./DESIGN.md) - 设计理念

---

*文档版本: 2.0 (与实现同步)*
*最后更新: 2026-02-27*
