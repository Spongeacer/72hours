#!/usr/bin/env python3
"""
Docker环境测试运行器
"""

import os
import time
import json
import http.client
import sys

SERVER_HOST = os.getenv('GAME_SERVER_URL', 'http://game-server:3000').replace('http://', '').replace('https://', '')
if ':' in SERVER_HOST:
    SERVER_HOST, SERVER_PORT = SERVER_HOST.split(':')
    SERVER_PORT = int(SERVER_PORT)
else:
    SERVER_PORT = 3000

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log(msg, color=Colors.BLUE):
    print(f"{color}{msg}{Colors.END}", flush=True)

def request(path, method='GET', body=None, timeout=60):
    try:
        conn = http.client.HTTPConnection(SERVER_HOST, SERVER_PORT, timeout=timeout)
        headers = {"Content-Type": "application/json"}
        if body:
            conn.request(method, f"/api{path}", json.dumps(body), headers)
        else:
            conn.request(method, f"/api{path}", headers=headers)
        resp = conn.getresponse()
        data = json.loads(resp.read().decode())
        conn.close()
        return data
    except Exception as e:
        return {"error": str(e)}

def wait_for_server(max_wait=120):
    """等待服务器就绪"""
    log("等待游戏服务器就绪...")
    for i in range(max_wait):
        try:
            result = request('/health', timeout=2)
            if result.get('success'):
                log(f"✅ 服务器就绪 (等待{i+1}秒)", Colors.GREEN)
                return True
        except:
            pass
        time.sleep(1)
    return False

def main():
    log("=" * 60)
    log("【Docker测试】72Hours 完整流程测试")
    log("=" * 60)
    
    # 等待服务器
    if not wait_for_server():
        log("❌ 服务器未就绪", Colors.RED)
        return False
    
    # 1. 创建游戏
    log("\n【步骤1】创建游戏 - 角色随机生成")
    create = request('/games', 'POST', {})
    
    if not create.get('success'):
        log(f"❌ 创建失败: {create.get('error')}", Colors.RED)
        return False
    
    game_id = create['data']['gameId']
    player = create['data']['player']
    
    log(f"✅ 游戏创建成功: {game_id}", Colors.GREEN)
    log(f"身份: {player['identityType']}")
    log(f"执念: {player['obsession']}")
    log(f"特质: {', '.join([t['id'] for t in player['traits']])}")
    
    # 2. 回合循环
    log("\n【步骤2】回合循环 - 直到触发事件4")
    story_event = 0
    turn_records = []
    
    for turn_num in range(1, 45):
        state = request(f'/games/{game_id}/state')
        if not state.get('success'):
            log(f"❌ 回合{turn_num}: 获取状态失败", Colors.RED)
            break
        
        turn = state['data']['turn']
        omega = state['data']['omega']
        pressure = state['data']['pressure']
        weather = state['data']['weather']
        
        # 检查事件
        event = None
        if omega >= 5 and story_event < 2:
            story_event = 2
            event = "事件2"
            log(f"🎉 回合{turn}: 触发事件2！Ω={omega:.2f}", Colors.GREEN)
        elif omega >= 10 and story_event < 3:
            story_event = 3
            event = "事件3"
            log(f"🎉 回合{turn}: 触发事件3！Ω={omega:.2f}", Colors.GREEN)
        elif omega >= 15 and story_event < 4:
            story_event = 4
            event = "事件4"
            turn_records.append({"turn": turn, "omega": round(omega,2), "event": event})
            log(f"🎉 回合{turn}: 触发事件4！Ω={omega:.2f}", Colors.GREEN)
            break
        
        turn_records.append({"turn": turn, "omega": round(omega,2), "pressure": round(pressure,2), "event": event or "-"})
        
        if turn_num % 5 == 0 or event:
            log(f"回合{turn}: Ω={omega:.2f}, 压强={pressure:.2f}, 天气={weather} {event or ''}")
        
        # 执行回合
        start = time.time()
        result = request(f'/games/{game_id}/turns', 'POST', {
            'choice': {'id': 'explore', 'text': '探索周围环境'}
        }, timeout=60)
        duration = time.time() - start
        
        if result.get('data', {}).get('gameOver'):
            reason = result['data']['gameOver'].get('reason', '未知')
            log(f"⚠️  游戏结束: {reason}", Colors.YELLOW)
            break
        
        if 'choices' in result.get('data', {}) and turn_num % 10 == 0:
            choices = result['data']['choices']
            log(f"  AI生成{len(choices)}个选择 (耗时{duration:.1f}s)")
        
        time.sleep(0.2)
    
    # 3. 生成报告
    log("\n【步骤3】生成测试报告")
    
    report_lines = [
        "# 72Hours Docker测试报告",
        "",
        f"**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"**测试结果**: {'✅通过' if story_event >= 4 else '⚠️未完成'}",
        f"**最终事件**: {story_event}",
        "",
        "## 角色信息",
        "",
        f"- **身份**: {player['identityType']}",
        f"- **执念**: {player['obsession']}",
        f"- **特质**: {', '.join([t['id'] for t in player['traits']])}",
        "",
        "## 回合记录",
        "",
        "| 回合 | Ω值 | 压强 | 事件 |",
        "|-----|-----|------|------|"
    ]
    
    for t in turn_records:
        report_lines.append(f"| {t['turn']} | {t['omega']} | {t.get('pressure', '-')} | {t['event']} |")
    
    report_lines.extend(["", "## 总结", ""])
    
    if story_event >= 4:
        report_lines.append("✅ **测试通过**: 成功触发事件4")
    else:
        final_omega = turn_records[-1]['omega'] if turn_records else 0
        report_lines.append(f"⚠️ **测试未完成**: 最终Ω={final_omega}")
    
    report = "\n".join(report_lines)
    
    with open('/app/testlog.md', 'w') as f:
        f.write(report)
    
    log("✅ 报告已保存到 /app/testlog.md", Colors.GREEN)
    
    return story_event >= 4

if __name__ == '__main__':
    success = main()
    print()
    log("=" * 60)
    if success:
        log("🎉 Docker测试通过！", Colors.GREEN)
    else:
        log("⚠️  Docker测试未完成", Colors.YELLOW)
    log("=" * 60)
    sys.exit(0 if success else 1)
