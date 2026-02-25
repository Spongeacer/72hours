#!/bin/bash
# 游戏故事分析监控脚本

LOG_FILE="/tmp/full-game-running.log"
SUGGESTION_FILE="/root/.openclaw/workspace/72hours/suggestion.md"
STATE_FILE="/root/.openclaw/workspace/72hours/tmp/analysis_state.txt"

# 初始化状态
if [ ! -f "$STATE_FILE" ]; then
    echo "0" > "$STATE_FILE"
fi

LAST_LINE=$(cat "$STATE_FILE")
CURRENT_LINE=0

analyze_turn() {
    local turn_num=$1
    local turn_content=$2
    
    echo ""
    echo "## 第 ${turn_num} 回合分析"
    echo ""
    echo "- 分析时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # 提取关键信息
    local time_info=$(echo "$turn_content" | grep -oP "时间: \K[^|]+" | head -1 | xargs)
    local weather=$(echo "$turn_content" | grep -oP "天气: \K[^|]+" | head -1 | xargs)
    local pressure=$(echo "$turn_content" | grep -oP "压强: \K[0-9]+" | head -1)
    local omega=$(echo "$turn_content" | grep -oP "Ω: \K[0-9.]+" | head -1)
    local spotlight=$(echo "$turn_content" | grep -oP "聚光灯NPC: \K.+" | head -1)
    
    echo "- 场景信息: ${time_info} | ${weather} | 压强:${pressure}/100 | Ω:${omega}"
    [ -n "$spotlight" ] && echo "- 聚光灯NPC: ${spotlight}"
    echo ""
    
    # 提取叙事内容（前200字）
    local narrative=$(echo "$turn_content" | sed -n '/【叙事】/,/【选择】/p' | grep -v "【叙事】" | grep -v "【选择】" | head -20)
    echo "- 故事摘要:"
    echo "  > $(echo "$narrative" | head -3 | tr '\n' ' ' | cut -c1-200)..."
    echo ""
    
    # 提取选项
    local choices=$(echo "$turn_content" | sed -n '/【选择】/,/【玩家选择】/p' | grep -v "【选择】" | grep -v "【玩家选择】" | head -10)
    local choice_count=$(echo "$choices" | grep -c "^\s*[0-9]" || echo "0")
    echo "- 选项数量: ${choice_count}"
    echo ""
    
    # 提取玩家选择和结果
    local player_choice=$(echo "$turn_content" | grep -oP "【玩家选择】\K.+" | head -1)
    local result=$(echo "$turn_content" | sed -n '/【结果】/,/【后续】/p' | grep -v "【结果】" | grep -v "【后续】" | head -5)
    
    [ -n "$player_choice" ] && echo "- 玩家选择: ${player_choice}"
    echo ""
    
    # 分析维度占位（待人工细化）
    echo "- 优点:"
    echo "  - [待分析]"
    echo ""
    echo "- 问题:"
    echo "  - [待分析]"
    echo ""
    echo "- 建议:"
    echo "  - [待分析]"
    echo ""
    echo "---"
    echo ""
}

# 主监控循环
echo "开始监控游戏日志..."
echo "日志文件: $LOG_FILE"
echo "建议文件: $SUGGESTION_FILE"
echo ""

while true; do
    if [ -f "$LOG_FILE" ]; then
        CURRENT_LINE=$(wc -l < "$LOG_FILE")
        
        if [ $CURRENT_LINE -gt $LAST_LINE ]; then
            # 获取新增内容
            NEW_CONTENT=$(sed -n "$((LAST_LINE + 1)),${CURRENT_LINE}p" "$LOG_FILE")
            
            # 检查是否有新回合
            if echo "$NEW_CONTENT" | grep -q "【第.*回合】"; then
                # 提取所有回合号
                TURNS=$(echo "$NEW_CONTENT" | grep -oP "【第\s*\d+\s*回合】" | grep -oP "\d+")
                
                for TURN_NUM in $TURNS; do
                    # 提取该回合的完整内容
                    TURN_START=$(grep -n "【第 ${TURN_NUM} 回合】" "$LOG_FILE" | tail -1 | cut -d: -f1)
                    TURN_END=$(grep -n "【第 $((TURN_NUM + 1)) 回合】" "$LOG_FILE" | head -1 | cut -d: -f1)
                    
                    if [ -z "$TURN_END" ]; then
                        TURN_END=$CURRENT_LINE
                    else
                        TURN_END=$((TURN_END - 1))
                    fi
                    
                    TURN_CONTENT=$(sed -n "${TURN_START},${TURN_END}p" "$LOG_FILE")
                    
                    # 检查是否已有该回合的分析
                    if ! grep -q "## 第 ${TURN_NUM} 回合分析" "$SUGGESTION_FILE" 2>/dev/null; then
                        echo "[$(date +%H:%M:%S)] 分析第 ${TURN_NUM} 回合..."
                        
                        # 追加分析到建议文件
                        analyze_turn "$TURN_NUM" "$TURN_CONTENT" >> "$SUGGESTION_FILE"
                    fi
                done
            fi
            
            LAST_LINE=$CURRENT_LINE
            echo $LAST_LINE > "$STATE_FILE"
        fi
    fi
    
    sleep 5
done
