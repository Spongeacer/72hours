#!/usr/bin/env python3
"""
完整游戏流程测试 - 从角色生成到事件4
"""

import subprocess
import time
import json
import urllib.request
import urllib.error

def log(msg, data=None):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    entry = {"timestamp": timestamp, "message": msg, "data": data}
    print(f"[{timestamp}] {msg}")
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    return entry

def request(path, method='GET', data=None):
    url = f'http://localhost:3000/api{path}'
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    if data:
        req.data = json.dumps(data).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {'error': str(e)}

def main():
    logs = []
    logs.append(log("=== 完整流程测试开始 ==="))
    
    # 创建游戏
    logs.append(log("创建游戏..."))
    create = request('/games', 'POST', {'identity': 'scholar'})
    
    if not create.get('success'):
        logs.append(log("创建失败", create))
        return logs
    
    game_id = create['data']['gameId']
    player = create['data']['player']
    
    logs.append(log("角色生成成功", {
        'gameId': game_id,
        'identity': player['identityType'],
        'identityName': player['identity']['name'],
        'obsession': player['obsession'],
        'traits': [t['id'] for t in player['traits']],
        'states': player['states'],
        'initialNPCs': [n['name'] for n in create['data']['bondedNPCs']]
    }))
    
    # 回合循环
    story_event = 0
    turn_logs = []
    
    for turn_num in range(1, 51):
        # 获取状态
        state = request(f'/games/{game_id}/state')
        if not state.get('success'):
            logs.append(log(f"回合{turn_num}: 获取状态失败", state))
            break
        
        turn = state['data']['turn']
        pressure = state['data']['pressure']
        omega = state['data']['omega']
        weather = state['data']['weather']
        
        # 检查事件触发
        event = ''
        if omega >= 5 and story_event < 2:
            story_event = 2
            event = '事件2'
        elif omega >= 10 and story_event < 3:
            story_event = 3
            event = '事件3'
        elif omega >= 15 and story_event < 4:
            story_event = 4
            event = '事件4'
            turn_logs.append({
                'turn': turn, 'pressure': round(pressure, 2), 'omega': round(omega, 2),
                'weather': weather, 'event': event
            })
            logs.append(log(f"回合{turn}: 触发事件4！", {'omega': omega}))
            break
        
        turn_logs.append({
            'turn': turn, 'pressure': round(pressure, 2), 'omega': round(omega, 2),
            'weather': weather, 'event': event
        })
        
        if turn_num % 5 == 0:
            logs.append(log(f"回合{turn}", {'omega': round(omega, 2), 'pressure': round(pressure, 2), 'event': event or '-'}))
        
        # 执行回合
        turn_res = request(f'/games/{game_id}/turns', 'POST', {
            'choice': {'id': 'explore', 'text': '探索周围环境'}
        })
        
        if turn_res.get('data', {}).get('gameOver'):
            logs.append(log("游戏结束", turn_res['data']['gameOver']))
            break
        
        time.sleep(0.1)
    
    # 生成报告
    logs.append(log("生成测试报告..."))
    
    report = f"""# 72Hours 完整流程测试报告

**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}
**总回合数**: {len(turn_logs)}
**最终事件阶段**: {story_event}

---

## 角色生成

| 属性 | 值 |
|-----|---|
| 身份类型 | {player['identityType']} |
| 身份名称 | {player['identity']['name']} |
| 执念 | {player['obsession']} |
| 特质 | {', '.join([t['id'] for t in player['traits']])} |
| 初始状态 | 恐惧{player['states']['fear']}/攻击{player['states']['aggression']}/饥饿{player['states']['hunger']} |
| 初始NPC | {', '.join([n['name'] for n in create['data']['bondedNPCs']])} |

---

## 回合记录

| 回合 | 压强 | Ω值 | 天气 | 事件 |
|-----|------|-----|------|------|
"""
    
    for t in turn_logs:
        report += f"| {t['turn']} | {t['pressure']} | {t['omega']} | {t['weather']} | {t['event'] or '-'} |\n"
    
    report += """
---

## 问题发现

"""
    
    issues = []
    if story_event < 4:
        issues.append(f"1. **未触发事件4**: 测试在{len(turn_logs)}回合结束，最终Ω={turn_logs[-1]['omega'] if turn_logs else 0}，未达到Ω≥15")
    
    avg_omega_growth = 0
    if len(turn_logs) > 1:
        total_growth = turn_logs[-1]['omega'] - turn_logs[0]['omega']
        avg_omega_growth = total_growth / len(turn_logs)
    
    if avg_omega_growth < 0.25:
        issues.append(f"2. **Ω增长偏慢**: 平均每回合增长{avg_omega_growth:.2f}，建议提高BASE_OMEGA_INCREASE")
    
    if issues:
        report += '\n'.join(issues)
    else:
        report += "无明显问题，测试流程正常完成。"
    
    report += """

---

## 建议

1. **Ω增长调优**: 当前基础+0.3，如希望更快节奏可提高到+0.4
2. **事件触发**: 事件2(Ω≥5)约第4回合，事件3(Ω≥10)约第15-20回合
3. **事件4时间**: 如触发较晚，建议降低阈值到12或提高基础增长

---

## 完整日志

```json
"""
    
    report += json.dumps(logs, indent=2, ensure_ascii=False)
    report += "\n```\n"
    
    with open('testlog.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    logs.append(log("报告已保存到 testlog.md"))
    return logs

if __name__ == '__main__':
    main()
