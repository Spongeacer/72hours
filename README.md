# 72Hours - 涌现式叙事游戏引擎

> **36回合，一场历史的涌现**
> 
> 1851年1月8日，金田村。你醒来，不知道历史已经开始。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎮 核心特性

### 涌现式叙事
不是预设剧情，而是故事自己长出来。每一个NPC都有自己的执念、记忆和行为逻辑，在物理引擎的驱动下自然交互，产生不可预测的叙事涌现。

### 引力模型物理引擎
基于 `F = G × M₁ × M₂ / r² × (1 + Ω × P)` 的引力公式，驱动NPC移动、互动和叙事焦点选择。质量(M)、压强(P)、全局因子(Ω)共同塑造游戏世界的物理法则。

### AI驱动的选择生成
使用AI API（SiliconFlow）基于玩家特质、执念和当前情境，生成个性化的反应选择。每个玩家的选择都是独特的，由AI实时涌现生成。

### 历史锚点系统
5个关键历史事件由Ω（历史必然感）驱动触发：
- 暗流涌动（开场）
- 官兵搜查（Ω≥6）
- 天父下凡（Ω≥12）
- 万寿祝寿（Ω≥16）
- 金田起义（Ω≥20 / 第36回合）

### 玩家作为催化剂
你不是故事的主角，而是催化剂——在场，影响，但故事自己流淌。你的存在改变周围的"场"，故事因你而变。

## 📚 文档索引

| 文档 | 内容 |
|------|------|
| **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** | **📖 完整开发文档（推荐）** |
| [TYPING_GUIDE.md](docs/TYPING_GUIDE.md) | 类型系统规范 |
| [DESIGN.md](docs/DESIGN.md) | 核心设计理念 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 详细技术架构 |

## 🚀 快速开始

### 环境要求
- Node.js >= 20.0.0
- npm >= 10.0.0
- SiliconFlow API Key (用于AI生成)

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Spongeacer/72hours.git
cd 72hours

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 API Key

# 编译TypeScript
npm run build

# 启动服务器
npm start

# 开发模式（热重载）
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### API 使用示例

```bash
# 创建游戏
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"identity": "scholar", "model": "Pro/MiniMaxAI/MiniMax-M2.5"}'

# 执行回合
curl -X POST http://localhost:3000/api/games/{gameId}/turns \
  -H "Content-Type: application/json" \
  -d '{}'

# 提交选择
curl -X POST http://localhost:3000/api/games/{gameId}/turns \
  -H "Content-Type: application/json" \
  -d '{"choice": {"id": "choice_1", "text": "你的选择..."}}'
```

## 📖 核心机制速查

### 引力系统
```
F = G × M₁ × M₂ / r² × (1 + Ω × P)
```

### 质量模型
```
M = B(基础) + S(叙事) + K(关系) + O(道具)
```

### 状态范围
| 系统 | 范围 | 说明 |
|------|------|------|
| 压强 | 1-20 | 环境紧张程度 |
| Ω | 1-20 | 历史必然感 |
| 玩家状态 | 1-20 | fear, aggression, hunger, injury |

## 🗺️ 路线图

### P0 - 核心框架 ✅
- [x] 引力引擎实现
- [x] 回合管理系统
- [x] 基础API接口
- [x] NPC/玩家系统
- [x] AI选择生成

### P1 - 涌现叙事 🚧
- [x] AI选择生成集成
- [ ] AI叙事生成集成
- [ ] 历史锚点系统完善
- [ ] 记忆系统实现
- [ ] 道具系统实现

### P2 - 内容扩展
- [ ] 完整36回合事件链
- [ ] 精英NPC解锁机制
- [ ] 多结局系统
- [ ] React前端

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT License

---

*"故事因你而变，但不是由你决定。"*
