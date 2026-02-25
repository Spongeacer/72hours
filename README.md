# 72Hours - 叙事引擎

一个基于重力与压力系统的叙事游戏引擎。

## 游戏特色

- **72小时倒计时**：在有限时间内做出关键选择
- **重力系统**：每个选择都会影响故事走向
- **压力机制**：恐惧、攻击性、饥饿度影响角色行为
- **执念驱动**：每个角色都有独特的执念目标
- **羁绊系统**：与NPC建立复杂的关系网络

## ⚠️ 重要说明

这个游戏需要 **后端服务器** 支持。GitHub Pages 只能托管静态页面，无法运行游戏逻辑。

### 方案一：本地运行（推荐）

```bash
# 克隆项目
git clone https://github.com/Spongeacer/72hours.git
cd 72hours

# 安装依赖并启动
npm install
npm start

# 访问 http://localhost:3000
```

### 方案二：部署到 Vercel/Railway

项目支持一键部署到支持 Node.js 的平台。

## 技术栈

- 前端：原生 HTML/CSS/JavaScript
- 后端：Node.js
- AI：SiliconFlow API

## 项目结构

```
72Hours/
├── public/          # 前端文件
│   └── index.html   # 游戏主界面
├── src/             # 源代码
│   ├── core/        # 核心系统
│   ├── agents/      # 角色系统
│   ├── narrative/   # 叙事引擎
│   └── utils/       # 工具函数
├── server.js        # 后端服务器
└── package.json
```

## License

MIT
