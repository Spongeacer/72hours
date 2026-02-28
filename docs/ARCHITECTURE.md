# 72Hours 技术架构

> **涌现式叙事游戏的技术实现架构**
> 
> 版本: 2.0.0 | 最后更新: 2025-02-28

---

## 📐 架构概览

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端 (Client)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  React UI   │  │  Game Store │  │    AI Narrative Gen     │  │
│  │  Components │  │  (Zustand)  │  │    (Frontend Direct)    │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         └────────────────┼───────────────────────────────────────┘
│                          │ HTTP /api
├──────────────────────────┼───────────────────────────────────────┤
│                          ▼                                       │
│                      服务器 (Server)                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Express.js 应用                                         │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │   Routes    │  │ Middleware  │  │  Error Handler  │  │    │
│  │  │  (/api/*)   │  │(Validation) │  │                 │  │    │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────┘  │    │
│  │         │                                                │    │
│  │         ▼                                                │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              Service Layer                       │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │    │    │
│  │  │  │ GameService │  │PhysicsService│  │Narrative │ │    │    │
│  │  │  └─────────────┘  └─────────────┘  │Service   │ │    │    │
│  │  └────────────────────────────────────┴──────────┘ │    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Core Engine Layer                      │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │    │
│  │  │  GravityEngine  │  │  EmergentNarrativeEngine    │  │    │
│  │  │  (Physics)      │  │  (Social Psychology Model)  │  │    │
│  │  └─────────────────┘  └─────────────────────────────┘  │    │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │    │
│  │  │  AIReactionGen  │  │  TurnManager                │  │    │
│  │  │  (Choice Gen)   │  │  (Turn Coordination)        │  │    │
│  │  └─────────────────┘  └─────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Game Logic Layer                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │ Game72Hours │  │    Player   │  │      NPC        │  │    │
│  │  │   (Main)    │  │   (Agent)   │  │    (Agent)      │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              External Services                           │    │
│  │         SiliconFlow API / Kimi API                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 分层架构

### 1. 表示层 (Presentation Layer)

**位置**: `client/src/`

#### 1.1 组件结构

```
components/
├── UI/                    # 通用UI组件
│   ├── Loading.tsx
│   └── ErrorMessage.tsx
├── Setup/                 # 游戏设置
│   └── SetupPanel.tsx
└── Game/                  # 游戏界面
    ├── GamePanel.tsx      # 主游戏面板
    ├── NarrativePanel.tsx # 叙事显示
    ├── ChoicePanel.tsx    # 选择面板
    ├── StatusBar.tsx      # 状态栏
    └── SaveMenu.tsx       # 存档菜单
```

#### 1.2 状态管理

使用 Zustand 进行状态管理：

```typescript
// stores/gameStore.ts
interface GameState {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createGame: (identity: string) => Promise<void>;
  executeTurn: (choice?: Choice) => Promise<void>;
  setError: (error: string | null) => void;
}
```

#### 1.3 AI叙事生成（前端直连）

前端可以直接调用AI API，减轻服务器负担：

```typescript
// services/api.ts
async generateNarrative(
  prompt: string,
  provider: 'siliconflow' | 'kimi' = 'siliconflow'
): Promise<string> {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.8 })
  });
  return data.choices[0].message.content;
}
```

### 2. 应用层 (Application Layer)

**位置**: `src/server/`

#### 2.1 路由层 (Routes)

```typescript
// routes/games.ts
router.post('/', validateRequest({ body: createGameSchema }), async (req, res) => {
  const game = new Game72Hours({ id: gameId, model, apiKey });
  await game.init(identity);
  games.set(gameId, game);
  res.status(201).json(createSuccessResponse(formatGameResponse(game)));
});
```

#### 2.2 中间件 (Middleware)

| 中间件 | 功能 |
|--------|------|
| `validateRequest` | 请求参数校验 (Zod) |
| `errorHandler` | 全局错误处理 |
| `rateLimit` | 请求限流 |
| `helmet` | 安全头设置 |
| `cors` | 跨域处理 |

#### 2.3 服务层 (Services)

```typescript
// services/gameService.ts
export function executeTurn(game: Game): TurnResult {
  // 1. 更新物理场
  updatePhysics(state);
  
  // 2. 选择聚光灯NPC
  const spotlightNPC = selectSpotlightNPC(player, npcs, state);
  
  // 3. 生成叙事
  const narrative = generateResonanceNarrative(state, spotlightNPC, player);
  
  // 4. 生成选择
  const choices = generateEmergentChoices(player, spotlightNPC, state);
  
  return { narrative, choices, spotlightNPC, playerAura };
}
```

### 3. 领域层 (Domain Layer)

**位置**: `src/core/`, `src/game/`, `src/narrative/`

#### 3.1 核心引擎

| 引擎 | 职责 | 关键算法 |
|------|------|----------|
| `GravityEngine` | 物理引力计算 | `F = G*M1*M2/r²*(1+Ω*P)` |
| `EmergentNarrativeEngine` | 涌现式叙事生成 | 社会心理学行为模型 |
| `AIReactionGenerator` | AI选择生成 | Prompt工程 |
| `TurnManager` | 回合协调 | 状态机管理 |

#### 3.2 游戏实体

```
Agent (基类)
├── Player (玩家)
└── NPC (非玩家角色)
    ├── 普通NPC
    ├── 关联NPC (Bonded)
    └── 精英NPC (Elite)
```

#### 3.3 实体关系

```typescript
// 类关系
class Agent {
  id: string;
  name: string;
  baseMass: number;
  traits: Trait[];
  states: AgentStates;
  position: Position;
  knotMap: Map<string, number>;  // 关系网络
  memories: Memory[];
  inventory: Item[];
}

class Player extends Agent {
  identityType: IdentityType;
  identity: Identity;
  bondedNPCs: string[];
  obsession: string | ObsessionData;
}

class NPC extends Agent {
  isElite: boolean;
  isBonded: boolean;
  isUnlocked: boolean;
  unlockCondition: UnlockCondition;
  behaviors: string[];
  ttl: number | null;
}
```

### 4. 基础设施层 (Infrastructure Layer)

#### 4.1 外部服务

```typescript
// AI提供商配置
const AI_PROVIDERS = {
  siliconflow: {
    name: 'SiliconFlow',
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'Pro/MiniMaxAI/MiniMax-M2.5'
  },
  kimi: {
    name: 'Kimi',
    apiUrl: 'https://api.kimi.com/coding/v1/chat/completions',
    defaultModel: 'k2p5'
  }
};
```

#### 4.2 数据持久化

当前使用内存存储（Map），生产环境可扩展：

```typescript
// 内存存储
const games = new Map<string, Game>();

// 可扩展接口
interface GameRepository {
  save(game: Game): Promise<void>;
  findById(id: string): Promise<Game | null>;
  delete(id: string): Promise<void>;
}
```

---

## 🔌 API 架构

### RESTful API 设计

```
POST   /api/games              # 创建游戏
GET    /api/games/:id/state    # 获取状态
POST   /api/games/:id/turns    # 执行回合
GET    /api/games/:id/history  # 获取历史
DELETE /api/games/:id          # 删除游戏
GET    /api/config             # 获取配置
GET    /health                 # 健康检查
```

### 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 错误码

| 错误码 | 说明 | HTTP状态 |
|--------|------|----------|
| `GAME_NOT_FOUND` | 游戏不存在 | 404 |
| `GAME_INIT_FAILED` | 游戏初始化失败 | 500 |
| `TURN_EXECUTION_FAILED` | 回合执行失败 | 500 |
| `GAME_ALREADY_OVER` | 游戏已结束 | 400 |
| `RATE_LIMIT_EXCEEDED` | 请求过于频繁 | 429 |
| `VALIDATION_ERROR` | 参数校验失败 | 400 |

---

## 🔄 数据流

### 游戏创建流程

```
Client                    Server                    AI API
  │                         │                         │
  │ POST /api/games         │                         │
  │ {identity: "scholar"}   │                         │
  │────────────────────────>│                         │
  │                         │                         │
  │                         │ new Game72Hours()       │
  │                         │ game.init()             │
  │                         │────────────────────────>│
  │                         │ (生成NPC名字/执念)      │
  │                         │<────────────────────────│
  │                         │                         │
  │                         │ games.set(id, game)     │
  │<────────────────────────│                         │
  │ {gameId, player, ...}   │                         │
```

### 回合执行流程

```
Client                    Server                    AI API
  │                         │                         │
  │ POST /api/games/:id/turns                        │
  │────────────────────────>│                         │
  │                         │                         │
  │                         │ executeTurn()           │
  │                         │ ───────────────────────>│
  │                         │ 1. updatePhysics()      │
  │                         │ 2. selectSpotlightNPC() │
  │                         │ 3. generateNarrative()  │
  │                         │    (AI or Offline)      │
  │                         │<────────────────────────│
  │                         │ 4. generateChoices()    │
  │                         │                         │
  │<────────────────────────│                         │
  │ {narrative, choices}    │                         │
```

---

## 🛡️ 安全架构

### 安全措施

| 层级 | 措施 | 实现 |
|------|------|------|
| 传输 | HTTPS | 部署层配置 |
| 请求 | 限流 | express-rate-limit |
| 头部 | 安全头 | helmet |
| 输入 | 校验 | Zod Schema |
| CORS | 跨域控制 | cors中间件 |

### 限流配置

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,                   // 最多100请求
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: '请求过于频繁' }
    });
  }
});
```

---

## 📦 部署架构

### 单机部署

```
┌─────────────────────────────────┐
│           Server                │
│  ┌─────────────────────────┐   │
│  │    Node.js Process      │   │
│  │  ┌─────────────────┐    │   │
│  │  │  Express Server │    │   │
│  │  │  + Game Logic   │    │   │
│  │  └─────────────────┘    │   │
│  │         │               │   │
│  │         ▼               │   │
│  │  ┌─────────────────┐    │   │
│  │  │  In-Memory Store│    │   │
│  │  │  (games Map)    │    │   │
│  │  └─────────────────┘    │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Docker 部署

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

### 云部署 (Railway)

```yaml
# railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

---

## 🔧 扩展点

### 1. 添加新的AI提供商

```typescript
// src/config/GameConfig.ts
AI_PROVIDERS: {
  openai: {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4'
  }
}
```

### 2. 添加数据持久化

```typescript
// src/server/repositories/GameRepository.ts
export class RedisGameRepository implements GameRepository {
  async save(game: Game): Promise<void> {
    await redis.set(`game:${game.id}`, JSON.stringify(game));
  }
  
  async findById(id: string): Promise<Game | null> {
    const data = await redis.get(`game:${id}`);
    return data ? Game.deserialize(JSON.parse(data)) : null;
  }
}
```

### 3. 添加WebSocket实时通信

```typescript
// src/server/websocket.ts
io.on('connection', (socket) => {
  socket.on('join-game', (gameId) => {
    socket.join(gameId);
  });
  
  socket.on('execute-turn', async (data) => {
    const result = await game.executeTurn(data.choice);
    io.to(gameId).emit('turn-result', result);
  });
});
```

---

## 📊 性能考虑

### 优化策略

| 方面 | 策略 | 实现 |
|------|------|------|
| AI调用 | 超时回退 | 60秒超时 → 离线模式 |
| 内存 | 游戏清理 | 定期清理过期游戏 |
| 计算 | 缓存 | NPC质量缓存 |
| 网络 | 压缩 | gzip中间件 |

### AI调用优化

```typescript
// 使用spawn代替exec避免缓冲区限制
const curl = spawn('curl', [
  '-s', '-X', 'POST',
  apiUrl,
  '-H', `Authorization: Bearer ${apiKey}`,
  '-d', requestBody,
  '--max-time', '60',
  '--connect-timeout', '10'
]);

// 超时处理
const timeoutId = setTimeout(() => {
  curl.kill('SIGTERM');
  resolve(offlineResonance(context));  // 回退到离线模式
}, 65000);
```

---

## 📚 相关文档

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - 完整开发文档
- [DESIGN.md](./DESIGN.md) - 设计理念与核心机制
- [TYPING_GUIDE.md](./TYPING_GUIDE.md) - 类型系统规范

---

*"故事因你而变，但不是由你决定。"*
