#!/usr/bin/env node
/**
 * 72Hours 完整72回合QA测试脚本
 * 模拟前端交互，验证游戏能否完整运行72回合
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'localhost';
const PORT = 3000;
const API_KEY = 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

// 测试配置
const TARGET_TURNS = 72;
const TEST_IDENTITY = 'scholar';
const TEST_MODEL = 'Pro/MiniMaxAI/MiniMax-M2.1';

// 存储每回合数据
const turnData = [];
const errors = [];

// 简单的HTTP请求封装
function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 格式化时间
function formatTime() {
  return new Date().toISOString().split('T')[1].split('.')[0];
}

// 日志输出
function log(message) {
  console.log(`[${formatTime()}] ${message}`);
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主测试流程
async function runFullGameTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       72Hours 完整72回合QA测试                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  
  let gameId = null;
  
  try {
    // 步骤1: 检查服务器状态
    log('步骤1: 检查服务器配置...');
    const configRes = await request('/api/config');
    if (!configRes.success) {
      throw new Error('服务器配置检查失败');
    }
    log(`  ✅ 服务器已就绪 (API Key配置: ${configRes.data.hasApiKey})`);
    
    // 步骤2: 创建游戏
    log('步骤2: 创建游戏...');
    const createRes = await request('/api/game/create', 'POST', {
      apiKey: API_KEY,
      identity: TEST_IDENTITY,
      model: TEST_MODEL
    });
    
    if (!createRes.success || !createRes.data.gameId) {
      throw new Error(`创建游戏失败: ${JSON.stringify(createRes)}`);
    }
    
    gameId = createRes.data.gameId;
    log(`  ✅ 游戏创建成功, ID: ${gameId.substring(0, 20)}...`);
    const identityTrait = createRes.data.player.traits.find(t => t.type === 'identity');
    log(`  📋 身份: ${identityTrait ? identityTrait.id : 'unknown'}`);
    log(`  📋 关联NPC: ${createRes.data.bondedNPCs.map(n => n.name).join(', ')}`);
    
    // 验证返回数据结构
    const requiredFields = ['gameId', 'player', 'bondedNPCs', 'opening', 'state'];
    for (const field of requiredFields) {
      if (!createRes.data[field]) {
        throw new Error(`创建游戏返回数据缺少字段: ${field}`);
      }
    }
    log(`  ✅ 返回数据结构完整`);
    
    // 步骤3: 执行72个回合
    log('');
    log('步骤3: 开始执行72个回合...');
    log('═══════════════════════════════════════════════════════════════');
    
    for (let turn = 1; turn <= TARGET_TURNS; turn++) {
      try {
        // 3.1 生成叙事和选择
        const turnRes = await request(`/api/game/${gameId}/turn`, 'POST', {});
        
        if (!turnRes.success) {
          throw new Error(`回合 ${turn} 生成失败: ${turnRes.error?.message || '未知错误'}`);
        }
        
        // 验证数据结构
        if (!turnRes.data.narrative) {
          throw new Error(`回合 ${turn} 缺少 narrative`);
        }
        if (!turnRes.data.choices || !Array.isArray(turnRes.data.choices)) {
          throw new Error(`回合 ${turn} 缺少 choices 或格式错误`);
        }
        if (turnRes.data.choices.length === 0) {
          throw new Error(`回合 ${turn} choices 为空`);
        }
        
        // 验证每个选择的格式
        for (let i = 0; i < turnRes.data.choices.length; i++) {
          const choice = turnRes.data.choices[i];
          if (!choice.id) {
            throw new Error(`回合 ${turn} 选择 ${i} 缺少 id`);
          }
          if (!choice.text) {
            throw new Error(`回合 ${turn} 选择 ${i} 缺少 text`);
          }
        }
        
        // 获取状态信息
        const state = turnRes.data.state || {};
        const pressure = state.pressure || 0;
        const omega = state.omega || 1.0;
        const turnNumber = state.turn || turn;
        
        // 记录数据
        const narrativeSummary = turnRes.data.narrative.substring(0, 80).replace(/\n/g, ' ');
        turnData.push({
          turn: turnNumber,
          pressure,
          omega: typeof omega === 'number' ? omega.toFixed(2) : omega,
          narrativeSummary: narrativeSummary + (turnRes.data.narrative.length > 80 ? '...' : ''),
          choicesCount: turnRes.data.choices.length
        });
        
        // 每10回合输出一次进度
        if (turn % 10 === 0 || turn === 1 || turn === TARGET_TURNS) {
          log(`  回合 ${turnNumber.toString().padStart(2)}/72 | 压强: ${pressure.toString().padStart(2)} | Ω: ${typeof omega === 'number' ? omega.toFixed(2) : omega} | ${narrativeSummary.substring(0, 40)}...`);
        }
        
        // 3.2 提交选择（随机选择）
        const randomChoice = turnRes.data.choices[Math.floor(Math.random() * turnRes.data.choices.length)];
        
        const choiceRes = await request(`/api/game/${gameId}/turn`, 'POST', {
          choice: {
            id: randomChoice.id,
            text: randomChoice.text
          }
        });
        
        if (!choiceRes.success) {
          throw new Error(`回合 ${turn} 选择提交失败: ${choiceRes.error?.message || '未知错误'}`);
        }
        
        // 检查游戏是否已结束
        if (choiceRes.data.gameOver) {
          log(`  ⚠️ 游戏在第 ${turn} 回合结束 (${choiceRes.data.gameOver.type})`);
          break;
        }
        
        // 短暂延迟，避免请求过快
        await sleep(100);
        
      } catch (turnError) {
        errors.push({
          turn,
          error: turnError.message
        });
        log(`  ❌ 回合 ${turn} 错误: ${turnError.message}`);
        
        // 如果错误太多，提前终止
        if (errors.length >= 5) {
          throw new Error('错误次数过多，测试终止');
        }
      }
    }
    
    log('═══════════════════════════════════════════════════════════════');
    log('');
    
    // 步骤4: 获取最终状态
    log('步骤4: 获取最终游戏状态...');
    const finalStateRes = await request(`/api/game/${gameId}/state`);
    if (!finalStateRes.success) {
      throw new Error('获取最终状态失败');
    }
    
    const finalState = finalStateRes.data.state;
    log(`  ✅ 最终状态获取成功`);
    log(`  📊 完成回合: ${finalState.turn}/${TARGET_TURNS}`);
    log(`  📊 最终压强: ${finalState.pressure}`);
    log(`  📊 最终Ω值: ${typeof finalState.omega === 'number' ? finalState.omega.toFixed(2) : finalState.omega}`);
    log(`  📊 游戏结束: ${finalState.isGameOver ? '是' : '否'}`);
    
    // 步骤5: 获取故事记录
    log('');
    log('步骤5: 获取故事记录...');
    const storyRes = await request(`/api/game/${gameId}/story`);
    if (!storyRes.success) {
      throw new Error('获取故事记录失败');
    }
    log(`  ✅ 故事记录获取成功`);
    log(`  📖 历史记录数: ${storyRes.data.history?.length || 0}`);
    
    // 步骤6: 生成测试报告
    log('');
    log('═══════════════════════════════════════════════════════════════');
    log('                    测试报告');
    log('═══════════════════════════════════════════════════════════════');
    
    const completedTurns = finalState.turn;
    const testPassed = completedTurns >= TARGET_TURNS && errors.length === 0;
    
    console.log();
    console.log(`✅ 测试状态: ${testPassed ? '通过' : '未通过'}`);
    console.log(`📊 完成回合: ${completedTurns}/${TARGET_TURNS}`);
    console.log(`📊 错误次数: ${errors.length}`);
    console.log(`📊 最终压强: ${finalState.pressure}`);
    console.log(`📊 最终Ω值: ${typeof finalState.omega === 'number' ? finalState.omega.toFixed(2) : finalState.omega}`);
    
    // 输出关键回合数据样本
    console.log();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    关键回合数据样本');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const sampleTurns = [1, 10, 20, 30, 40, 50, 60, 70, 72].filter(t => t <= completedTurns);
    console.log();
    console.log('| 回合 | 压强 | Ω值  | 叙事摘要');
    console.log('|------|------|------|----------------------------------------');
    
    for (const turnNum of sampleTurns) {
      const data = turnData.find(d => d.turn === turnNum);
      if (data) {
        console.log(`| ${data.turn.toString().padStart(3)} | ${data.pressure.toString().padStart(3)}  | ${data.omega} | ${data.narrativeSummary.substring(0, 40)}`);
      }
    }
    
    // 输出错误详情
    if (errors.length > 0) {
      console.log();
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('                    错误详情');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log();
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. 回合 ${err.turn}: ${err.error}`);
      });
    }
    
    // 保存详细测试日志
    const logContent = generateTestLog({
      gameId,
      testPassed,
      completedTurns,
      finalState,
      turnData,
      errors,
      sampleTurns
    });
    
    const logPath = path.join(__dirname, 'qa-test-result.md');
    fs.writeFileSync(logPath, logContent);
    log('');
    log(`📝 详细测试日志已保存: ${logPath}`);
    
    return testPassed;
    
  } catch (error) {
    log(`❌ 测试失败: ${error.message}`);
    errors.push({
      turn: 'N/A',
      error: error.message
    });
    return false;
  }
}

// 生成测试日志
function generateTestLog(data) {
  const { gameId, testPassed, completedTurns, finalState, turnData, errors, sampleTurns } = data;
  
  let log = `# 72Hours 完整72回合QA测试报告

## 测试概要

- **测试时间**: ${new Date().toISOString()}
- **测试状态**: ${testPassed ? '✅ 通过' : '❌ 未通过'}
- **游戏ID**: ${gameId}
- **完成回合**: ${completedTurns}/72
- **错误次数**: ${errors.length}

## 最终状态

| 指标 | 值 |
|------|-----|
| 完成回合 | ${completedTurns} |
| 最终压强 | ${finalState.pressure} |
| 最终Ω值 | ${typeof finalState.omega === 'number' ? finalState.omega.toFixed(2) : finalState.omega} |
| 游戏结束 | ${finalState.isGameOver ? '是' : '否'} |
| 天气 | ${finalState.weather} |

## 关键回合数据样本

| 回合 | 压强 | Ω值 | 叙事摘要 |
|------|------|-----|----------|
`;

  for (const turnNum of sampleTurns) {
    const d = turnData.find(t => t.turn === turnNum);
    if (d) {
      log += `| ${d.turn} | ${d.pressure} | ${d.omega} | ${d.narrativeSummary} |\n`;
    }
  }

  log += `
## 完整回合数据

| 回合 | 压强 | Ω值 | 选择数 | 叙事摘要 |
|------|------|-----|--------|----------|
`;

  for (const d of turnData) {
    log += `| ${d.turn} | ${d.pressure} | ${d.omega} | ${d.choicesCount} | ${d.narrativeSummary.substring(0, 50)}${d.narrativeSummary.length > 50 ? '...' : ''} |\n`;
  }

  if (errors.length > 0) {
    log += `
## 错误详情

| 回合 | 错误信息 |
|------|----------|
`;
    for (const err of errors) {
      log += `| ${err.turn} | ${err.error} |\n`;
    }
  }

  log += `
## 结论

${testPassed 
  ? '✅ 测试通过：游戏成功完成72回合，所有API响应数据结构正确，无错误。' 
  : '❌ 测试未通过：游戏未能完成72回合或存在错误。'}
`;

  return log;
}

// 运行测试
runFullGameTest().then(success => {
  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  测试${success ? '通过' : '未通过'}，退出码: ${success ? 0 : 1}`);
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('测试执行错误:', err);
  process.exit(1);
});
