#!/bin/bash

# 72Hours 完整测试套件运行脚本
# 运行所有核心功能测试

echo "=========================================="
echo "72Hours 完整测试套件"
echo "=========================================="
echo ""

# 进入项目根目录
cd "$(dirname "$0")/.."

# 检查服务器是否运行
echo "🔍 检查服务器状态..."
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "⚠️  服务器未运行，启动服务器..."
    node dist/src/server/index.js &
    sleep 3
fi
echo "✅ 服务器运行正常"
echo ""

# 运行所有测试
echo "🧪 开始运行测试..."
echo ""

TESTS=(
    "test/physics-engine.test.ts:物理引擎测试"
    "test/emergence.test.ts:涌现机制测试"
    "test/background.test.ts:模块化背景测试"
    "test/ai-integration.test.ts:AI集成测试"
)

PASSED=0
FAILED=0

for test in "${TESTS[@]}"; do
    IFS=':' read -r file name <<< "$test"
    echo "----------------------------------------"
    echo "📋 运行: $name"
    echo "----------------------------------------"
    
    if npx ts-node "$file" 2>&1; then
        echo "✅ $name 通过"
        ((PASSED++))
    else
        echo "❌ $name 失败"
        ((FAILED++))
    fi
    echo ""
done

# 测试报告
echo "=========================================="
echo "📊 测试报告"
echo "=========================================="
echo "通过: $PASSED"
echo "失败: $FAILED"
echo "总计: ${#TESTS[@]}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ 所有测试通过！"
    exit 0
else
    echo "❌ 部分测试失败"
    exit 1
fi
