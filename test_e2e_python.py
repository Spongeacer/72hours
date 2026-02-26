#!/usr/bin/env python3
"""
完整端到端测试 - 纯Python实现，包含服务器启动
"""

import subprocess
import time
import json
import http.client
import os
import signal

class GameTest:
    def __init__(self):
        self.server_proc = None
        self.game_id = None
        self.logs = []
        self.turn_records = []
        
    def log(self, msg, data=None):
        timestamp = time.strftime('%H:%M:%S')
        entry = {"time": timestamp, "msg": msg, "data": data}
        self.logs.append(entry)
        print(f"[{timestamp}] {msg}")
        if data:
            print(f"  {str(data)[:200]}")
        return entry
    
    def http_request(self, path, method='GET', body=None, timeout=60):
        """HTTP请求"""
        try:
            conn = http.client.HTTPConnection("localhost", 3000, timeout=timeout)
            headers = {"Content-Type": "application/json"}
            
            if body:
                body_json = json.dumps(body)
                conn.request(method, f"/api{path}", body=body_json, headers=headers)
            else:
                conn.request(method, f"/api{path}", headers=headers)
            
            resp = conn.getresponse()
            data = json.loads(resp.read().decode())
            conn.close()
            return data
        except Exception as e:
            return {"error": str(e)}
    
    def start_server(self):
        """启动服务器"""
        self.log("清理端口3000...")
        os.system("fuser -k 3000/tcp 2>/dev/null")
        time.sleep(2)
        
        self.log("启动Node服务器...")
        self.server_proc = subprocess.Popen(
            ['node', 'dist/src/server/index.js'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd='/root/.openclaw/workspace/72hours'
        )
        
        # 等待服务器就绪
        self.log("等待服务器就绪...")
        for i in range(30):
            time.sleep(1)
            try:
                result = self.http_request('/health', timeout=2)
                if result.get('success'):
                    self.log(f"✅ 服务器就绪 (PID: {self.server_proc.pid})")
                    return True
            except:
                pass
            
            # 检查服务器是否还在运行
            if self.server_proc.poll() is not None:
                stdout, _ = self.server_proc.communicate()
                self.log(f"❌ 服务器已退出", stdout.decode()[-500:] if stdout else "无输出")
                return False
        
        self.log("❌ 服务器启动超时")
        return False
    
    def test_create_game(self):
        """测试创建游戏"""
        self.log("="*60)
        self.log("【步骤1】创建游戏 - 角色随机生成")
        self.log("="*60)
        
        result = self.http_request('/games', 'POST', {})
        
        if not result.get('success'):
            self.log("❌ 创建失败", result)
            return False
        
        self.game_id = result['data']['gameId']
        player = result['data']['player']
        
        self.log(f"✅ 游戏创建成功: {self.game_id}")
        self.log("角色信息:", {
            "identity": player['identityType'],
            "obsession": player['obsession'],
            "traits": [t['id'] for t in player['traits']],
            "npcs": [n['name'] for n in result['data']['bondedNPCs']]
        })
        
        return True
    
    def test_turns(self, max_turns=45):
        """测试回合流程"""
        self.log("="*60)
        self.log(f"【步骤2】回合流程 - 最多{max_turns}回合")
        self.log("="*60)
        
        story_event = 0
        
        for turn_num in range(1, max_turns + 1):
            # 获取状态
            state = self.http_request(f'/games/{self.game_id}/state')
            if not state.get('success'):
                self.log(f"❌ 回合{turn_num}: 获取状态失败", state)
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
                self.turn_records.append({"turn": turn, "omega": round(omega,2), "event": event})
                self.log(f"回合{turn}: Ω={omega:.2f} - {event} 触发！")
                break
            
            self.turn_records.append({"turn": turn, "omega": round(omega,2), "pressure": round(pressure,2), "event": event or "-"})
            
            if turn_num % 3 == 0 or event:
                self.log(f"回合{turn}: Ω={omega:.2f}, 压强={pressure:.2f}, 天气={weather} {event or ''}")
            
            # 执行回合（调用AI）
            start = time.time()
            result = self.http_request(f'/games/{self.game_id}/turns', 'POST', {
                'choice': {'id': 'test', 'text': '测试'}
            }, timeout=60)
            duration = time.time() - start
            
            if result.get('data', {}).get('gameOver'):
                reason = result['data']['gameOver'].get('reason', '未知')
                self.log(f"⚠️ 游戏结束: {reason}")
                break
            
            if 'choices' in result.get('data', {}):
                choices = result['data']['choices']
                if turn_num % 5 == 0:
                    self.log(f"  AI生成{len(choices)}个选择 (耗时{duration:.1f}s)")
            
            time.sleep(0.5)
        
        return story_event >= 4
    
    def generate_report(self, success):
        """生成报告"""
        self.log("="*60)
        self.log("【步骤3】生成测试报告")
        self.log("="*60)
        
        report_lines = [
            "# 72Hours 完整端到端测试报告",
            "",
            f"**测试时间**: {time.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**测试结果**: {'✅通过' if success else '❌未完成'}",
            "",
            "## 回合记录",
            "",
            "| 回合 | Ω值 | 压强 | 事件 |",
            "|-----|-----|------|------|"
        ]
        
        for t in self.turn_records:
            report_lines.append(f"| {t['turn']} | {t['omega']} | {t.get('pressure', '-')} | {t['event']} |")
        
        report_lines.extend([
            "",
            "## 发现的问题",
            ""
        ])
        
        if not success:
            final_omega = self.turn_records[-1]['omega'] if self.turn_records else 0
            report_lines.append(f"1. **未触发事件4**: 最终Ω={final_omega}")
        else:
            report_lines.append("1. **测试通过**: 成功触发事件4")
        
        report_lines.extend([
            "",
            "## 建议",
            "",
            "1. 调整Ω增长参数",
            "2. 优化AI响应时间"
        ])
        
        report = "\n".join(report_lines)
        
        with open('/root/.openclaw/workspace/72hours/testlog.md', 'w') as f:
            f.write(report)
        
        self.log("✅ 报告已保存到 testlog.md")
    
    def run(self):
        """运行完整测试"""
        try:
            if not self.start_server():
                return False
            
            if not self.test_create_game():
                return False
            
            success = self.test_turns(max_turns=45)
            
            self.generate_report(success)
            
            return success
            
        finally:
            if self.server_proc:
                self.server_proc.terminate()
                try:
                    self.server_proc.wait(timeout=5)
                except:
                    self.server_proc.kill()
                self.log("服务器已停止")

if __name__ == '__main__':
    test = GameTest()
    success = test.run()
    print(f"\n{'='*60}")
    print(f"测试{'通过' if success else '未完成'}")
    print(f"{'='*60}")
    exit(0 if success else 1)
