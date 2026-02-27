# 72Hours API 文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`

## 统一响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-27T12:00:00.000Z",
    "requestId": "1234567890-abc123"
  }
}
```

### 错误响应
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息"
  },
  "meta": {
    "timestamp": "2026-02-27T12:00:00.000Z",
    "requestId": "1234567890-abc123"
  }
}
```

---

## 接口列表

### 1. 创建游戏

创建一个新的游戏实例。

**Endpoint**: `POST /api/games`

**请求参数**:

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `identity` | string | 否 | 玩家身份，默认随机 |
| `model` | string | 否 | AI 模型，默认 `Pro/MiniMaxAI/MiniMax-M2.5` |
| `apiKey` | string | 否 | SiliconFlow API Key（可选）|

**identity 可选值**:
- `scholar` - 村中的读书人
- `landlord` - 金田村的地主
- `soldier` - 官府的士兵
- `cultist` - 教会的受众

**成功响应** (201 Created):

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
      "states": { "fear": 6, "aggression": 4, "hunger": 8, "injury": 1 },
      "position": { "x": 0, "y": 0 }
    },
    "bondedNPCs": [
      {
        "id": "npc_xxx",
        "name": "母亲",
        "traits": [],
        "isBonded": true,
        "isUnlocked": true
      }
    ],
    "opening": "> 你被一阵奇怪的声音惊醒...",
    "state": {
      "turn": 0,
      "datetime": "1851-01-08T00:00:00.000Z",
      "pressure": 2,
      "omega": 2,
      "weather": "night",
      "isGameOver": false
    }
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

---

### 2. 获取游戏状态

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
    "turn": 10,
    "datetime": "1851-01-08T20:00:00.000Z",
    "pressure": 3.6,
    "omega": 5.8,
    "weather": "night",
    "isGameOver": false
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

**错误响应** (404):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "游戏不存在或已结束"
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

---

### 3. 执行回合

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
```

**成功响应 - 生成新回合**:

```json
{
  "success": true,
  "data": {
    "turn": 1,
    "narrative": "夜色更深了。你感到一种莫名的恐惧在蔓延...",
    "choices": [
      {
        "id": "choice_1",
        "text": "你压低声音问：'先生究竟在怕什么？'",
        "type": "obsession"
      },
      {
        "id": "choice_2",
        "text": "你冷静地观察四周...",
        "type": "trait"
      },
      {
        "id": "choice_3",
        "text": "你本能地后退一步...",
        "type": "instinct"
      }
    ],
    "state": {
      "turn": 1,
      "datetime": "1851-01-08T02:00:00.000Z",
      "pressure": 2.16,
      "omega": 2.4,
      "weather": "night",
      "isGameOver": false
    }
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

**成功响应 - 处理选择后**:

```json
{
  "success": true,
  "data": {
    "turn": 1,
    "result": "教书先生没有回答，但肩上的僵硬似乎松了一瞬...",
    "state": {
      "turn": 1,
      "datetime": "1851-01-08T02:00:00.000Z",
      "pressure": 2.16,
      "omega": 2.4,
      "weather": "night",
      "isGameOver": false
    }
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "游戏不存在或已结束"
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

或

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "GAME_ALREADY_OVER",
    "message": "游戏已结束"
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

---

## 数据结构定义

### Player（玩家）

```typescript
interface Player {
  id: string;
  name: string;
  identityType: string;      // scholar | landlord | soldier | cultist
  identity: {
    name: string;            // 身份名称
    baseMass: number;        // 基础质量
    initialStates: {         // 初始状态
      fear: number;          // 0-20
      aggression: number;    // 0-20
      hunger: number;        // 0-20
      injury: number;        // 0-20
    };
  };
  traits: Array<{
    id: string;              // 特质ID
    type: string;            // personality | identity
  }>;
  obsession: string;         // 玩家执念
  states: {
    fear: number;            // 恐惧 0-20
    aggression: number;      // 攻击性 0-20
    hunger: number;          // 饥饿 0-20
    injury: number;          // 伤势 0-20
  };
  position: { x: number; y: number };
}
```

### NPC

```typescript
interface NPC {
  id: string;
  name: string;
  traits: string[];
  isBonded: boolean;         // 是否与玩家有关联
  isUnlocked: boolean;       // 是否已解锁
  unlockStage: number;       // 解锁阶段 1|2|3
}
```

### Choice（选择）

```typescript
interface Choice {
  id: string;
  text: string;              // 选择文本
  type: 'obsession' | 'trait' | 'instinct';  // 驱动类型
}
```

### GameState（游戏状态）

```typescript
interface GameState {
  turn: number;              // 当前回合 0-36
  datetime: string;          // ISO 8601 格式
  pressure: number;          // 压强 1-20
  omega: number;             // 全局因子 1-20
  weather: 'clear' | 'rain' | 'fog' | 'night';
  isGameOver: boolean;
}
```

---

## 错误码列表

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `GAME_INIT_FAILED` | 创建游戏失败 | 500 |
| `GAME_NOT_FOUND` | 游戏不存在或已过期 | 404 |
| `GAME_ALREADY_OVER` | 游戏已结束 | 400 |
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `AI_GENERATION_FAILED` | AI 生成失败 | 500 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

---

## 前端集成指南

### 基本流程

```javascript
// 1. 创建游戏
const response = await fetch('/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: 'scholar' })
});
const { data: { gameId, opening } } = await response.json();

// 2. 开始第一回合（不传choice）
const turnResponse = await fetch(`/api/games/${gameId}/turns`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const { data: { narrative, choices } } = await turnResponse.json();

// 3. 显示叙事和选择
displayNarrative(narrative);
displayChoices(choices);

// 4. 玩家选择后提交
const resultResponse = await fetch(`/api/games/${gameId}/turns`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ choice: selectedChoice })
});
const { data: { result } } = await resultResponse.json();
displayResult(result);

// 5. 进入下一回合（不传choice）
const nextTurnResponse = await fetch(`/api/games/${gameId}/turns`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
```

### 状态值范围

所有状态值（fear, aggression, hunger, injury, pressure, omega）范围都是 **1-20**。

### 游戏结束条件

- `isGameOver: true` 时游戏结束
- 可能原因：死亡（hunger/injury达到20）、逃离、或完成36回合

---

## 更新日志

### v2.0.0 (2026-02-27)
- 重构为36回合制
- 更新Ω增长机制（初始2，每回合+0.4）
- 集成AI选择生成
- 统一响应格式

### v1.0.0 (2025-02-25)
- 初始版本
- 支持创建游戏、执行回合、获取状态
- 支持 4 种身份
