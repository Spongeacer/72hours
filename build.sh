#!/bin/bash

# 72Hours 打包脚本
# 生成跨平台可执行文件

echo "🎮 72Hours 打包工具"
echo "===================="

# 先构建
echo "📦 步骤 1: 编译 TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

echo "✅ 编译完成"
echo ""

# 打包各平台
echo "📦 步骤 2: 打包可执行文件..."

# Linux
echo "🐧 打包 Linux 版本..."
npx pkg . --targets=node18-linux-x64 --output=dist/bin/72hours-linux

# Windows
echo "🪟 打包 Windows 版本..."
npx pkg . --targets=node18-win-x64 --output=dist/bin/72hours-win.exe

# macOS
echo "🍎 打包 macOS 版本..."
npx pkg . --targets=node18-macos-x64 --output=dist/bin/72hours-macos

echo ""
echo "✅ 打包完成！"
echo ""
echo "📂 输出文件:"
ls -lh dist/bin/

echo ""
echo "🚀 使用方法:"
echo "  Linux:   ./dist/bin/72hours-linux"
echo "  Windows: .\\dist\\bin\\72hours-win.exe"
echo "  macOS:   ./dist/bin/72hours-macos"
