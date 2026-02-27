# 72Hours 部署指南

## 推荐平台：Railway（免费额度足够）

### 1. 注册 Railway
- 访问 https://railway.app
- 使用 GitHub 账号登录

### 2. 部署步骤

```bash
# 1. 确保代码已推送到 GitHub
git push origin main

# 2. 在 Railway  dashboard 中：
#    - 点击 "New Project"
#    - 选择 "Deploy from GitHub repo"
#    - 选择你的仓库

# 3. 添加环境变量
#    在 Railway 的 Variables 中添加：
#    - PORT=3000
#    - SILICONFLOW_API_KEY=你的API密钥

# 4. 部署完成
#    Railway 会自动检测 package.json 并部署
```

### 3. 前端部署（Vercel）

```bash
# 1. 进入前端目录
cd client

# 2. 构建前端
npm run build

# 3. 部署到 Vercel
vercel --prod

# 4. 设置环境变量
#    在 Vercel 中添加：
#    - VITE_API_URL=https://你的railway域名.up.railway.app/api
```

### 4. 其他可选平台

| 平台 | 优点 | 缺点 |
|------|------|------|
| **Railway** | 免费额度充足，部署简单 | 需要信用卡验证 |
| **Render** | 完全免费，无需信用卡 | 冷启动慢（30秒） |
| **Fly.io** | 性能好，有免费额度 | 配置稍复杂 |
| **Heroku** | 老牌平台，文档丰富 | 免费版已取消 |

---

## 当前项目结构

```
72hours/
├── src/                 # 后端源码
│   ├── server/         # Express 服务器
│   ├── game/           # 游戏逻辑
│   ├── narrative/      # 叙事引擎
│   └── config/         # 配置文件
├── shared/             # 前后端共享类型
├── client/             # 前端 React 应用
├── package.json        # 后端依赖
└── railway.json        # Railway 配置
```

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| PORT | 服务器端口 | 否（默认3000） |
| SILICONFLOW_API_KEY | AI API 密钥 | 是 |
| CORS_ORIGIN | 允许的前端域名 | 否 |

---

## 注意事项

1. **免费额度**：Railway 免费版每月有 $5 额度，足够个人使用
2. **冷启动**：长时间无访问会休眠，首次访问需要 5-10 秒唤醒
3. **数据持久化**：当前使用内存存储，重启后数据丢失
4. **数据库**：如需持久化，可添加 PostgreSQL（Railway 有免费额度）
