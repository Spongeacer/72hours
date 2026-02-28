#!/bin/bash
# deploy-to-aliyun.sh
# 部署 72Hours 到阿里云 ECS

set -e

echo "🚀 开始部署 72Hours 到阿里云 ECS..."

# 配置
ECS_IP="149.129.214.203"
ECS_USER="root"
ECS_PASSWORD="Abcd1234!"
PROJECT_DIR="/opt/72hours"

# 本地构建
echo "📦 本地构建..."
npm run build

# 创建部署包
echo "📦 创建部署包..."
tar -czf /tmp/72hours-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  -C /root/.openclaw/workspace \
  72hours

# 使用 sshpass 上传到 ECS（需要安装 sshpass）
echo "📤 上传到阿里云 ECS..."
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass 未安装，尝试安装..."
    apt-get update && apt-get install -y sshpass
fi

# 创建远程目录
sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=no \
    "$ECS_USER@$ECS_IP" "mkdir -p $PROJECT_DIR"

# 上传文件
sshpass -p "$ECS_PASSWORD" scp -o StrictHostKeyChecking=no \
    /tmp/72hours-deploy.tar.gz \
    "$ECS_USER@$ECS_IP:$PROJECT_DIR/"

# 远程部署
sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=no \
    "$ECS_USER@$ECS_IP" << EOF
    set -e
    
    echo "📂 解压项目..."
    cd $PROJECT_DIR
    tar -xzf 72hours-deploy.tar.gz
    cd 72hours
    
    echo "📦 安装依赖..."
    npm install --production
    
    echo "🔧 配置环境..."
    # 确保端口是 80
    sed -i 's/PORT=3000/PORT=80/' .env
    
    echo "🔄 重启服务..."
    # 使用 PM2 管理进程（如果安装了）
    if command -v pm2 &> /dev/null; then
        pm2 delete 72hours 2>/dev/null || true
        pm2 start dist/src/server/index.js --name 72hours
        pm2 save
    else
        # 使用 nohup 后台运行
        pkill -f "node dist/src/server/index.js" 2>/dev/null || true
        nohup node dist/src/server/index.js > server.log 2>&1 &
    fi
    
    echo "✅ 部署完成！"
    echo "🌐 访问地址: http://$ECS_IP/"
EOF

# 清理
rm -f /tmp/72hours-deploy.tar.gz

echo "🎉 部署完成！"
echo "🌐 访问地址: http://$ECS_IP/"
echo "🔍 健康检查: http://$ECS_IP/health"
