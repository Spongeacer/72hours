# 72Hours API 文档

## 基础信息

- **Base URL**: `https://your-domain.vercel.app`
- **Content-Type**: `application/json`

## 错误响应格式

所有错误返回统一的格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息"
  },
  "data": null
}
```

## 接口列表

### 1. 创建游戏

创建一个新的游戏实例。

**Endpoint**: `POST /api/games`

**请求参数**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `identity` | string | **是** | 玩家身份 |
| `model` | string | 否 | AI 模型，默认 `Pro/MiniMaxAI/MiniMax-M2.5` |
| `apiKey` | string | 否 | SiliconFlow API Key（如果服务器未配置）|

**identity 可选值**:
- `scholar` - 村中的读书人
- `landlord` - 金田村的地主
- `soldier` - 官府的士兵
- `cultist` - 教会的受众

**成功响应**:

```json
{
  "success": true,
  "data": {
    "gameId": "game_1234567890_abc123",
    "player": {
      "id": "player_xxx",
      "name": "你",
      "identityType": "scholar",
      "identity": { "name": "村中的读书人", "baseMass": 3 },
      "traits": [{ "id": "calm", "type": "personality" }],
      "obsession": "在乱世中活下去",
      "states": { "fear": 30, "aggression": 20, "hunger": 40, "injury": 0 },
      "position": { "x": 0, "y": 0 }
    },
    "bondedNPCs": [
      {
        "id": "npc_xxx",
        "name": "母亲",
        "traits": [],
        "isBonded": true
      }
    ],
    "opening": "游戏开场叙事文本...",
    "state": {
      "turn": 0,
      "datetime": "1851-01-08T00:00:00.000Z",
      "pressure": 10,
      "omega": 1.0,
      "weather": "night"
    }
  },
  "error": null
}
```

**错误响应**:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_API_KEY",
    "message": "未配置 API Key"
  },
  "data": null
}
```

---

### 2. 执行回合

执行一个游戏回合（生成叙事或处理选择）。

**Endpoint**: `POST /api/games/:gameId/turns`

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `gameId` | string | 游戏ID |

**请求参数**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `choice` | object | 否 | 玩家选择（如果不传则生成新回合）|

**choice 结构**:

```json
{
  "id": "choice_1",
  "text": "你压低声音问：'先生究竟在怕什么？'"
}

**成功响应（生成新回合）**:

```json
{
  "success": true,
  "data": {
    "turn": 1,
    "narrative": "残羹冷炙堆在瓷盘里...",
    "choices": [
      {
        "id": "choice_1",
        "text": "你压低声音问：'先生究竟在怕什么？'",
        "type": "normal"
      }
    ],
    "state": {
      "turn": 1,
      "datetime": "1851-01-08T01:00:00.000Z",
      "pressure": 11,
      "omega": 1.02,
      "weather": "night"
    },
    "gameOver": false
  },
  "error": null
}
```

**成功响应（处理选择后）**:

```json
{
  "success": true,
  "data": {
    "result": "教书先生没有回答，但肩上的僵硬似乎松了一瞬...",
    "state": {
      "turn": 1,
      "datetime": "1851-01-08T01:00:00.000Z",
      "pressure": 11,
      "omega": 1.02
    },
    "gameOver": false
  },
  "error": null
}
```

**错误响应**:

```json
{
  "success": false,
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "游戏不存在或已过期"
  },
  "data": null
}
```

---

### 3. 获取游戏状态

获取当前游戏状态。

**Endpoint**: `GET /api/games/:gameId/state`

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `gameId` | string | 游戏ID |

**成功响应**:

```json
{
  "success": true,
  "data": {
    "state": {
      "turn": 10,
      "datetime": "1851-01-08T10:00:00.000Z",
      "pressure": 20,
      "omega": 1.20,
      "weather": "clear",
      "player": {
        "states": { "fear": 35, "aggression": 25, "hunger": 50 }
      }
    }
  },
  "error": null
}
```

---

### 4. 获取历史记录

获取完整的游戏历史记录。

**Endpoint**: `GET /api/games/:gameId/history`

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `gameId` | string | 游戏ID |

**成功响应**:

```json
{
  "success": true,
  "data": [
    {
      "turn": 1,
      "choice": "探索周围环境",
      "result": "你在村子里走了一圈...",
      "timestamp": "2026-02-26T10:30:00.000Z"
    }
  ],
  "error": null
}
```

---

## 数据结构定义

### Player（玩家）

```typescript
interface Player {
  id: string;
  name: string;
  identity: string;
  traits: string[];
  states: {
    fear: number;      // 恐惧 0-100
    aggression: number; // 戾气 0-100
    hunger: number;    // 饥饿 0-100
    injury: number;    // 伤势 0-100
  };
  inventory: Item[];
}
```

### NPC

```typescript
interface NPC {
  id: string;
  name: string;
  traits: string[];
  obsession: string;
  states: {
    fear: number;
    aggression: number;
  };
  knotWithPlayer: number;  // 羁绊 0-10
}
```

### Choice（选择）

```typescript
interface Choice {
  id: string;
  text: string;
  type: 'normal' | 'hidden';
  description?: string;  // 隐藏选择的说明
  effect?: string;       // 效果描述
}
```

### GameState（游戏状态）

```typescript
interface GameState {
  turn: number;          // 当前回合 0-72
  datetime: string;      // ISO 8601 格式
  pressure: number;      // 压强 0-100
  omega: number;         // 全局因子 1.0-5.0
  weather: 'clear' | 'rain' | 'fog' | 'night';
  gameOver: boolean;
}
```

---

## 错误码列表

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `MISSING_API_KEY` | 未提供 API Key | 400 |
| `INVALID_IDENTITY` | 无效的身份类型 | 400 |
| `INVALID_MODEL` | 无效的模型名称 | 400 |
| `GAME_NOT_FOUND` | 游戏不存在或已过期 | 404 |
| `GAME_ALREADY_OVER` | 游戏已结束 | 400 |
| `INVALID_CHOICE` | 无效的选择 | 400 |
| `AI_GENERATION_FAILED` | AI 生成失败 | 500 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

---

## 前端集成指南

### 基本流程

```javascript
// 1. 创建游戏
const { gameId, opening } = await createGame(apiKey, identity);

// 2. 开始第一回合
const { narrative, choices } = await executeTurn(gameId);

// 3. 显示叙事和选择
displayNarrative(narrative);
displayChoices(choices);

// 4. 玩家选择后
const { result } = await executeTurn(gameId, selectedChoice);
displayResult(result);

// 5. 进入下一回合
const { narrative: nextNarrative, choices: nextChoices } = await executeTurn(gameId);
```

### 状态管理建议

```javascript
const GameState = {
  // 不可变状态
  gameId: null,
  
  // 可变状态
  currentTurn: 0,
  isProcessing: false,
  
  // 方法
  async executeTurn(choice = null) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      const result = await api.executeTurn(this.gameId, choice);
      this.currentTurn = result.turn;
      return result;
    } finally {
      this.isProcessing = false;
    }
  }
};
```

---

## 更新日志

### v1.0.0 (2025-02-25)
- 初始版本
- 支持创建游戏、执行回合、获取状态
- 支持 4 种身份和 2 种 AI 模型
