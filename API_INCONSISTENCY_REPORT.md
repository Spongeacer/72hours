# API 文档 vs 实际实现 不一致问题报告

## 检查时间: 2026-02-26

---

## 1. 接口路径不一致

### 1.1 创建游戏
| 项目 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| **路径** | `POST /api/game/create` | `POST /api/games` | ❌ **不一致** |
| **方法** | POST | POST | ✅ 一致 |

**建议**: 统一为 `/api/games` (RESTful规范)

---

### 1.2 执行回合
| 项目 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| **路径** | `POST /api/game/:gameId/turn` | `POST /api/games/:gameId/turns` | ❌ **不一致** |
| **方法** | POST | POST | ✅ 一致 |

**建议**: 统一为 `/api/games/:gameId/turns` (复数形式符合RESTful)

---

### 1.3 获取游戏状态
| 项目 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| **路径** | `GET /api/game/:gameId/state` | `GET /api/games/:gameId/state` | ❌ **不一致** |
| **方法** | GET | GET | ✅ 一致 |

**建议**: 统一为 `/api/games/:gameId/state`

---

### 1.4 获取故事记录
| 项目 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| **路径** | `GET /api/game/:gameId/story` | `GET /api/games/:gameId/history` | ❌ **不一致** |
| **方法** | GET | GET | ✅ 一致 |

**建议**: 统一为 `/api/games/:gameId/history` (与数据字段名一致)

---

## 2. 请求参数不一致

### 2.1 创建游戏请求体

**API文档定义**:
```json
{
  "apiKey": "string",      // 可选
  "identity": "string",    // 可选，默认 scholar
  "model": "string"        // 可选，默认 MiniMax-M2.1
}
```

**实际实现** (`games.ts`):
```typescript
const createGameSchema = z.object({
  identity: z.enum(['scholar', 'landlord', 'soldier', 'cultist']),
  model: z.string().optional(),
  apiKey: z.string().optional()
});
```

| 字段 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| `identity` | 可选 | **必需** | ❌ **不一致** |
| `apiKey` | 可选 | 可选 | ✅ 一致 |
| `model` | 可选 | 可选 | ✅ 一致 |
| `identity` 默认值 | `scholar` | 无 | ⚠️ 需确认 |

**建议**: 统一为 identity 必需，避免默认值的歧义

---

### 2.2 执行回合请求体

**API文档定义**:
```json
{
  "choice": {
    "id": "string",
    "text": "string",
    "type": "string"
  }
}
```

**实际实现** (`games.ts`):
```typescript
const executeTurnSchema = z.object({
  choice: z.object({
    id: z.string(),
    text: z.string()
  }).optional()
});
```

| 字段 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| `choice.type` | 有 | **无** | ❌ **不一致** |
| `choice` | 可选 | 可选 | ✅ 一致 |

---

## 3. 响应数据结构不一致

### 3.1 创建游戏响应

**API文档定义**:
```json
{
  "player": {
    "id": "string",
    "name": "string",
    "identity": "string",
    "traits": ["string"],
    "states": { ... }
  },
  "bondedNPCs": [{
    "id": "string",
    "name": "string",
    "knot": "number"
  }]
}
```

**实际实现**:
```json
{
  "player": {
    "id": "string",
    "name": "你",
    "identityType": "scholar",     // ❌ 字段名不同
    "identity": { "name": "..." }, // ❌ 对象而非字符串
    "traits": [{ "id": "...", "type": "..." }], // ❌ 对象数组
    "states": { ... }
  },
  "bondedNPCs": [{
    "id": "string",
    "name": "string",
    // ❌ 缺少 "knot" 字段
    "isBonded": true  // 额外字段
  }]
}
```

| 字段 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| `player.identity` | string | object | ❌ **类型不一致** |
| `player.traits` | string[] | object[] | ❌ **类型不一致** |
| `bondedNPCs[].knot` | number | **无** | ❌ **缺失** |

---

### 3.2 执行回合响应

**API文档定义**:
```json
{
  "turn": "number",
  "narrative": "string",
  "choices": [...],
  "context": {       // ❌ 实际无此字段
    "scene": { ... },
    "spotlight": { ... }
  },
  "state": { ... },
  "gameOver": "boolean"
}
```

**实际实现**:
```json
{
  "turn": "number",
  "narrative": "string",
  "choices": [...],
  // ❌ 缺少 "context" 字段
  "state": { ... },
  "gameOver": "boolean",
  "result": "string"  // 额外字段
}
```

| 字段 | API文档 | 实际实现 | 状态 |
|-----|---------|---------|------|
| `context` | 有 | **无** | ❌ **缺失** |
| `result` | 无 | 有 | ⚠️ 额外字段 |

---

### 3.3 统一响应格式

**API文档定义**:
```json
{
  "success": "boolean",
  "data": "object | null",
  "error": {
    "code": "string",
    "message": "string"
  } | null
}
```

**实际实现**: ✅ **一致**

所有接口都使用了统一的响应格式，包含 `success`, `data`, `error`, `meta`

---

## 4. 默认值不一致

| 配置项 | API文档 | 实际实现 | 状态 |
|-------|---------|---------|------|
| **默认模型** | `Pro/MiniMaxAI/MiniMax-M2.1` | `Pro/MiniMaxAI/MiniMax-M2.5` | ❌ **不一致** |
| **默认身份** | `scholar` | 无（必需） | ⚠️ 需确认 |

**建议**: 统一为 `Pro/MiniMaxAI/MiniMax-M2.5`

---

## 5. 前端 API 服务对比

检查 `client/src/services/api.ts`:

| 接口 | 前端调用 | 实际后端 | 状态 |
|-----|---------|---------|------|
| 创建游戏 | `POST /api/games` | `POST /api/games` | ✅ 一致 |
| 执行回合 | `POST /api/games/:id/turns` | `POST /api/games/:id/turns` | ✅ 一致 |
| 获取状态 | `GET /api/games/:id/state` | `GET /api/games/:id/state` | ✅ 一致 |
| 获取历史 | `GET /api/games/:id/history` | `GET /api/games/:id/history` | ✅ 一致 |

**结论**: 前端与后端实现一致，但与 API.md 文档不一致

---

## 6. 修复建议

### 优先级 P0 (必须修复)
1. **更新 API.md 文档** - 将路径统一为实际实现:
   - `/api/game/create` → `/api/games`
   - `/api/game/:id/turn` → `/api/games/:id/turns`
   - `/api/game/:id/state` → `/api/games/:id/state`
   - `/api/game/:id/story` → `/api/games/:id/history`

2. **修正默认值** - 更新文档中的默认模型为 `MiniMax-M2.5`

### 优先级 P1 (建议修复)
3. **统一响应数据结构** - 补充或移除不一致的字段:
   - 补充 `bondedNPCs[].knot`
   - 决定是否返回 `context` 字段
   - 统一 `player.identity` 的格式

4. **补充缺失的字段验证** - 如 `choice.type`

---

## 7. 当前状态总结

| 类别 | 一致 | 不一致 | 总计 |
|-----|------|--------|------|
| 接口路径 | 0 | 4 | 4 |
| 请求参数 | 2 | 2 | 4 |
| 响应结构 | 1 | 3 | 4 |
| 默认值 | 0 | 2 | 2 |
| **总计** | **3** | **11** | **14** |

**结论**: 需要大规模更新 API.md 文档以匹配实际实现
