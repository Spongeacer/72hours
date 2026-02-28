#!/bin/bash
# version-check.sh
# 检查本地、GitHub、阿里云 ECS 版本一致性

set -e

echo "🔍 72Hours 版本一致性检查"
echo "============================"

# 配置
ECS_IP="149.129.214.203"
ECS_USER="root"
ECS_PASSWORD="Abcd123!"
GITHUB_REPO="Spongeacer/72hours"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查本地版本
echo ""
echo "📦 本地版本:"
LOCAL_VERSION=$(cat /root/.openclaw/workspace/72hours/package.json | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
echo "  package.json: $LOCAL_VERSION"

LOCAL_GIT_VERSION=$(cd /root/.openclaw/workspace/72hours && git describe --tags --always 2>/dev/null || echo "no tag")
echo "  git tag: $LOCAL_GIT_VERSION"

# 2. 检查 GitHub 版本
echo ""
echo "🐙 GitHub 版本:"
GITHUB_VERSION=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep '"tag_name"' | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]' || echo "unknown")
echo "  latest release: $GITHUB_VERSION"

# 3. 检查阿里云 ECS 版本
echo ""
echo "☁️  阿里云 ECS 版本:"
ECS_VERSION=$(sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "$ECS_USER@$ECS_IP" "
  cat /opt/72hours/package.json | grep '\"version\"' | head -1 | awk -F: '{ print \$2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]'
" 2>/dev/null || echo "unknown")
echo "  package.json: $ECS_VERSION"

ECS_GIT_VERSION=$(sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=no -o LogLevel=ERROR "$ECS_USER@$ECS_IP" "
  cd /opt/72hours && git describe --tags --always 2>/dev/null || echo 'no tag'
" 2>/dev/null || echo "unknown")
echo "  git commit: $ECS_GIT_VERSION"

# 4. 检查运行时版本
echo ""
echo "🚀 运行时版本:"
RUNTIME_VERSION=$(curl -s http://$ECS_IP:80/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
echo "  /health API: $RUNTIME_VERSION"

# 5. 对比版本
echo ""
echo "📊 版本对比:"
echo "============================"

# 本地 vs GitHub
if [ "$LOCAL_VERSION" = "$GITHUB_VERSION" ]; then
  echo -e "${GREEN}✅ 本地与 GitHub 一致${NC}"
else
  echo -e "${RED}❌ 本地与 GitHub 不一致${NC}"
  echo "   本地: $LOCAL_VERSION"
  echo "   GitHub: $GITHUB_VERSION"
fi

# 本地 vs ECS
if [ "$LOCAL_VERSION" = "$ECS_VERSION" ]; then
  echo -e "${GREEN}✅ 本地与 ECS 一致${NC}"
else
  echo -e "${RED}❌ 本地与 ECS 不一致${NC}"
  echo "   本地: $LOCAL_VERSION"
  echo "   ECS: $ECS_VERSION"
fi

# ECS 运行时 vs 代码
if [ "$ECS_VERSION" = "$RUNTIME_VERSION" ]; then
  echo -e "${GREEN}✅ ECS 代码与运行时一致${NC}"
else
  echo -e "${YELLOW}⚠️  ECS 代码与运行时不一致${NC}"
  echo "   代码: $ECS_VERSION"
  echo "   运行时: $RUNTIME_VERSION"
  echo "   (可能需要重启服务)"
fi

echo ""
echo "============================"

# 总结
if [ "$LOCAL_VERSION" = "$ECS_VERSION" ] && [ "$ECS_VERSION" = "$RUNTIME_VERSION" ]; then
  echo -e "${GREEN}🎉 所有环境版本一致！${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  版本不一致，建议同步部署${NC}"
  exit 1
fi
