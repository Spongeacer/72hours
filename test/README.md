# AI 集成测试 README

## 测试文件

- `ai-integration.test.ts` - AI 集成测试主文件

## 测试覆盖范围

### 1. API 连接测试
- ✅ 验证 API 连接是否正常
- ✅ 获取可用模型列表
- ✅ 验证 MiniMax-M2.5 模型可用性
- ✅ 处理无效 API Key 的情况

### 2. MiniMax-M2.5 模型调用测试
- ✅ 基本文本生成
- ✅ 响应结构验证
- ✅ 中文内容处理
- ✅ 模型特定功能（系统提示词、多轮对话）

### 3. 叙事生成功能测试
- ✅ 叙事文本生成
- ✅ 第二人称叙事风格
- ✅ 玩家选择生成
- ✅ 玩家执念生成

### 4. 响应时间和错误处理测试
- ✅ 响应时间基准测试（<10秒）
- ✅ 长提示词处理
- ✅ 认证错误处理
- ✅ 空消息边界情况
- ✅ 特殊字符处理
- ✅ 并发请求处理

## 运行测试

### 方式 1: 从项目根目录运行
```bash
cd /root/.openclaw/workspace/72hours
npm run test:ai
```

### 方式 2: 运行所有测试
```bash
cd /root/.openclaw/workspace/72hours
npm test
```

### 方式 3: 使用 vitest 直接运行
```bash
cd /root/.openclaw/workspace/72hours
npx vitest run test/ai-integration.test.ts
```

## 环境变量

测试需要以下环境变量（已配置在 `.env` 文件中）：

```bash
SILICONFLOW_API_KEY=sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn
```

## 测试配置

- **超时时间**: 30秒/测试
- **期望响应时间**: <10秒
- **并发请求数**: 3个
- **性能测试迭代**: 3次

## 断言示例

```typescript
// API 连接测试
expect(result.success).toBe(true);
expect(result.duration).toBeLessThan(10000);
expect(result.data).toBeDefined();

// 模型响应测试
expect(result.data.choices[0].message.content).toBeTruthy();
expect(result.data.model).toContain('MiniMax');

// 错误处理测试
expect(result.success).toBe(false);
expect(result.error).toBeDefined();
```

## 故障排除

### 测试超时
- 检查网络连接
- 增加 `TIMEOUT_MS` 配置
- 检查 API 服务状态

### API Key 无效
- 验证 `SILICONFLOW_API_KEY` 环境变量
- 检查 API Key 是否过期

### 模型不可用
- 检查模型名称是否正确
- 验证账户是否有该模型访问权限

## 扩展测试

添加新测试用例：

```typescript
it('应该...', async () => {
  const result = await ai.someMethod();
  expect(result.success).toBe(true);
  // 添加更多断言...
}, TIMEOUT_MS);
```

## 测试输出示例

```
✓ test/ai-integration.test.ts (18 tests) 12500ms
  ✓ SiliconFlow AI 集成测试 > API 连接测试 > 应该成功连接到 SiliconFlow API
  ✓ SiliconFlow AI 集成测试 > API 连接测试 > 应该返回可用的模型列表
  ✓ SiliconFlow AI 集成测试 > API 连接测试 > 应该在 API Key 无效时返回错误
  ...

 Test Files  1 passed (1)
      Tests  18 passed (18)
```
