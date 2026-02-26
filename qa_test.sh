#!/bin/bash
# 72Hours QA测试脚本
# 模拟前端交互，完成72回合游戏

BASE_URL="http://localhost:3000"
API_KEY="sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn"
GAME_ID=""

# 创建游戏
echo "=== QA测试开始 ==="
echo "步骤1: 创建游戏..."

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/game/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"apiKey\": \"$API_KEY\",
    \"identity\": \"scholar\",
    \"model\": \"Pro/MiniMaxAI/MiniMax-M2.1\"
  }")

echo "创建响应: $CREATE_RESPONSE"

# 提取gameId
GAME_ID=$(echo $CREATE_RESPONSE | grep -o '"gameId":"[^"]*"' | cut -d'"' -f4)
echo "游戏ID: $GAME_ID"

if [ -z "$GAME_ID" ]; then
  echo "错误: 无法获取游戏ID"
  exit 1
fi

# 提取开场白
OPENING=$(echo $CREATE_RESPONSE | grep -o '"opening":"[^"]*"' | cut -d'"' -f4)
echo "开场白: $OPENING"

echo ""
echo "=== 开始72回合测试 ==="

# 执行72回合
for i in $(seq 1 72); do
  echo "回合 $i..."
  
  # 执行回合（生成叙事和选择）
  TURN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/game/$GAME_ID/turn" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  # 检查是否成功
  SUCCESS=$(echo $TURN_RESPONSE | grep -o '"success":true')
  
  if [ -z "$SUCCESS" ]; then
    echo "错误: 回合 $i 失败"
    echo "响应: $TURN_RESPONSE"
    exit 1
  fi
  
  # 提取关键信息
  TURN=$(echo $TURN_RESPONSE | grep -o '"turn":[0-9]*' | cut -d':' -f2)
  PRESSURE=$(echo $TURN_RESPONSE | grep -o '"pressure":[0-9.]*' | head -1 | cut -d':' -f2)
  OMEGA=$(echo $TURN_RESPONSE | grep -o '"omega":[0-9.]*' | head -1 | cut -d':' -f2)
  
  echo "  回合: $TURN, 压强: $PRESSURE, Ω: $OMEGA"
  
  # 如果有选择，随机选择一个
  CHOICES_COUNT=$(echo $TURN_RESPONSE | grep -o '"choices":\[' | wc -l)
  
  if [ "$CHOICES_COUNT" -gt 0 ]; then
    # 提取第一个选择的id
    CHOICE_ID=$(echo $TURN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$CHOICE_ID" ]; then
      echo "  选择: $CHOICE_ID"
      
      # 提交选择
      CHOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/game/$GAME_ID/turn" \
        -H "Content-Type: application/json" \
        -d "{
          \"choice\": {
            \"id\": \"$CHOICE_ID\",
            \"text\": \"选择\"
          }
        }")
      
      CHOICE_SUCCESS=$(echo $CHOICE_RESPONSE | grep -o '"success":true')
      
      if [ -z "$CHOICE_SUCCESS" ]; then
        echo "错误: 选择提交失败"
        echo "响应: $CHOICE_RESPONSE"
        exit 1
      fi
    fi
  fi
  
  # 每10回合暂停一下
  if [ $((i % 10)) -eq 0 ]; then
    echo "  已完成 $i 回合"
  fi
  
  # 短暂延迟避免请求过快
  sleep 0.5
done

echo ""
echo "=== 获取游戏故事 ==="

STORY_RESPONSE=$(curl -s "$BASE_URL/api/game/$GAME_ID/story")
echo "故事记录: $STORY_RESPONSE"

echo ""
echo "=== QA测试完成 ==="
