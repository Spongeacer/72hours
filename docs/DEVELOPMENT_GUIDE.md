# 72Hours 开发指南

> **涌现式叙事游戏的完整实现文档**
> 
> 版本: 2.0.0 | 最后更新: 2025-02-28

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [快速开始](#2-快速开始)
3. [核心系统详解](#3-核心系统详解)
4. [API 参考](#4-api-参考)
5. [开发工作流](#5-开发工作流)
6. [调试与测试](#6-调试与测试)
7. [部署指南](#7-部署指南)

---

## 1. 项目概述

### 1.1 项目结构

```
72hours/
├── src/
│   ├── server/          # 服务器端代码
│   │   ├── index.ts     # 服务器入口
│   │   ├── routes/      # API路由
│   │   ├── services/    # 业务逻辑服务
│   │   ├── middleware/  # 中间件
│   │   └── utils/       # 工具函数
│   ├── core/            # 核心引擎
│   │   ├── GravityEngine.ts        # 引力物理引擎
│   │   └── AIReactionGenerator.ts  # AI选择生成器
│   ├── game/            # 游戏逻辑
│   │   ├── Game72Hours.ts  # 游戏主类
│   │   ├── Player.ts       # 玩家类
│   │   ├── NPC.ts          # NPC类
│   │   ├── Agent.ts        # Agent基类
│   │   └── TurnManager.ts  # 回合管理器
│   ├── narrative/       # 叙事系统
│   │   ├── EmergentNarrativeEngine.ts  # 涌现式叙事引擎
│   │   └── backgrounds/                  # 背景设定
│   └── config/          # 配置文件
│       └── GameConfig.ts
├── shared/              # 共享类型
│   └── types/           # TypeScript类型定义
├── client/              # 前端代码 (React + TypeScript)
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── stores/      # 状态管理
│   │   └── services/    # API服务
│   └── package.json
├── docs/                # 文档
└── package.json
```

### 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js 20+, TypeScript 5.3, Express 4 |
| 前端 | React 18, TypeScript, Tailwind CSS |
| AI | SiliconFlow API (MiniMax-M2.5) |
| 工具 | ESLint, Vitest, pkg |

---

## 2. 快速开始

### 2.1 环境要求

- Node.js >= 20.0.0
- npm >= 10.0.0
- SiliconFlow API Key

### 2.2 安装与运行

```bash
# 克隆项目
git clone https://github.com/Spongeacer/72hours.git
cd 72hours

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加 SILICONFLOW_API_KEY

# 编译 TypeScript
npm run build

# 启动服务器
npm start

# 开发模式（热重载）
npm run dev
```

### 2.3 环境变量

```bash
# .env
SILICONFLOW_API_KEY=your_api_key_here
PORT=3000
CORS_ORIGIN=*
```

---

## 3. 核心系统详解

### 3.1 引力物理引擎 (GravityEngine)

**文件**: `src/core/GravityEngine.ts`

引力引擎是游戏的核心物理系统，驱动NPC移动、互动和叙事焦点选择。

#### 核心公式

```
F = G × M₁ × M₂ / r² × (1 + Ω × P)
```

| 符号 | 含义 | 默认值 |
|------|------|--------|
| G | 引力常数 | 0.8 |
| M₁, M₂ | 有效质量 | 动态计算 |
| r | 距离 | 实时计算 |
| Ω | 历史必然感 | 1-20 |
| P | 压强调制系数 | 0.05 |

#### 质量模型

```typescript
M_total = B(基础) + S(叙事) + K(关系) + O(道具)

// 有效质量（考虑陷阱）
M_effective = M_total × (1 + trapConstant)
```

#### 使用示例

```typescript
import { GravityEngine } from './core/GravityEngine';

// 创建引擎实例
const engine = new GravityEngine(pressure = 5, omega = 3);

// 计算两个物体间的引力
const force = engine.calculateForce(playerMass, npcMass);
// 返回: { fx, fy, magnitude, distance }

// 计算移动向量
const newPosition = engine.calculateMovement(npc, force, fear, knot);
```

#### 关键配置

```typescript
// src/config/GameConfig.ts
export const GRAVITY_CONFIG = {
  G: 0.8,                          // 引力常数
  PRESSURE_MULTIPLIER: 0.05,       // 压强调制系数
  MIN_DISTANCE: 0.1,               // 最小距离（防止除以0）
  MAX_FORCE: 10.0,                 // 最大引力限制
  FEAR_ESCAPE_THRESHOLD: 14,       // 恐惧逃离阈值（1-20）
  KNOT_FOLLOW_THRESHOLD: 10        // K值跟随阈值（1-20）
};
```

### 3.2 涌现式叙事引擎 (EmergentNarrativeEngine)

**文件**: `src/narrative/EmergentNarrativeEngine.ts`

叙事引擎基于社会心理学理论，生成涌现式叙事文本。

#### 核心流程

```
1. 选择聚光灯NPC（基于引力 + 20%随机扰动）
2. 收集环境信号（天气、压强、Ω）
3. 计算集体情绪
4. 构建共鸣上下文
5. AI生成共振文本（失败时回退到离线模式）
```

#### 社会心理学行为模型

| 行为 | 触发条件 | 理论基础 |
|------|----------|----------|
| seizure(抢夺) | 贪婪 + 恐惧 > 8 | 社会交换理论 |
| give(给予) | 慈悲 + K值 > 6 | 互惠规范 |
| eavesdrop(偷听) | 好奇 + 安全 | 信息缺口理论 |
| protect(保护) | 勇敢 + 高压 | 社会认同理论 |
| anomie(失范) | 恐惧 > 14 + 饥饿 > 12 | Durkheim失范理论 |

#### 使用示例

```typescript
import { EmergentNarrativeEngine } from './narrative/EmergentNarrativeEngine';

// 创建引擎
const engine = new EmergentNarrativeEngine(ai, model);

// 生成叙事
const narrative = await engine.generateEmergentNarrative(gameState);
```

### 3.3 游戏主类 (Game72Hours)

**文件**: `src/game/Game72Hours.ts`

游戏主类管理整个游戏生命周期。

#### 初始化流程

```typescript
const game = new Game72Hours({
  id: 'game_xxx',
  model: 'Pro/MiniMaxAI/MiniMax-M2.5',
  apiKey: process.env.SILICONFLOW_API_KEY
});

// 初始化游戏
const result = await game.init('scholar'); // 身份类型
// 返回: { gameId, player, bondedNPCs, opening, state }
```

#### 回合执行

```typescript
// 生成新回合
const turnResult = await game.executeTurn();

// 或处理玩家选择
const turnResult = await game.executeTurn({
  id: 'choice_1',
  text: '你的选择...'
});
```

### 3.4 回合管理器 (TurnManager)

**文件**: `src/game/TurnManager.ts`

回合管理器协调物理引擎和叙事生成。

#### 回合流程

```typescript
async executeTurn(): Promise<TurnResult> {
  // 1. 增加回合数
  gameState.turn++;
  
  // 2. 更新时间和天气
  this.updateTime();
  this.updateWeather();
  
  // 3. 更新物理引擎
  this.gravityEngine.updatePhysics(gameState.turn);
  
  // 4. 解锁NPC
  this.unlockNPCs();
  
  // 5. 使用引力引擎移动NPC
  this.moveNPCsWithGravity();
  
  // 6. 生成涌现式叙事
  const narrative = await this.narrativeEngine.generateEmergentNarrative(gameState);
  
  // 7. 生成选择
  const choices = await this.generateChoicesWithPhysics();
  
  return { turn, narrative, choices, context, state };
}
```

### 3.5 AI选择生成器 (AIReactionGenerator)

**文件**: `src/core/AIReactionGenerator.ts`

基于AI API生成个性化的玩家反应选项。

#### 生成逻辑

```typescript
// 基于玩家特质、执念和情境生成3个反应
const reactions = await generatePlayerReactionsWithAI(
  player,      // 玩家对象
  npcBehavior, // NPC行为
  context      // 当前情境
);

// 返回3个反应：
// 1. 基于执念（最深层驱动）
// 2. 基于主导特质（性格驱动）
// 3. 基于本能/情境（状态驱动）
```

#### Prompt构建

```typescript
const prompt = `
【情境】
第${turn}/36回合，${weather}
压强：${pressure}/20，历史必然感：${omega}/20

【玩家】
身份：${player.identity.name}
执念：${player.obsession}
特质：${traits}
当前状态：恐惧${fear}/攻击${aggression}/饥饿${hunger}

【聚光灯NPC】
姓名：${npcName}
行为：${behavior}
执念：${npcObsession}

【任务】
基于玩家的执念、特质和当前状态，生成3个玩家可能的反应。
`;
```

---

## 4. API 参考

### 4.1 REST API

#### 创建游戏

```http
POST /api/games
Content-Type: application/json

{
  "identity": "scholar",  // scholar | landlord | soldier | cultist
  "model": "Pro/MiniMaxAI/MiniMax-M2.5",
  "apiKey": "optional"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "gameId": "game_xxx",
    "player": { ... },
    "bondedNPCs": [ ... ],
    "opening": "...",
    "state": { ... }
  },
  "error": null,
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

#### 执行回合

```http
POST /api/games/{gameId}/turns
Content-Type: application/json

{
  "choice": {
    "id": "choice_1",
    "text": "你的选择..."
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "turn": 1,
    "narrative": "...",
    "choices": [ ... ],
    "spotlightNPC": { ... },
    "playerAura": "...",
    "state": { ... }
  }
}
```

#### 获取游戏状态

```http
GET /api/games/{gameId}/state
```

#### 获取历史记录

```http
GET /api/games/{gameId}/history
```

#### 删除游戏

```http
DELETE /api/games/{gameId}
```

### 4.2 前端 API 服务

```typescript
import { api } from './services/api';

// 创建游戏
const { data } = await api.createGame('scholar', 'Pro/MiniMaxAI/MiniMax-M2.5');

// 执行回合
const { data } = await api.executeTurn(gameId);

// 提交选择
const { data } = await api.executeTurn(gameId, { id: 'choice_1', text: '...' });

// 直接调用AI生成叙事
const narrative = await api.generateNarrative(prompt, 'siliconflow', apiKey);
```

---

## 5. 开发工作流

### 5.1 添加新身份类型

1. **更新类型定义** (`shared/types/base.ts`):
```typescript
export type IdentityType = 'scholar' | 'landlord' | 'soldier' | 'cultist' | 'merchant';
```

2. **添加配置** (`src/config/GameConfig.ts`):
```typescript
export const PLAYER_CONFIG = {
  IDENTITIES: {
    merchant: {
      name: '行商',
      baseMass: 4,
      pressureModifier: 0.9,
      initialStates: { fear: 6, aggression: 4, hunger: 6, injury: 1 },
      suitableTraits: ['worldly', 'greedy', 'curious', 'shrewd']
    }
  }
};
```

3. **添加开场白** (`src/server/constants/openings.ts`):
```typescript
export const OPENINGS: Record<string, string> = {
  merchant: `> 货物还在马背上，但你闻到了火药味...`
};
```

### 5.2 添加新特质

```typescript
// src/config/GameConfig.ts
export const GAME_CONFIG = {
  PERSONALITY_TRAITS: {
    // 现有特质...
    adventurous: { name: '冒险', description: '喜欢探索未知' },
    cautious: { name: '谨慎', description: '行事小心' }
  }
};
```

### 5.3 添加新NPC模板

```typescript
// src/config/GameConfig.ts
export const NPC_CONFIG = {
  NPC_TEMPLATES: [
    // 现有模板...
    {
      id: 'wandering_poet',
      role: '流浪诗人',
      description: '据说他的诗能预言未来',
      baseMass: 3,
      suitableTraits: ['mysterious', 'eloquent', 'intuitive', 'enigmatic']
    }
  ]
};
```

### 5.4 修改物理参数

```typescript
// src/config/GameConfig.ts
export const GRAVITY_CONFIG = {
  G: 1.0,                          // 增大引力
  PRESSURE_MULTIPLIER: 0.08,       // 增强压强效果
  FEAR_ESCAPE_THRESHOLD: 12        // 降低恐惧阈值
};
```

---

## 6. 调试与测试

### 6.1 日志级别

```typescript
// 开发模式启用详细日志
console.log('[Gravity] 引力计算:', force);
console.log('[BehaviorEmerge] 行为涌现:', behavior, theory);
console.log('[AI] 生成响应:', content);
```

### 6.2 常用调试命令

```bash
# 运行类型检查
npm run type-check

# 运行 ESLint
npm run lint

# 自动修复
npm run lint:fix

# 运行测试
npm test
```

### 6.3 API 测试示例

```bash
# 创建游戏
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"identity": "scholar"}'

# 执行回合
curl -X POST http://localhost:3000/api/games/{gameId}/turns \
  -H "Content-Type: application/json" \
  -d '{}'

# 提交选择
curl -X POST http://localhost:3000/api/games/{gameId}/turns \
  -H "Content-Type: application/json" \
  -d '{"choice": {"id": "explore", "text": "探索周围环境"}}'
```

---

## 7. 部署指南

### 7.1 构建生产版本

```bash
# 编译 TypeScript
npm run build

# 打包可执行文件（可选）
npm run package:all
```

### 7.2 Docker 部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY public ./public
EXPOSE 3000
CMD ["node", "dist/src/server/index.js"]
```

### 7.3 Railway 部署

项目已配置 `railway.json` 和 `Procfile`，可直接部署到 Railway。

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并部署
railway login
railway link
railway up
```

### 7.4 环境变量配置

| 变量 | 说明 | 必需 |
|------|------|------|
| `SILICONFLOW_API_KEY` | SiliconFlow API密钥 | 是 |
| `PORT` | 服务器端口 | 否 (默认3000) |
| `CORS_ORIGIN` | CORS来源 | 否 |
| `NODE_ENV` | 环境模式 | 否 |

---

## 附录

### A. 状态范围参考

| 系统 | 范围 | 说明 |
|------|------|------|
| 压强 (Pressure) | 1-20 | 环境紧张程度 |
| Ω (Omega) | 1-20 | 历史必然感 |
| 恐惧 (Fear) | 1-20 | 玩家/NPC恐惧值 |
| 攻击性 (Aggression) | 1-20 | 暴力倾向 |
| 饥饿 (Hunger) | 1-20 | 生理需求 |
| 伤势 (Injury) | 1-20 | 身体伤害 |
| K值 (Knot) | -10~10 | 关系强度 |

### B. 历史锚点事件

| 事件 | Ω阈值 | 回合 |
|------|-------|------|
| 暗流涌动 | 开场 | 0 |
| 官兵搜查 | ≥6 | ~15 |
| 天父下凡 | ≥12 | ~30 |
| 万寿祝寿 | ≥16 | ~40 |
| 金田起义 | ≥20 | 36 |

### C. 相关文档

- [DESIGN.md](./DESIGN.md) - 设计理念与核心机制
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构说明
- [TYPING_GUIDE.md](./TYPING_GUIDE.md) - 类型系统规范

---

*"故事因你而变，但不是由你决定。"*
