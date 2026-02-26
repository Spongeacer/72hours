# Docker测试方案

## 快速开始

### 1. 确保Docker已安装

```bash
docker --version
docker-compose --version
```

### 2. 构建并运行测试

```bash
# 一键构建并测试
docker-compose up --build

# 或在后台运行
docker-compose up --build -d

# 查看测试日志
docker-compose logs -f test-runner
```

### 3. 查看测试报告

```bash
# 测试完成后，报告会保存在当前目录
cat testlog.md
```

## 架构说明

```
┌─────────────────┐     ┌─────────────────┐
│   game-server   │────▶│  test-runner    │
│   (Node.js)     │     │   (Python)      │
│   port: 3000    │     │                 │
└─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
    游戏服务器              测试执行
    角色生成                回合推进
    AI选择生成              事件验证
```

## 单独使用

### 只启动游戏服务器

```bash
# 构建镜像
docker build -t 72hours-server .

# 运行容器
docker run -p 3000:3000 72hours-server

# 测试API
curl http://localhost:3000/health
```

### 手动运行测试

```bash
# 启动服务器
docker run -d --name game-server -p 3000:3000 72hours-server

# 等待服务器就绪
sleep 5

# 运行测试
docker run --rm --link game-server:game-server \
  -e GAME_SERVER_URL=http://game-server:3000 \
  -v $(pwd)/testlog.md:/app/testlog.md \
  72hours-test
```

## 文件说明

| 文件 | 用途 |
|-----|------|
| `Dockerfile` | 游戏服务器镜像 |
| `Dockerfile.test` | 测试运行器镜像 |
| `docker-compose.yml` | 编排配置 |
| `test_docker_runner.py` | Docker测试脚本 |

## 优势

1. **环境隔离** - 不受宿主机进程限制
2. **可重现** - 每次测试环境一致
3. **易部署** - 任何有Docker的机器都能运行
4. **健康检查** - 自动确保服务器就绪

## 故障排除

### 容器启动失败
```bash
# 查看日志
docker-compose logs game-server

# 重新构建
docker-compose down
docker-compose up --build
```

### 测试连接失败
```bash
# 检查网络
docker network ls
docker network inspect 72hours_default

# 手动测试连接
docker exec -it 72hours-game-server-1 wget -O- http://localhost:3000/health
```

### 清理
```bash
# 停止并删除所有容器
docker-compose down

# 删除镜像
docker rmi 72hours-server 72hours-test

# 清理卷
docker volume prune
```
