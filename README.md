# 72Hours - 涌现式叙事游戏引擎

> **72小时，72回合，一场历史的涌现**
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

### 可拔插历史背景
核心引擎与历史背景解耦，支持快速切换不同历史场景。当前实现：太平天国金田起义（1851年）。

### 玩家作为催化剂
你不是故事的主角，而是催化剂——在场，影响，但故事自己流淌。你的存在改变周围的"场"，故事因你而变。

## 🏗️ 项目架构

```
72Hours/
├── src/
│   ├── core/              # 物理引擎核心
│   │   └── GravityEngine.ts      # 引力计算引擎
│   │
│   ├── game/              # 游戏逻辑层
│   │   ├── Game72Hours.ts        # 游戏主类
│   │   ├── TurnManager.ts        # 回合管理器
│   │   ├── Player.ts             # 玩家角色
│   │   ├── NPC.ts                # NPC角色
│   │   └── Agent.ts              # 角色基类
│   │
│   ├── narrative/         # 叙事系统
│   │   ├── NarrativeEngine.ts    # 叙事引擎
│   │   ├── EmergentNarrativeEngine.ts  # 涌现式叙事
│   │   ├── BackgroundManager.ts  # 背景管理器
│   │   └── backgrounds/          # 可拔插背景
│   │       └── TaipingBackground.ts    # 太平天国背景
│   │
│   ├── server/            # Express后端
│   │   ├── index.ts              # 服务器入口
│   │   ├── routes/               # API路由
│   │   └── middleware/           # 中间件
│   │
│   └── utils/             # 工具函数
│       └── Constants.ts          # 游戏常量
│
├── shared/                # 共享类型定义
├── client/                # React前端 (开发中)
├── docs/                  # 项目文档
└── tests/                 # 测试文件
```

## 🚀 快速开始

### 环境要求
- Node.js >= 20.0.0
- npm >= 10.0.0

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Spongeacer/72hours.git
cd 72hours

# 安装依赖
npm install

# 编译TypeScript
npm run build

# 启动服务器
npm start

# 开发模式（热重载）
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### API 测试

```bash
# 运行快速测试
node quick-api-test.js

# 运行完整游戏测试
node run-full-game.js
```

## 📖 核心机制

### 1. 引力系统
```
F = G × M₁ × M₂ / r² × (1 + Ω × P)
```
- **G**: 引力常数 (0.8)
- **M**: 质量 = B(基础) + S(叙事) + K(关系) + O(道具)
- **r**: 欧几里得距离
- **Ω**: 全局因子（历史必然性）
- **P**: 环境压强

### 2. 质量模型
| 分量 | 含义 | 获取方式 |
|------|------|----------|
| B | 基础质量 | 角色预设 |
| S | 叙事质量 | 经历事件累积 |
| K | 关系质量 | 交互次数 × 0.5 |
| O | 道具质量 | 持有关键道具 |

### 3. 涌现现象
- **引力捕获**: 高S/K路人被拉入核心圈
- **双星系统**: 两高M NPC互吸，玩家被甩出
- **质量坍缩**: NPC死亡→M变负→心理创伤
- **全局坍缩**: Ω指数增长，所有人撞向原点

### 4. 六类行为涌现
| 行为 | 驱动感觉 | 机制 |
|------|----------|------|
| 抢夺 | 贪婪/恐慌 | 社会交换理论 |
| 冲突 | 嗜血/仇恨 | 挫折-攻击假说 |
| 偷听 | 好奇/狡诈 | 信息缺口理论 |
| 聊天 | 孤独/共鸣 | 依恋理论 |
| 请求 | 绝望/信任 | 习得性无助 |
| 给予 | 慈悲/报恩 | 互惠规范 |

## 📚 文档索引

| 文档 | 内容 |
|------|------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 详细技术架构说明 |
| [DESIGN.md](DESIGN.md) | 核心设计理念 |
| [EMERGENT_MECHANICS.md](docs/EMERGENT_MECHANICS.md) | 涌现机制详解 |
| [IMPLEMENTATION_GAP.md](IMPLEMENTATION_GAP.md) | 实现差距分析 |
| [NPCS.md](NPCS.md) | NPC设计文档 |
| [TRAITS.md](TRAITS.md) | 特质系统文档 |
| [EVENTS.md](EVENTS.md) | 事件系统设计 |
| [PLAYERS.md](PLAYERS.md) | 玩家身份设计 |
| [API.md](API.md) | API接口文档 |

## 🛠️ 技术栈

- **后端**: Node.js, Express, TypeScript
- **物理引擎**: 自定义引力模型
- **AI接口**: SiliconFlow API (可选)
- **数据验证**: Zod
- **安全**: Helmet, express-rate-limit

## 🗺️ 路线图

### P0 - 核心框架 (进行中)
- [x] 引力引擎实现
- [x] 回合管理系统
- [x] 基础API接口
- [x] NPC/玩家系统

### P1 - 涌现叙事 (进行中)
- [ ] AI叙事生成集成
- [ ] 行为涌现系统完善
- [ ] 记忆系统实现
- [ ] 道具系统实现

### P2 - 内容扩展
- [ ] 完整72回合事件链
- [ ] 精英NPC解锁机制
- [ ] 多结局系统
- [ ] React前端

### P3 - 背景扩展
- [ ] 可拔插背景系统完善
- [ ] 新历史背景（待定）

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT License

---

*"故事因你而变，但不是由你决定。"*
