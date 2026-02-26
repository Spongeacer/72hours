#!/bin/bash
# API 完整测试脚本

echo "=== API 完整测试 ==="
echo ""

# 1. 健康检查
echo "1. 健康检查"
curl -s http://localhost:3000/health | jq '.data | {status, version}'
echo ""

# 2. 创建游戏
echo "2. 创建游戏"
GAME_RESPONSE=$(curl -s -X POST http://localhost:3000/api/games -H "Content-Type: application/json" -d '{"identity":"scholar"}')
GAME_ID=$(echo $GAME_RESPONSE | jq -r '.data.gameId')
echo "GameID: $GAME_ID"
echo "Player: $(echo $GAME_RESPONSE | jq -r '.data.player.identityType')"
echo "Pressure: $(echo $GAME_RESPONSE | jq -r '.data.state.pressure')"
echo "Omega: $(echo $GAME_RESPONSE | jq -r '.data.state.omega')"
echo ""

# 3. 获取状态
echo "3. 获取游戏状态"
curl -s http://localhost:3000/api/games/$GAME_ID/state | jq '.data | {turn, pressure, omega, weather}'
echo ""

# 4. 执行回合
echo "4. 执行回合"
TURN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/games/$GAME_ID/turns -H "Content-Type: application/json" -d '{}')
echo "Turn: $(echo $TURN_RESPONSE | jq -r '.data.turn')"
echo "Pressure: $(echo $TURN_RESPONSE | jq -r '.data.state.pressure')"
echo "Omega: $(echo $TURN_RESPONSE | jq -r '.data.state.omega')"
echo "Choices: $(echo $TURN_RESPONSE | jq -r '.data.choices | length')"
echo ""

# 5. 获取历史
echo "5. 获取历史记录"
curl -s http://localhost:3000/api/games/$GAME_ID/history | jq '.data | length'
echo ""

echo "=== 测试完成 ==="
