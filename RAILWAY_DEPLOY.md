# Railway 部署配置

## 项目结构
```
72hours/
├── src/                 # 后端源码
├── shared/              # 共享类型
├── client/              # 前端（静态文件）
├── dist/                # 编译输出
├── package.json
├── tsconfig.json
├── Procfile             # Railway 启动命令
├── railway.json         # Railway 配置
└── .env.example         # 环境变量示例
```

## 部署步骤

### 1. 准备代码
确保代码已推送到 GitHub

### 2. 注册 Railway
- 访问 https://railway.app
- 使用 GitHub 账号登录

### 3. 创建项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 72hours 仓库
4. Railway 会自动检测并部署

### 4. 配置环境变量
在 Railway Dashboard 中设置：
- `NODE_ENV=production`
- `PORT=3000` (Railway 会自动分配)
- `CORS_ORIGIN=*` (或你的前端域名)
- `SILICONFLOW_API_KEY` (可选，用于AI功能)

### 5. 部署完成
Railway 会自动：
- 运行 `npm install`
- 运行 `npm run build`
- 运行 `npm start`
- 分配域名

## 访问地址
部署后会获得类似：
- `https://72hours-production.up.railway.app`

## 前端部署（可选）
前端可以：
1. 和后端一起部署（放在 public/ 目录）
2. 单独部署到 Vercel/Netlify
3. 使用 Railway 的静态站点功能

## 注意事项
1. Railway 免费额度：每月 5 美元或 500 小时运行时间
2. 长时间无访问会休眠（免费版）
3. 需要持久化存储请使用 Railway 的 Volume 功能
