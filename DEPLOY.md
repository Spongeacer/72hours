# 72Hours 阿里云 ECS 部署指南

## 服务器信息
- **IP**: 149.129.214.203
- **用户**: root
- **密码**: Abcd1234!
- **端口**: 80

## 手动部署步骤

### 1. 本地构建
```bash
cd /root/.openclaw/workspace/72hours
npm run build
```

### 2. 打包项目
```bash
tar -czf 72hours-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  .
```

### 3. 上传到阿里云 ECS
```bash
scp -P 22 72hours-deploy.tar.gz root@149.129.214.203:/opt/
```

### 4. 登录 ECS 并部署
```bash
ssh root@149.129.214.203

# 解压
cd /opt
mkdir -p 72hours
tar -xzf 72hours-deploy.tar.gz -C 72hours
cd 72hours

# 安装依赖
npm install --production

# 配置环境变量
cat > .env << 'EOF'
SILICONFLOW_API_KEY=sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn
DEFAULT_MODEL=Pro/MiniMaxAI/MiniMax-M2.1
PORT=80
NODE_ENV=production
EOF

# 确保端口是 80
sed -i 's/PORT=3000/PORT=80/' .env
```

### 5. 安装 PM2（推荐）
```bash
npm install -g pm2

# 启动服务
pm2 start dist/src/server/index.js --name 72hours

# 保存配置
pm2 save
pm2 startup
```

### 6. 或使用 nohup 启动
```bash
nohup node dist/src/server/index.js > server.log 2>&1 &
```

### 7. 配置防火墙
```bash
# 开放 80 端口
ufw allow 80/tcp
ufw reload

# 检查端口
netstat -tlnp | grep :80
```

### 8. 验证部署
```bash
# 健康检查
curl http://149.129.214.203/health

# 创建游戏测试
curl -X POST http://149.129.214.203/api/games \
  -H "Content-Type: application/json" \
  -d '{"identity": "scholar"}'
```

## 阿里云安全组配置

确保阿里云控制台的安全组规则允许 80 端口入站：
1. 登录阿里云控制台
2. 进入 ECS 实例管理
3. 点击"安全组"
4. 添加规则：
   - 协议类型: TCP
   - 端口范围: 80/80
   - 授权对象: 0.0.0.0/0

## 访问地址
- **游戏**: http://149.129.214.203/
- **健康检查**: http://149.129.214.203/health
- **API**: http://149.129.214.203/api

## 故障排查

### 端口被占用
```bash
# 查找占用 80 端口的进程
lsof -i :80

# 杀死进程
kill -9 <PID>
```

### 权限不足（80 端口需要 root）
```bash
# 使用 sudo 运行
sudo node dist/src/server/index.js
```

### 查看日志
```bash
# PM2 日志
pm2 logs 72hours

# nohup 日志
tail -f server.log
```

## 版本信息
- **当前版本**: v2.0.1
- **构建时间": 2026-02-28
- **Node.js**: >= 20.0.0
