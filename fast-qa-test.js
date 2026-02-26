#!/usr/bin/env node
/**
 * 72Hours 快速72回合QA测试脚本 (Mock AI版本)
 * 使用模拟AI响应，快速验证游戏流程
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'localhost';
const PORT = 3000;

// 模拟叙事文本池
const mockNarratives = [
  "腊月深夜，煤油灯只剩黄豆大小的火苗。母亲坐在炕沿，针线在膝头布料上来回。",
  "窗外传来马蹄声，你握紧了被角。远处有火光，不是灯笼的颜色。",
  "教书先生在门外咳嗽，声音比往常更急促。他说：'外面不太平。'",
  "灶膛里的柴火噼啪作响，母亲没有抬头，只是把你往身后拉了拉。",
  "天还没亮，村里狗吠声此起彼伏。你数着，至少有三条不同的狗在叫。",
  "油灯突然灭了。母亲在黑暗中抓住你的手，她的掌心很烫。",
  "远处传来钟声，不是寺庙的晨钟，是铜锣在急促地敲。",
  "你透过窗缝看见火把在移动，像一条火龙在村外游走。",
  "母亲从箱底摸出一个布包，里面是你从未见过的银元。",
  "教书先生的影子在窗纸上晃了很久，最后他说：'我得走了。'",
  "你听见隔壁老张家有女人在哭，声音被什么东西捂住了。",
  "天快亮了，但没有人去开门。整个村子像一座坟墓。",
  "母亲开始收拾细软，动作很快，但你看见她的手在抖。",
  "有人敲门，三长两短。母亲没有动，你也没有动。",
  "窗外飘进来一股烟味，不是炊烟，是什么东西在燃烧。",
  "教书先生回来了，他的长衫上沾着泥和血。",
  "你数了数家里的米，只够三天。母亲说你吃，她不饿。",
  "远处有马蹄声，这次更近了，像是从村东头传来的。",
  "母亲把你拉到地窖口，说：'无论听见什么，别出声。'",
  "你在地窖里数着自己的心跳，数到一千的时候，上面安静了。"
];

const mockChoices = [
  [{ id: 1, text: "你沉默地看着母亲，手按在炕沿上" },
   { id: 2, text: "你开口说话，声音比想象中更沙哑" },
   { id: 3, text: "你转身看向窗外，火光映红了半边天" }],
  [{ id: 1, text: "你握紧母亲的手，感受她掌心的温度" },
   { id: 2, text: "你站起身，想去窗边看看情况" },
   { id: 3, text: "你低头不语，听着外面的动静" }],
  [{ id: 1, text: "你问教书先生发生了什么事" },
   { id: 2, text: "你让母亲先进里屋躲一躲" },
   { id: 3, text: "你拿起墙角的木棍，站在门边" }]
];

// 简单的HTTP请求封装
function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// 格式化时间
function formatTime() { return new Date().toISOString().split('T')[1].split('.')[0]; }
function log(message) { console.log(`[${formatTime()}] ${message}`); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// 主测试流程
async function runFastTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       72Hours 快速72回合QA测试 (Mock AI模式)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const turnData = [];
  const errors = [];
  let gameId = null;
  
  try {
    // 步骤1: 检查服务器
    log('步骤1: 检查服务器配置...');
    const configRes = await request('/api/config');
    if (!configRes.success) throw new Error('服务器配置检查失败');
    log(`  ✅ 服务器已就绪`);

    // 步骤2: 创建游戏（使用mock模式 - 不提供API key让服务器使用fallback）
    log('步骤2: 创建游戏...');
    const createRes = await request('/api/game/create', 'POST', {
      identity: 'scholar'
      // 不提供apiKey，服务器会使用mock响应
    });
    
    if (!createRes.success || !createRes.data.gameId) {
      throw new Error(`创建游戏失败: ${JSON.stringify(createRes)}`);
    }
    
    gameId = createRes.data.gameId;
    log(`  ✅ 游戏创建成功, ID: ${gameId.substring(0, 25)}...`);
    
    const identityTrait = createRes.data.player.traits.find(t => t.type === 'identity');
    log(`  📋 身份: ${identityTrait ? identityTrait.id : 'unknown'}`);
    log(`  📋 关联NPC: ${createRes.data.bondedNPCs.map(n => n.name).join(', ')}`);
    log(`  ✅ 返回数据结构完整`);

    // 步骤3: 执行72个回合
    log('');
    log('步骤3: 开始执行72个回合...');
    log('═══════════════════════════════════════════════════════════════');
    
    for (let turn = 1; turn <= 72; turn++) {
      try {
        // 生成回合
        const turnRes = await request(`/api/game/${gameId}/turn`, 'POST', {});
        
        if (!turnRes.success) {
          throw new Error(`回合 ${turn} 生成失败: ${turnRes.error?.message || '未知错误'}`);
        }
        
        // 验证数据结构
        if (!turnRes.data.narrative) throw new Error(`回合 ${turn} 缺少 narrative`);
        if (!turnRes.data.choices || !Array.isArray(turnRes.data.choices)) {
          throw new Error(`回合 ${turn} 缺少 choices 或格式错误`);
        }
        if (turnRes.data.choices.length === 0) throw new Error(`回合 ${turn} choices 为空`);
        
        // 验证选择格式
        for (let i = 0; i < turnRes.data.choices.length; i++) {
          const choice = turnRes.data.choices[i];
          if (!choice.id) throw new Error(`回合 ${turn} 选择 ${i} 缺少 id`);
          if (!choice.text) throw new Error(`回合 ${turn} 选择 ${i} 缺少 text`);
        }
        
        // 获取状态
        const state = turnRes.data.state || {};
        const pressure = state.pressure || 0;
        const omega = state.omega || 1.0;
        const turnNumber = state.turn || turn;
        
        // 记录数据
        turnData.push({
          turn: turnNumber,
          pressure: Math.round(pressure * 100) / 100,
          omega: typeof omega === 'number' ? omega.toFixed(2) : omega,
          narrativeSummary: turnRes.data.narrative.substring(0, 60).replace(/\n/g, ' ') + '...',
          choicesCount: turnRes.data.choices.length
        });
        
        // 每10回合输出进度
        if (turn % 10 === 0 || turn === 1 || turn === 72) {
          log(`  回合 ${turnNumber.toString().padStart(2)}/72 | 压强: ${Math.round(pressure).toString().padStart(2)} | Ω: ${typeof omega === 'number' ? omega.toFixed(2) : omega} | ${turnRes.data.narrative.substring(0, 35)}...`);
        }
        
        // 提交选择
        const randomChoice = turnRes.data.choices[Math.floor(Math.random() * turnRes.data.choices.length)];
        const choiceRes = await request(`/api/game/${gameId}/turn`, 'POST', {
          choice: { id: randomChoice.id, text: randomChoice.text }
        });
        
        if (!choiceRes.success) {
          throw new Error(`回合 ${turn} 选择提交失败: ${choiceRes.error?.message || '未知错误'}`);
        }
        
        // 检查游戏结束
        if (choiceRes.data.gameOver) {
          log(`  ⚠️ 游戏在第 ${turn} 回合结束 (${choiceRes.data.gameOver.type})`);
          break;
        }
        
        await sleep(50); // 短暂延迟
        
      } catch (turnError) {
        errors.push({ turn, error: turnError.message });
        log(`  ❌ 回合 ${turn} 错误: ${turnError.message}`);
        if (errors.length >= 5) throw new Error('错误次数过多，测试终止');
      }
    }
    
    log('═══════════════════════════════════════════════════════════════\n');
    
    // 步骤4: 获取最终状态
    log('步骤4: 获取最终游戏状态...');
    const finalStateRes = await request(`/api/game/${gameId}/state`);
    if (!finalStateRes.success) throw new Error('获取最终状态失败');
    
    const finalState = finalStateRes.data.state;
    log(`  ✅ 最终状态获取成功`);
    log(`  📊 完成回合: ${finalState.turn}/72`);
    log(`  📊 最终压强: ${Math.round(finalState.pressure * 100) / 100}`);
    log(`  📊 最终Ω值: ${typeof finalState.omega === 'number' ? finalState.omega.toFixed(2) : finalState.omega}`);
    log(`  📊 游戏结束: ${finalState.isGameOver ? '是' : '否'}`);
    
    // 步骤5: 获取故事记录
    log('');
    log('步骤5: 获取故事记录...');
    const storyRes = await request(`/api/game/${gameId}/story`);
    if (!storyRes.success) throw new Error('获取故事记录失败');
    log(`  ✅ 故事记录获取成功`);
    log(`  📖 历史记录数: ${storyRes.data.history?.length || 0}`);
    
    // 生成报告
    log('');
    log('═══════════════════════════════════════════════════════════════');
    log('                    测试报告');
    log('═══════════════════════════════════════════════════════════════');
    
    const completedTurns = finalState.turn;
    const testPassed = completedTurns >= 72 && errors.length === 0;
    
    console.log();
    console.log(`✅ 测试状态: ${testPassed ? '通过' : '未通过'}`);
    console.log(`📊 完成回合: ${completedTurns}/72`);
    console.log(`📊 错误次数: ${errors.length}`);
    console.log(`📊 最终压强: ${Math.round(finalState.pressure * 100) / 100}`);
    console.log(`📊 最终Ω值: ${typeof finalState.omega === 'number' ? finalState.omega.toFixed(2) : finalState.omega}`);
    
    // 关键回合数据样本
    console.log();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    关键回合数据样本');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const sampleTurns = [1, 10, 20, 30, 40, 50, 60, 70, 72].filter(t => t <= completedTurns);
    console.log();
    console.log('| 回合 | 压强  | Ω值  | 叙事摘要');
    console.log('|------|-------|------|----------------------------------------');
    
    for (const turnNum of sampleTurns) {
      const data = turnData.find(d => d.turn === turnNum);
      if (data) {
        console.log(`| ${data.turn.toString().padStart(3)} | ${data.pressure.toString().padStart(5)} | ${data.omega} | ${data.narrativeSummary.substring(0, 38)}`);
      }
    }
    
    // 错误详情
    if (errors.length > 0) {
      console.log();
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('                    错误详情');
      console.log('═══════════════════════════════════════════════════════════════');
      errors.forEach((err, idx) => console.log(`  ${idx + 1}. 回合 ${err.turn}: ${err.error}`));
    }
    
    // 保存详细日志
    const logContent = generateTestLog({ gameId, testPassed, completedTurns, finalState, turnData, errors, sampleTurns });
    const logPath = path.join(__dirname, 'qa-test-result.md');
    fs.writeFileSync(logPath, logContent);
    log('');
    log(`📝 详细测试日志已保存: ${logPath}`);
    
    return testPassed;
    
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`);
    errors.push({ turn: 'N/A', error: error.message });
    return false;
  }
}

// 生成测试日志
function generateTestLog(data) {
  const { gameId, testPassed, completedTurns, finalState, turnData, errors, sampleTurns } = data;
  
  let log = `# 72Hours 完整72回合QA测试报告\n\n`;
  log += `## 测试概要\n\n`;
  log += `- **测试时间**: ${new Date().toISOString()}\n`;
  log += `- **测试状态**: ${testPassed ? '✅ 通过' : '❌ 未通过'}\n`;
  log += `- **游戏ID**: ${gameId}\n`;
  log += `- **完成回合**: ${completedTurns}/72\n`;
  log += `- **错误次数**: ${errors.length}\n\n`;
  
  log += `## 最终状态\n\n`;
  log += `| 指标 | 值 |\n|------|-----|\n`;
  log += `| 完成回合 | ${completedTurns} |\n`;
  log += `| 最终压强 | ${Math.round(finalState.pressure * 100) / 100} |\n`;
  log += `| 最终Ω值 | ${typeof finalState.omega === 'number' ? finalState.omega.toFixed(2) : finalState.omega} |\n`;
  log += `| 游戏结束 | ${finalState.isGameOver ? '是' : '否'} |\n`;
  log += `| 天气 | ${finalState.weather} |\n\n`;
  
  log += `## 关键回合数据样本\n\n`;
  log += `| 回合 | 压强 | Ω值 | 叙事摘要 |\n|------|------|-----|----------|\n`;
  for (const turnNum of sampleTurns) {
    const d = turnData.find(t => t.turn === turnNum);
    if (d) log += `| ${d.turn} | ${d.pressure} | ${d.omega} | ${d.narrativeSummary} |\n`;
  }
  
  log += `\n## 完整回合数据\n\n`;
  log += `| 回合 | 压强 | Ω值 | 选择数 | 叙事摘要 |\n|------|------|-----|--------|----------|\n`;
  for (const d of turnData) {
    log += `| ${d.turn} | ${d.pressure} | ${d.omega} | ${d.choicesCount} | ${d.narrativeSummary.substring(0, 50)} |\n`;
  }
  
  if (errors.length > 0) {
    log += `\n## 错误详情\n\n| 回合 | 错误信息 |\n|------|----------|\n`;
    for (const err of errors) log += `| ${err.turn} | ${err.error} |\n`;
  }
  
  log += `\n## 结论\n\n${testPassed ? '✅ 测试通过：游戏成功完成72回合，所有API响应数据结构正确，无错误。' : '❌ 测试未通过：游戏未能完成72回合或存在错误。'}\n`;
  
  return log;
}

// 运行测试
runFastTest().then(success => {
  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  测试${success ? '通过' : '未通过'}，退出码: ${success ? 0 : 1}`);
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('测试执行错误:', err);
  process.exit(1);
});
