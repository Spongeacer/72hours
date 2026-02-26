#!/usr/bin/env node
/**
 * 完整游戏流程测试 - 从角色生成到事件4
 * 记录每个回合的详细日志
 */

const http = require('http');
const fs = require('fs');

const HOST = 'localhost';
const PORT = 3000;
const API_BASE = `http://${HOST}:${PORT}/api`;

// 日志数组
const logs = [];

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, message, data };
  logs.push(entry);
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

// HTTP请求封装
function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// 等待函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主测试流程
async function runTest() {
  log('=== 72Hours 完整流程测试开始 ===');
  
  let gameId = null;
  let turnCount = 0;
  let storyEvent = 0;
  let maxTurns = 50; // 最多测试50回合
  
  try {
    // 步骤1: 创建游戏
    log('步骤1: 创建游戏');
    const createRes = await request('/games', 'POST', {});
    
    if (!createRes.success) {
      throw new Error(`创建游戏失败: ${createRes.error?.message}`);
    }
    
    gameId = createRes.data.gameId;
    const player = createRes.data.player;
    const bondedNPCs = createRes.data.bondedNPCs;
    
    log('游戏创建成功', {
      gameId,
      player: {
        identityType: player.identityType,
        identityName: player.identity.name,
        obsession: player.obsession,
        traits: player.traits.map(t => t.id),
        states: player.states
      },
      initialNPCs: bondedNPCs.map(n => ({ name: n.name, isUnlocked: n.isUnlocked })),
      opening: createRes.data.opening
    });
    
    // 步骤2: 回合循环
    log('步骤2: 开始回合循环');
    
    while (turnCount < maxTurns) {
      turnCount++;
      
      // 获取当前状态
      const stateRes = await request(`/games/${gameId}/state`);
      if (!stateRes.success) {
        log(`回合${turnCount}: 获取状态失败`, stateRes.error);
        break;
      }
      
      const { turn, pressure, omega, weather, isGameOver } = stateRes.data;
      
      // 获取AI Prompt
      const promptRes = await request(`/games/${gameId}/ai-prompt`);
      const unlockedNPCs = promptRes.data?.prompt?.match(/在场者】(.+)/)?.[1] || '无';
      
      // 记录回合日志
      const turnLog = {
        turn,
        pressure: Math.round(pressure * 100) / 100,
        omega: Math.round(omega * 100) / 100,
        weather,
        unlockedNPCs,
        storyEvent
      };
      
      // 检查事件触发
      if (omega >= 5 && storyEvent < 2) {
        storyEvent = 2;
        turnLog.eventTriggered = '事件2: 解锁第5-8个NPC';
        log(`回合${turn}: 触发事件2！`, turnLog);
      } else if (omega >= 10 && storyEvent < 3) {
        storyEvent = 3;
        turnLog.eventTriggered = '事件3: 解锁第9-10个NPC + 历史人物';
        log(`回合${turn}: 触发事件3！`, turnLog);
      } else if (omega >= 15 && storyEvent < 4) {
        storyEvent = 4;
        turnLog.eventTriggered = '事件4: 最终阶段';
        log(`回合${turn}: 触发事件4！`, turnLog);
        log('=== 已触发事件4，测试完成 ===');
        break;
      } else {
        log(`回合${turn}`, turnLog);
      }
      
      // 执行回合
      const turnRes = await request(`/games/${gameId}/turns`, 'POST', {
        choice: { id: 'explore', text: '探索周围环境' }
      });
      
      if (!turnRes.success) {
        log(`回合${turnCount}: 执行回合失败`, turnRes.error);
        break;
      }
      
      if (turnRes.data?.gameOver) {
        log('游戏结束', turnRes.data.gameOver);
        break;
      }
      
      // 短暂延迟避免请求过快
      await sleep(100);
    }
    
    // 步骤3: 生成测试报告
    log('步骤3: 生成测试报告');
    
    const report = generateReport(logs, turnCount, storyEvent);
    fs.writeFileSync('testlog.md', report);
    log('测试报告已保存到 testlog.md');
    
  } catch (error) {
    log('测试出错', { error: error.message, stack: error.stack });
  }
}

// 生成测试报告
function generateReport(logs, totalTurns, finalStoryEvent) {
  const now = new Date().toISOString();
  
  let report = `# 72Hours 完整流程测试报告

**测试时间**: ${now}
**总回合数**: ${totalTurns}
**最终事件阶段**: ${finalStoryEvent}

---

## 测试流程

`;
  
  // 游戏创建信息
  const createLog = logs.find(l => l.message.includes('游戏创建成功'));
  if (createLog) {
    report += `### 角色生成

- **身份类型**: ${createLog.data.player.identityType}
- **身份名称**: ${createLog.data.player.identityName}
- **执念**: ${createLog.data.player.obsession}
- **特质**: ${createLog.data.player.traits.join(', ')}
- **初始状态**: 恐惧${createLog.data.player.states.fear}/攻击${createLog.data.player.states.aggression}/饥饿${createLog.data.player.states.hunger}
- **初始NPC**: ${createLog.data.initialNPCs.map(n => n.name).join(', ')}

### 开场叙事

${createLog.data.opening}

---

`;
  }
  
  // 回合日志
  report += `### 回合记录

| 回合 | 压强 | Ω值 | 天气 | 在场NPC | 事件 |
|-----|------|-----|------|---------|------|
`;
  
  logs.filter(l => l.message.startsWith('回合')).forEach(l => {
    const d = l.data;
    const event = d.eventTriggered ? d.eventTriggered.replace('事件', 'E') : '-';
    report += `| ${d.turn} | ${d.pressure} | ${d.omega} | ${d.weather} | ${d.unlockedNPCs.substring(0, 20)}... | ${event} |
`;
  });
  
  report += `
---

## 问题与建议

### 发现的问题

`;
  
  // 分析问题
  const issues = [];
  
  if (finalStoryEvent < 4) {
    issues.push(`1. **未触发事件4**: 测试在${totalTurns}回合结束，但未达到事件4（Ω≥15）。可能是Ω增长过慢或回合数限制。`);
  }
  
  const omegaLogs = logs.filter(l => l.data?.omega);
  if (omegaLogs.length > 0) {
    const firstOmega = omegaLogs[0].data.omega;
    const lastOmega = omegaLogs[omegaLogs.length - 1].data.omega;
    const avgGrowth = (lastOmega - firstOmega) / omegaLogs.length;
    
    if (avgGrowth < 0.25) {
      issues.push(`2. **Ω增长偏慢**: 平均每回合增长${avgGrowth.toFixed(2)}，建议检查BASE_OMEGA_INCREASE配置。`);
    }
  }
  
  if (issues.length === 0) {
    report += '1. **无明显问题**: 测试流程正常完成。\n';
  } else {
    report += issues.join('\n') + '\n';
  }
  
  report += `
### 建议

1. **Ω增长调优**: 当前基础增长+0.3，如果希望更快触发事件，可以提高到+0.4或+0.5。

2. **事件触发可视化**: 建议在游戏界面显示当前Ω值和下一个事件阈值，让玩家有目标感。

3. **NPC解锁提示**: 事件触发时应有明显的叙事提示，告知玩家新角色出现。

4. **压强与Ω的联动**: 当前高压只影响Ω增长倍率，可以考虑高压直接加速事件触发。

5. **测试覆盖**: 建议增加更多测试场景（不同身份、不同选择策略）来验证平衡性。

---

## 原始日志

<details>
<summary>点击查看完整日志</summary>

\`\`\`json
${JSON.stringify(logs, null, 2)}
\`\`\`

</details>
`;
  
  return report;
}

// 启动测试
runTest().then(() => {
  console.log('\n测试完成');
  process.exit(0);
}).catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
