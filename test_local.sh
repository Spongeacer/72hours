#!/bin/bash
# 本地开发环境完整测试脚本
# 使用方法: ./test_local.sh

set -e  # 遇到错误立即退出

echo "========================================"
echo "72Hours 本地完整测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
echo "【1/5】检查依赖..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 依赖检查通过${NC}"

# 编译项目
echo ""
echo "【2/5】编译项目..."
cd "$(dirname "$0")"
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 编译成功${NC}"
else
    echo -e "${RED}❌ 编译失败${NC}"
    cat /tmp/build.log
    exit 1
fi

# 启动服务器
echo ""
echo "【3/5】启动服务器..."
node dist/src/server/index.js &
SERVER_PID=$!
echo "服务器PID: $SERVER_PID"

# 等待服务器就绪
echo "等待服务器就绪..."
for i in {1..30}; do
    sleep 1
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务器就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 服务器启动超时${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
done

# 运行测试
echo ""
echo "【4/5】运行完整测试..."
python3 test_local_runner.py
TEST_RESULT=$?

# 停止服务器
echo ""
echo "【5/5】清理..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo -e "${GREEN}✅ 服务器已停止${NC}"

# 输出结果
echo ""
echo "========================================"
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 测试通过！${NC}"
else
    echo -e "${YELLOW}⚠️  测试未完成${NC}"
fi
echo "========================================"

exit $TEST_RESULT
