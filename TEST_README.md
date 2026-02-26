# 本地开发环境测试指南

## 快速开始

### 1. 确保依赖已安装

```bash
# 检查Node.js
node --version  # 需要v18+

# 检查Python3
python3 --version  # 需要v3.8+
```

### 2. 安装项目依赖

```bash
npm install
```

### 3. 运行完整测试

```bash
# 方式1: 使用测试脚本（推荐）
./test_local.sh

# 方式2: 手动运行
npm run build
node dist/src/server/index.js &
python3 test_local_runner.py
```

## 测试内容

测试脚本会：

1. **编译项目** - 确保TypeScript编译通过
2. **启动服务器** - 在localhost:3000启动
3. **创建游戏** - 随机生成角色
4. **运行回合** - 最多45回合，直到触发事件4
5. **生成报告** - 保存到testlog.md

## 预期结果

### 成功情况
```
🎉 测试通过！
- 成功触发事件4
- 报告保存到testlog.md
```

### 未完成情况
```
⚠️ 测试未完成
- 角色可能死亡（饥饿/伤势）
- 或未达到事件4阈值
```

## 调整参数

如需调整游戏节奏，修改 `src/config/GameConfig.ts`：

```typescript
// 提高Ω增长，加快事件触发
GAME_CONFIG.OMEGA_BASE_INCREASE = 0.4;  // 默认0.3

// 或降低事件4阈值
NPC_CONFIG.STORY_EVENT_THRESHOLDS.EVENT_4 = 12;  // 默认15
```

修改后重新编译：
```bash
npm run build
./test_local.sh
```

## 手动测试

```bash
# 启动服务器
node dist/src/server/index.js

# 另一个终端 - 创建游戏
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{}'

# 执行回合
curl -X POST http://localhost:3000/api/games/{gameId}/turns \
  -H "Content-Type: application/json" \
  -d '{"choice":{"id":"explore","text":"探索"}}'
```

## 故障排除

### 端口被占用
```bash
# 查找占用3000的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
```

### 编译错误
```bash
# 清理并重新编译
rm -rf dist
npm run build
```

### AI调用超时
- 检查网络连接
- 检查SiliconFlow API Key是否有效
- 或修改 `AI_CONFIG.DEFAULT_PROVIDER` 使用其他提供商

## 测试报告

测试完成后查看 `testlog.md`：

```bash
cat testlog.md
```

报告包含：
- 角色生成信息
- 完整回合记录
- 事件触发情况
- 问题分析和建议
