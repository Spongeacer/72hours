# 72Hours 跨平台可执行程序

## 打包方法

### 方法 1: 使用脚本（推荐）
```bash
./build.sh
```

### 方法 2: 手动打包单个平台
```bash
# Linux
npm run package

# 所有平台
npm run package:all
```

## 输出文件

打包完成后，在 `dist/bin/` 目录下会生成：

| 文件 | 平台 | 大小 |
|------|------|------|
| `72hours-linux` | Linux x64 | ~40MB |
| `72hours-win.exe` | Windows x64 | ~35MB |
| `72hours-macos` | macOS x64 | ~40MB |

## 使用方法

### Linux / macOS
```bash
# 给予执行权限
chmod +x 72hours-linux

# 运行
./72hours-linux

# 指定端口
PORT=8080 ./72hours-linux
```

### Windows
```cmd
# 直接双击运行，或在命令行执行
72hours-win.exe

# 指定端口
set PORT=8080
72hours-win.exe
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | 3000 |
| `NODE_ENV` | 运行环境 | production |
| `CORS_ORIGIN` | 跨域来源 | * |
| `SILICONFLOW_API_KEY` | AI API Key | - |

## 注意事项

1. **首次运行较慢**：程序需要解压内置的 Node.js 运行时
2. **防火墙**：确保防火墙允许访问指定端口
3. **后台运行**：
   - Linux/macOS: `./72hours-linux &`
   - Windows: 使用 PM2 或 NSSM

## 与源码部署的区别

| 特性 | 可执行程序 | 源码部署 |
|------|-----------|----------|
| 安装难度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| 文件大小 | ~40MB | ~100MB+ |
| 启动速度 | 较慢 | 快 |
| 调试 | 困难 | 容易 |
| 适合场景 | 生产环境 | 开发环境 |
