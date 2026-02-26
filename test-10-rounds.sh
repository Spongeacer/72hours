#!/bin/bash
# 10回合完整测试

echo "=== 72Hours 10回合完整测试 ==="

# 创建游戏
echo "[1] 创建游戏..."
GAME_RESPONSE=$(curl -s -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"identity":"scholar"}')
GAME_ID=$(echo $GAME_RESPONSE | jq -r '.data.gameId')
PLAYER_IDENTITY=$(echo $GAME_RESPONSE | jq -r '.data.player.identity.name')
OBSESSION=$(echo $GAME_RESPONSE | jq -r '.data.player.obsession')

echo "    游戏ID: $GAME_ID"
echo "    身份: $PLAYER_IDENTITY"
echo "    执念: $OBSESSION"

# 10个回合
for turn in {1..10}; do
  echo ""
  echo "=== 第 $turn/72 回合 ==="
  
  # 获取AI Prompt
  PROMPT_DATA=$(curl -s "http://localhost:3000/api/games/$GAME_ID/ai-prompt")
  PROMPT=$(echo $PROMPT_DATA | jq -r '.data.prompt')
  MODEL=$(echo $PROMPT_DATA | jq -r '.data.model')
  
  # AI生成叙事
  echo -n "[AI生成] "
  START_TIME=$(date +%s)
  
  # 创建临时JSON文件避免转义问题
  cat > /tmp/ai_request.json << EOF
{
  "model": "$MODEL",
  "messages": [
    {"role": "system", "content": "你是一个涌现式叙事引擎。"},
    {"role": "user", "content": $(echo "$PROMPT" | jq -R -s '.')}
  ],
  "temperature": 0.8,
  "max_tokens": 400
}
EOF
  
  AI_RESPONSE=$(curl -s -X POST https://api.siliconflow.cn/v1/chat/completions \
    -H "Authorization: Bearer sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn" \
    -H "Content-Type: application/json" \
    -d @/tmp/ai_request.json \
    --max-time 30)
  
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  NARRATIVE=$(echo $AI_RESPONSE | jq -r '.choices[0].message.content')
  
  if [ "$NARRATIVE" = "null" ] || [ -z "$NARRATIVE" ]; then
    echo "失败 (使用离线叙事)"
    NARRATIVE="> 第${turn}回合。你站在村子里，空气中弥漫着紧张的气氛。"
  else
    echo "成功 (${DURATION}秒)"
  fi
  
  # 执行回合
  TURN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/games/$GAME_ID/turns" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  PRESSURE=$(echo $TURN_RESPONSE | jq -r '.data.state.pressure')
  OMEGA=$(echo $TURN_RESPONSE | jq -r '.data.state.omega')
  WEATHER=$(echo $TURN_RESPONSE | jq -r '.data.state.weather')
  
  echo "[状态] 压强: $PRESSURE | Ω: $OMEGA | 天气: $WEATHER"
  echo "[叙事]"
  echo "$NARRATIVE" | head -5
  echo "..."
  
  # 检查游戏结束
  GAME_OVER=$(echo $TURN_RESPONSE | jq -r '.data.gameOver')
  if [ "$GAME_OVER" != "null" ]; then
    REASON=$(echo $TURN_RESPONSE | jq -r '.data.gameOver.reason')
    echo ""
    echo "[游戏结束] $REASON"
    break
  fi
done

echo ""
echo "=== 测试完成 ==="
rm -f /tmp/ai_request.json
