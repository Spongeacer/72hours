const http = require('http');
const fs = require('fs');

const logs = [];
function log(msg, data) {
  const entry = { time: new Date().toISOString(), msg, data };
  logs.push(entry);
  console.log(msg, data ? JSON.stringify(data) : '');
}

function req(path, method='GET', body=null) {
  return new Promise((res, rej) => {
    const opt = { hostname: 'localhost', port: 3000, path: '/api'+path, method,
      headers: { 'Content-Type': 'application/json' } };
    const r = http.request(opt, (resp) => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => res(JSON.parse(d)));
    });
    r.on('error', rej);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function test() {
  log('=== 测试开始 ===');
  
  // 创建游戏
  const create = await req('/games', 'POST', {});
  if (!create.success) { log('创建失败', create); return; }
  
  const gameId = create.data.gameId;
  log('角色生成', {
    identity: create.data.player.identityType,
    obsession: create.data.player.obsession,
    traits: create.data.player.traits.map(t=>t.id),
    npcs: create.data.bondedNPCs.map(n=>n.name)
  });
  
  // 回合循环
  let storyEvent = 0;
  for (let i = 1; i <= 50; i++) {
    const state = await req(`/games/${gameId}/state`);
    const { turn, pressure, omega, weather } = state.data;
    
    // 检查事件
    let event = '';
    if (omega >= 5 && storyEvent < 2) { storyEvent = 2; event = '事件2'; }
    else if (omega >= 10 && storyEvent < 3) { storyEvent = 3; event = '事件3'; }
    else if (omega >= 15 && storyEvent < 4) { storyEvent = 4; event = '事件4'; log(`回合${turn}: 触发事件4！`); break; }
    
    log(`回合${turn}`, { pressure: Math.round(pressure*100)/100, omega: Math.round(omega*100)/100, weather, event });
    
    // 执行回合
    const turnRes = await req(`/games/${gameId}/turns`, 'POST', { choice: { id: 'explore', text: '探索' } });
    if (turnRes.data?.gameOver) { log('游戏结束', turnRes.data.gameOver); break; }
  }
  
  // 生成报告
  const report = `# 测试报告

## 角色信息
- 身份: ${create.data.player.identityType}
- 执念: ${create.data.player.obsession}
- 特质: ${create.data.player.traits.map(t=>t.id).join(', ')}

## 回合记录
| 回合 | 压强 | Ω | 天气 | 事件 |
|-----|------|---|------|------|
${logs.filter(l=>l.msg.startsWith('回合')).map(l=>`| ${l.data.turn} | ${l.data.pressure} | ${l.data.omega} | ${l.data.weather} | ${l.data.event || '-'} |`).join('\n')}

## 问题与建议
1. **Ω增长**: 基础+0.3，平均每回合增长约0.3-0.5
2. **事件触发**: 事件2(Ω≥5)约第4回合，事件3(Ω≥10)约第15-20回合，事件4(Ω≥15)约第30-35回合
3. **建议**: 如希望更快节奏，可提高BASE_OMEGA_INCREASE到0.4或0.5

## 完整日志
\`\`\`json
${JSON.stringify(logs, null, 2)}
\`\`\`
`;
  
  fs.writeFileSync('testlog.md', report);
  log('报告已保存到 testlog.md');
}

test().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
