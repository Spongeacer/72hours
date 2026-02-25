# 72Hours - 金田起义前夜

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Spongeacer/72hours)

## 部署到 Vercel

### 步骤 1: 点击部署按钮
点击上方的 "Deploy with Vercel" 按钮

### 步骤 2: 配置环境变量
在 Vercel 部署页面，添加以下环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `SILICONFLOW_API_KEY` | 你的 SiliconFlow API Key | ✅ 必需 |
| `DEFAULT_MODEL` | 默认使用的模型 | ❌ 可选 |

#### 获取 SiliconFlow API Key
1. 访问 [SiliconFlow](https://siliconflow.cn)
2. 注册/登录账号
3. 进入 API 密钥页面创建新密钥
4. 复制密钥（格式：sk-...）

#### 可选模型
- `Pro/MiniMaxAI/MiniMax-M2.1`（默认，速度快）
- `deepseek-ai/DeepSeek-V3.2`（质量好，较慢）

### 步骤 3: 完成部署
点击 "Deploy" 按钮，等待部署完成

### 步骤 4: 访问你的游戏
部署完成后，Vercel 会提供一个域名，例如：
```
https://72hours-xxx.vercel.app
```

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/Spongeacer/72hours.git
cd 72hours

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 SILICONFLOW_API_KEY

# 启动开发服务器
npm run dev
```

## 环境变量说明

### SILICONFLOW_API_KEY（必需）
你的 SiliconFlow API 密钥，用于调用 AI 模型生成叙事。

**注意：** 这个密钥只保存在服务器端，不会暴露给客户端。

### DEFAULT_MODEL（可选）
默认使用的 AI 模型，如果未设置则使用 `Pro/MiniMaxAI/MiniMax-M2.1`。

## 游戏玩法

1. 访问部署后的网站
2. 选择身份（读书人、地主、士兵、教徒）
3. 开始游戏，经历72回合的叙事
4. 每个回合做出选择，影响故事走向
5. 最终生成完整的故事记录

## 技术栈

- Node.js + Express
- SiliconFlow API
- 72Hours 叙事引擎

## 许可证

MIT
