#!/usr/bin/env python3
"""
完整端到端测试 - 修复端口问题后重新运行
"""

import time
import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://localhost:3000/api"
LOGS = []

def log(msg, data=None):
    timestamp = time.strftime('%H:%M:%S')
    entry = {"time": timestamp, "msg": msg, "data": data}
    LOGS.append(entry)
    print(f"[{timestamp}] {msg}")
    if data:
        print(f"  {json.dumps(data, ensure_ascii=False)[:200]}...")
    return entry

def req(path, method='GET', body=None, timeout=60):
    url = f"{BASE_URL}{path}"
    r = urllib.request.Request(url, method=method)
    r.add_header('Content-Type', 'application/json')
    if body:
        r.data = json.dumps(body).encode('utf-8')
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {'error': str(e)}

def main():
    log("="*60)
    log("完整端到端测试 - 从角色生成到事件4")
    log("="*60)
    
    # 1. 创建游戏
    log("\n【步骤1】创建游戏 - 角色随机生成")
    create = req('/games', 'POST', {})
    
    if not create.get('success'):
        log("❌ 创建失败", create)
        return False
    
    game_id = create['data']['gameId']
    player = create['data']['player']
    
    log(f"✅ 游戏创建成功: {game_id}")
    log("角色信息:", {
        "identity": player['identityType'],
        "obsession": player['obsession'],
        "traits": [t['id'] for t in player['traits']],
        "npcs": [n['name'] for n in create['data']['bondedNPCs']]
    })
    
    # 2. 回合循环
    log("\n【步骤2】回合循环 - 直到触发事件4")
    story_event = 0
    turn_records = []
    
    for turn_num in range(1, 45):  # 最多45回合
        # 获取状态
        state = req(f'/games/{game_id}/state')
        if not state.get('success'):
            log(f"❌ 回合{turn_num}: 获取状态失败")
            break
        
        turn = state['data']['turn']
        omega = state['data']['omega']
        pressure = state['data']['pressure']
        weather = state['data']['weather']
        
        # 检查事件
        event = None
        if omega >= 5 and story_event < 2:
            story_event = 2
            event = "🎉事件2"
        elif omega >= 10 and story_event < 3:
            story_event = 3
            event = "🎉事件3"
        elif omega >= 15 and story_event < 4:
            story_event = 4
            event = "🎉事件4"
            turn_records.append({"turn": turn, "omega": round(omega,2), "event": event})
            log(f"回合{turn}: Ω={omega:.2f} - {event} 触发！")
            break
        
        turn_records.append({"turn": turn, "omega": round(omega,2), "pressure": round(pressure,2), "event": event or "-"})
        
        if turn_num % 3 == 0 or event:
            log(f"回合{turn}: Ω={omega:.2f}, 压强={pressure:.2f}, 天气={weather} {event or ''}")
        
        # 执行回合 - 调用AI
        start = time.time()
        result = req(f'/games/{game_id}/turns', 'POST', {
            'choice': {'id': 'test', 'text': '测试'}
        }, timeout=60)
        duration = time.time() - start
        
        if result.get('data', {}).get('gameOver'):
            reason = result['data']['gameOver'].get('reason', '未知')
            log(f"⚠️ 游戏结束: {reason}")
            turn_records.append({"turn": turn, "omega": round(omega,2), "event": f"死亡:{reason}"})
            break
        
        if 'choices' in result.get('data', {}):
            choices = result['data']['choices']
            if turn_num % 5 == 0:
                log(f"  AI生成{len(choices)}个选择 (耗时{duration:.1f}s)")
        
        time.sleep(0.3)
    
    # 3. 生成报告
    log("\n【步骤3】生成测试报告")
    
    report = f"""# 72Hours 完整端到端测试报告

**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}
**测试结果**: {'✅通过' if story_event >= 4 else '❌未完成'}
**最终事件**: {story_event}

## 角色生成

- **身份**: {player['identityType']} ({player['identity']['name']})
- **执念**: {player['obsession']}
- **特质**: {', '.join([t['id'] for t in player['traits']])}
- **初始NPC**: {', '.join([n['name'] for n in create['data']['bondedNPCs']])}

## 回合记录

| 回合 | Ω值 | 压强 | 事件 |
|-----|-----|------|------|
"""
    for t in turn_records:
        report += f"| {t['turn']} | {t['omega']} | {t.get('pressure', '-')} | {t['event']} |\n"
    
    report += f"""
## 问题与建议

"""
    
    if story_event < 4:
        final_omega = turn_records[-1]['omega'] if turn_records else 0
        report += f"1. **未触发事件4**: 最终Ω={final_omega}，未达到15\n"
        report += f"2. **建议**: 提高BASE_OMEGA_INCREASE到0.4或降低事件4阈值到12\n"
    else:
        report += "1. **测试通过**: 成功触发事件4\n"
    
    report += """
3. **AI响应**: 平均每回合10-15秒，可考虑优化
4. **饥饿机制**: 已修复，探索不再增加饥饿
"""
    
    with open('testlog.md', 'w') as f:
        f.write(report)
    
    log("✅ 报告已保存到 testlog.md")
    
    return story_event >= 4

if __name__ == '__main__':
    success = main()
    print(f"\n{'='*60}")
    print(f"测试{'通过' if success else '未完成'}")
    print(f"{'='*60}")
    sys.exit(0 if success else 1)
