#!/bin/bash

# AI 集成测试运行脚本
# 验证 SiliconFlow API 调用是否正常

echo "=========================================="
echo "72Hours AI 集成测试"
echo "=========================================="
echo ""

# 检查环境变量
if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo "⚠️  警告: SILICONFLOW_API_KEY 环境变量未设置"
    echo "   测试将使用 .env 文件中的配置"
    echo ""
fi

# 进入项目根目录
cd "$(dirname "$0")/.."

# 运行测试
echo "🧪 运行 AI 集成测试..."
echo ""

npm run test:ai

# 检查测试结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 所有测试通过！"
else
    echo ""
    echo "❌ 测试失败，请检查输出日志"
fi

echo ""
echo "=========================================="
