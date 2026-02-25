# 前后端接口一致性校验报告

## 校验时间
2025-02-25

---

## 一、接口一致性检查

### 1.1 创建游戏 - POST /api/game/create

| 检查项 | API 文档 | 后端实现 | 前端调用 | 状态 |
|--------|----------|----------|----------|------|
| 请求方法 | POST | POST ✅ | POST ✅ | ✅ 一致 |
| 请求路径 | /api/game/create | /api/game/create ✅ | /api/game/create ✅ | ✅ 一致 |
| 请求参数 apiKey | string, 可选 | 从 body 读取 ✅ | 从 input 获取 ✅ | ✅ 一致 |
| 请求参数 identity | string, 默认 scholar | 默认 scholar ✅ | 从 select 获取 ✅ | ✅ 一致 |
| 请求参数 model | string, 默认 MiniMax | 默认 MiniMax ✅ | 从 select 获取 ✅ | ✅ 一致 |
| 响应格式 | { success, data, error } | successResponse/errorResponse ✅ | 检查 data.success ✅ | ✅ 一致 |
| 响应字段 gameId | string | 返回 gameId ✅ | 保存到 GameState.gameId ✅ | ✅ 一致 |
| 响应字段 player | object | 返回 player ✅ | 未使用 ❓ | ⚠️ 未使用 |
| 响应字段 bondedNPCs | array | 返回 bondedNPCs ✅ | 未使用 ❓ | ⚠️ 未使用 |
| 响应字段 opening | string | 返回 opening ✅ | 显示在 narrative ✅ | ✅ 一致 |
| 响应字段 state | object | 返回 state ✅ | 未使用 ❓ | ⚠️ 未使用 |

**问题发现：**
- 前端没有使用 `player` 和 `bondedNPCs` 字段
- 建议：前端应该显示角色信息

---

### 1.2 执行回合 - POST /api/game/:gameId/turn

| 检查项 | API 文档 | 后端实现 | 前端调用 | 状态 |
|--------|----------|----------|----------|------|
| 请求方法 | POST | POST ✅ | POST ✅ | ✅ 一致 |
| 请求路径 | /api/game/:gameId/turn | /api/game/:gameId/turn ✅ | 使用 GameState.gameId ✅ | ✅ 一致 |
| 请求参数 choice | object, 可选 | 从 body 读取 ✅ | 传递 choice 对象 ✅ | ✅ 一致 |
| choice.id | string | 验证 id 存在 ✅ | 传递 choice.id ✅ | ✅ 一致 |
| choice.text | string | 不验证 ❌ | 传递 choice.text ✅ | ⚠️ 后端未验证 |
| 响应字段 turn | number | 返回 turn ✅ | 保存到 GameState.turn ✅ | ✅ 一致 |
| 响应字段 narrative | string | 返回 narrative ✅ | 显示在 narrative ✅ | ✅ 一致 |
| 响应字段 choices | array | 返回 choices ✅ | 传递给 generateChoices ✅ | ✅ 一致 |
| 响应字段 context | object | 返回 context ✅ | 保存到 GameState.currentContext ✅ | ✅ 一致 |
| 响应字段 state | object | 返回 state ✅ | 传递给 updateStatus ✅ | ✅ 一致 |
| 响应字段 gameOver | boolean | 返回 gameOver ✅ | 检查 gameOver ✅ | ✅ 一致 |

**问题发现：**
1. 后端验证 `choice.id` 但不验证 `choice.text`
2. 前端假设 `data.choices` 总是存在，但后端可能返回空数组

---

### 1.3 获取配置 - GET /api/config

| 检查项 | API 文档 | 后端实现 | 前端调用 | 状态 |
|--------|----------|----------|----------|------|
| 请求方法 | GET | GET ✅ | GET ✅ | ✅ 一致 |
| 请求路径 | /api/config | /api/config ✅ | /api/config ✅ | ✅ 一致 |
| 响应字段 hasApiKey | boolean | 返回 hasApiKey ✅ | 检查并显示/隐藏输入框 ✅ | ✅ 一致 |
| 响应字段 defaultModel | string | 返回 defaultModel ✅ | 未使用 ❓ | ⚠️ 未使用 |

**状态：** ✅ 一致

---

## 二、数据格式不一致问题

### 2.1 问题 1：前端未处理错误响应格式

**API 文档错误格式：**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "..."
  },
  "data": null
}
```

**前端处理方式：**
```javascript
// 前端只检查了 data.error，没有使用标准格式
if (data.error) {
  throw new Error(data.error);
}
```

**建议修复：**
```javascript
if (!data.success) {
  throw new Error(data.error?.message || '未知错误');
}
```

---

### 2.2 问题 2：choices 数组可能为空

**后端行为：**
- 如果 AI 生成失败，可能返回空 choices
- 后端有验证，但返回的是错误响应

**前端假设：**
```javascript
// 前端假设 choices 总是存在且非空
generateChoices(data.choices || []);
```

**建议修复：**
- 后端确保总是返回至少一个选择（默认选择）
- 前端处理空数组情况，显示"暂无选择"按钮

---

### 2.3 问题 3：state 字段类型不一致

**后端返回：**
```javascript
state: {
  turn: number,
  datetime: Date,
  pressure: number,
  omega: number
}
```

**前端使用：**
```javascript
document.getElementById('turnDisplay').textContent = `${state.turn || 0}/72`;
```

**潜在问题：**
- `datetime` 是 Date 对象，前端使用 `new Date(state.datetime)`
- 如果后端返回字符串，前端处理正确
- 但如果后端返回 Date 对象，JSON 序列化后会变成 ISO 字符串

**状态：** ✅ 一致（JSON 序列化自动处理）

---

### 2.4 问题 4：前端缺少字段验证

**前端代码：**
```javascript
// 直接访问 data.narrative，没有检查是否存在
document.getElementById('narrative').textContent = data.narrative;
```

**建议修复：**
```javascript
if (data.narrative) {
  document.getElementById('narrative').textContent = data.narrative;
} else {
  showError('叙事生成失败');
}
```

---

## 三、修复建议

### 3.1 前端修复

1. **统一错误处理**
```javascript
function handleResponse(data) {
  if (!data.success) {
    throw new Error(data.error?.message || '请求失败');
  }
  return data.data;
}
```

2. **添加字段验证**
```javascript
function validateTurnData(data) {
  if (!data.narrative) return { valid: false, error: '缺少 narrative' };
  if (!data.choices || data.choices.length === 0) {
    return { valid: false, error: '缺少 choices' };
  }
  return { valid: true };
}
```

3. **处理空 choices**
```javascript
if (!data.choices || data.choices.length === 0) {
  showError('没有可用的选择');
  addRetryButton();
  return;
}
```

### 3.2 后端修复

1. **确保总是返回 choices**
```javascript
if (!result.choices || result.choices.length === 0) {
  result.choices = [{
    id: 'default',
    text: '继续...',
    type: 'normal'
  }];
}
```

2. **验证 choice 完整性**
```javascript
if (choice) {
  if (!choice.id) return errorResponse('INVALID_CHOICE', '缺少 id');
  if (!choice.text) return errorResponse('INVALID_CHOICE', '缺少 text');
}
```

---

## 四、一致性评分

| 检查项 | 评分 |
|--------|------|
| 接口路径一致性 | 95% |
| 请求参数一致性 | 90% |
| 响应格式一致性 | 85% |
| 错误处理一致性 | 70% |
| 数据验证完整性 | 75% |

**总体评分：83%**

**主要扣分项：**
- 错误处理不一致（-15%）
- 数据验证不完整（-10%）
- 前端未使用所有字段（-5%）

---

## 五、修复优先级

### 🔴 P0 - 立即修复
1. 前端统一错误处理格式
2. 后端确保总是返回 choices

### 🟡 P1 - 尽快修复
3. 前端添加字段验证
4. 后端验证 choice 完整性

### 🟢 P2 - 可以优化
5. 前端使用 player 和 bondedNPCs 字段
6. 添加更多调试信息
