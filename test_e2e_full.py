#!/usr/bin/env python3
"""
完整端到端测试 - 从角色生成到事件4
包含AI API调用，不简化任何环节
"""

import subprocess
import time
import json
import urllib.request
import urllib.error
import os

# 全局配置
BASE_URL = "http://localhost:3000/api"
LOGS = []
GAME_ID = None

def log(message, data=None):
    """记录日志"""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    entry = {"timestamp": timestamp, "message": message, "data": data}
    LOGS.append(entry)
    print(f"[{timestamp}] {message}")
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    return entry

def request(path, method='GET', body=None, timeout=60):
    """HTTP请求，包含AI调用需要较长超时"""
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    if body:
        req.data = json.dumps(body).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return {'success': False, 'error': {'message': f'HTTP {e.code}: {e.read().decode()}'}}
    except Exception as e:
        return {'success': False, 'error': {'message': str(e)}}

def start_server():
    """启动游戏服务器"""
    log("启动游戏服务器...")
    
    # 清理旧进程
    os.system("pkill -f 'node dist/src/server' 2>/dev/null")
    time.sleep(2)
    
    # 启动新服务器
    proc = subprocess.Popen(
        ['node', 'dist/src/server/index.js'],
        stdout=open('/tmp/server.log', 'a'),
        stderr=subprocess.STDOUT,
        cwd='/root/.openclaw/workspace/72hours'
    )
    
    # 等待服务器就绪
    for i in range(30):
        time.sleep(1)
        try:
            health = request('/health')
            if health.get('success'):
                log(f"服务器就绪 (PID: {proc.pid})")
                return proc
        except:
            pass
    
    raise Exception("服务器启动失败")

def test_create_game():
    """测试创建游戏 - 角色随机生成"""
    global GAME_ID
    
    log("=" * 60)
    log("【测试1】创建游戏 - 角色随机生成")
    log("=" * 60)
    
    # 不指定身份，让系统随机
    result = request('/games', 'POST', {})
    
    if not result.get('success'):
        log("❌ 创建游戏失败", result)
        return False
    
    GAME_ID = result['data']['gameId']
    player = result['data']['player']
    npcs = result['data']['bondedNPCs']
    
    log("✅ 游戏创建成功")
    log("角色信息:", {
        "gameId": GAME_ID,
        "identityType": player['identityType'],
        "identityName": player['identity']['name'],
        "obsession": player['obsession'],
        "traits": [t['id'] for t in player['traits']],
        "initialStates": player['states'],
        "initialNPCs": [n['name'] for n in npcs]
    })
    
    # 验证随机性
    checks = [
        ("身份类型非空", player['identityType'] in ['scholar', 'landlord', 'soldier', 'cultist']),
        ("执念非空", len(player['obsession']) > 0),
        ("特质2-3个", 2 <= len(player['traits']) <= 3),
        ("初始NPC为4个", len(npcs) == 4),
        ("初始Ω为4", result['data']['state']['omega'] == 4),
        ("初始压强为2", result['data']['state']['pressure'] == 2)
    ]
    
    for name, passed in checks:
        log(f"{'✅' if passed else '❌'} {name}")
    
    return all(c[1] for c in checks)

def test_turn_flow(target_turn=50):
    """测试回合流程 - 直到触发事件4或达到目标回合"""
    global GAME_ID
    
    log("=" * 60)
    log(f"【测试2】回合流程 - 目标: 触发事件4或{target_turn}回合")
    log("=" * 60)
    
    story_event = 0
    turn_logs = []
    
    for turn_num in range(1, target_turn + 1):
        # 获取当前状态
        state = request(f'/games/{GAME_ID}/state')
        if not state.get('success'):
            log(f"❌ 回合{turn_num}: 获取状态失败", state)
            return False, turn_logs
        
        turn_data = state['data']
        turn = turn_data['turn']
        pressure = turn_data['pressure']
        omega = turn_data['omega']
        weather = turn_data['weather']
        
        # 检查事件触发
        event_triggered = None
        if omega >= 5 and story_event < 2:
            story_event = 2
            event_triggered = "事件2: 解锁第5-8个NPC"
            log(f"🎉 回合{turn}: 触发事件2！Ω={omega:.2f}")
        elif omega >= 10 and story_event < 3:
            story_event = 3
            event_triggered = "事件3: 解锁第9-10个NPC+历史人物"
            log(f"🎉 回合{turn}: 触发事件3！Ω={omega:.2f}")
        elif omega >= 15 and story_event < 4:
            story_event = 4
            event_triggered = "事件4: 最终阶段"
            log(f"🎉 回合{turn}: 触发事件4！Ω={omega:.2f}")
            
            turn_logs.append({
                'turn': turn, 'pressure': round(pressure, 2), 'omega': round(omega, 2),
                'weather': weather, 'event': event_triggered
            })
            break
        
        # 记录回合日志
        turn_logs.append({
            'turn': turn, 'pressure': round(pressure, 2), 'omega': round(omega, 2),
            'weather': weather, 'event': event_triggered or '-'
        })
        
        if turn_num % 5 == 0 or event_triggered:
            log(f"回合{turn}: Ω={omega:.2f}, 压强={pressure:.2f}, 天气={weather}, 事件={event_triggered or '-'}")
        
        # 执行回合 - 这里会调用AI API生成选择
        log(f"  执行回合{turn} - 调用AI API生成选择...", level='debug')
        turn_start = time.time()
        
        turn_result = request(f'/games/{GAME_ID}/turns', 'POST', {
            'choice': {'id': 'explore', 'text': '探索周围环境'}
        }, timeout=60)  # AI调用需要较长时间
        
        turn_duration = time.time() - turn_start
        
        if not turn_result.get('success'):
            log(f"❌ 回合{turn}: 执行失败", turn_result)
            return False, turn_logs
        
        # 记录AI生成的选择
        choices = turn_result['data'].get('choices', [])
        if choices:
            log(f"  AI生成{len(choices)}个选择 (耗时{turn_duration:.1f}s):")
            for i, c in enumerate(choices[:3], 1):
                log(f"    {i}. [{c.get('type', '?')}] {c.get('text', '?')[:50]}...")
        
        # 检查游戏结束
        if turn_result['data'].get('gameOver'):
            log(f"⚠️ 游戏结束: {turn_result['data']['gameOver']}")
            return False, turn_logs
        
        # 短暂延迟避免请求过快
        time.sleep(0.5)
    
    return story_event >= 4, turn_logs

def generate_report(success, turn_logs):
    """生成测试报告"""
    log("=" * 60)
    log("【测试完成】生成报告")
    log("=" * 60)
    
    report = f"""# 72Hours 完整端到端测试报告

**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}
**测试目标**: 从角色生成到触发事件4
**AI调用**: 包含（未简化）
**测试结果**: {'✅ 通过' if success else '❌ 失败'}

---

## 1. 角色生成

```json
{json.dumps(LOGS[1]['data'] if len(LOGS) > 1 else {}, indent=2, ensure_ascii=False)}
```

---

## 2. 回合记录

| 回合 | 压强 | Ω值 | 天气 | 事件 |
|-----|------|-----|------|------|
"""
    
    for t in turn_logs:
        report += f"| {t['turn']} | {t['pressure']} | {t['omega']} | {t['weather']} | {t['event']} |\n"
    
    report += """
---

## 3. 发现的问题

"""
    
    # 分析问题
    issues = []
    
    if not success:
        if turn_logs:
            final_omega = turn_logs[-1]['omega']
            issues.append(f"1. **未触发事件4**: 最终Ω={final_omega}，未达到15")
    
    # 检查Ω增长
    if len(turn_logs) > 1:
        omega_growth = turn_logs[-1]['omega'] - turn_logs[0]['omega']
        avg_growth = omega_growth / len(turn_logs)
        if avg_growth < 0.25:
            issues.append(f"2. **Ω增长偏慢**: 平均每回合{avg_growth:.2f}，建议提高BASE_OMEGA_INCREASE")
        elif avg_growth > 0.6:
            issues.append(f"2. **Ω增长过快**: 平均每回合{avg_growth:.2f}，可能过快触发事件")
    
    # 检查AI调用
    ai_calls = [l for l in LOGS if 'AI生成' in l['message']]
    if ai_calls:
        avg_time = sum([l.get('data', {}).get('duration', 0) for l in ai_calls]) / len(ai_calls)
        if avg_time > 15:
            issues.append(f"3. **AI响应慢**: 平均{avg_time:.1f}s，可能影响游戏体验")
    
    if issues:
        report += '\n'.join(f"{i+1}. {issue}" for i, issue in enumerate(issues))
    else:
        report += "未发现明显问题。"
    
    report += """

---

## 4. 建议

"""
    
    suggestions = [
        "**Ω增长调优**: 根据测试数据调整BASE_OMEGA_INCREASE",
        "**事件阈值**: 如事件4触发过晚，可降低阈值或提高增长",
        "**AI优化**: 如AI响应慢，考虑缓存或预生成",
        "**平衡性**: 确保玩家能在36回合内体验完整剧情"
    ]
    
    report += '\n'.join(f"{i+1}. {s}" for i, s in enumerate(suggestions))
    
    report += """

---

## 5. 完整日志

<details>
<summary>点击查看完整日志</summary>

```json
"""
    
    report += json.dumps(LOGS, indent=2, ensure_ascii=False)
    
    report += """
```

</details>
"""
    
    with open('testlog.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    log("✅ 报告已保存到 testlog.md")
    return report

def main():
    """主测试流程"""
    try:
        # 启动服务器
        server_proc = start_server()
        
        # 测试1: 创建游戏
        if not test_create_game():
            log("❌ 角色生成测试失败")
            return False
        
        # 测试2: 回合流程
        success, turn_logs = test_turn_flow(target_turn=50)
        
        # 生成报告
        generate_report(success, turn_logs)
        
        # 如果成功，再跑一次记录详细日志
        if success:
            log("=" * 60)
            log("【第二轮测试】记录详细日志")
            log("=" * 60)
            # 可以在这里添加第二轮测试
        
        return success
        
    except Exception as e:
        log(f"❌ 测试出错: {str(e)}")
        import traceback
        log(traceback.format_exc())
        return False
    finally:
        # 清理
        os.system("pkill -f 'node dist/src/server' 2>/dev/null")

if __name__ == '__main__':
    success = main()
    print(f"\n{'='*60}")
    print(f"测试{'通过' if success else '失败'}")
    print(f"{'='*60}")
    exit(0 if success else 1)
