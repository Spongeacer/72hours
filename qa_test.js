#!/usr/bin/env node
/**
 * 72Hours QA测试脚本
 * 模拟前端交互，验证游戏流程
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;
const API_KEY = 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

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

// 测试日志
function log(step, message, data = null) {
  console.log(`[${step}] ${message}`);
  if (data) console.log('  数据:', JSON.stringify(data, null, 2).substring(0, 200));
}

// 主测试流程
async function runTests() {
  console.log('=== 72Hours QA测试开始 ===\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // 测试1: 获取服务器配置
    log('TEST-1', '获取服务器配置...');
    const config = await request('/api/config');
    if (config.success && typeof config.data.hasApiKey === 'boolean') {
      log('TEST-1', '✅ 通过 - 服务器配置接口正常');
      results.passed++;
    } else {
      throw new Error('配置接口返回格式错误');
    }

    // 测试2: 创建游戏
    log('TEST-2', '创建游戏...');
    const createRes = await request('/api/game/create', 'POST', {
      apiKey: API_KEY,
      identity: 'scholar',
      model: 'Pro/MiniMaxAI/MiniMax-M2.1'
    });
    
    if (!createRes.success || !createRes.data.gameId) {
      throw new Error('创建游戏失败: ' + JSON.stringify(createRes));
    }
    
    const gameId = createRes.data.gameId;
    log('TEST-2', `✅ 通过 - 游戏创建成功, ID: ${gameId}`);
    results.passed++;

    // 验证返回数据结构
    if (!createRes.data.player || !createRes.data.bondedNPCs || !createRes.data.opening) {
      throw new Error('创建游戏返回数据不完整');
    }
    log('TEST-2', '✅ 通过 - 返回数据结构完整');
    results.passed++;

    // 测试3: 执行回合（生成叙事和选择）
    log('TEST-3', '执行第1回合（生成叙事）...');
    const turn1Res = await request(`/api/game/${gameId}/turn`, 'POST', {});
    
    if (!turn1Res.success) {
      throw new Error('第1回合失败: ' + JSON.stringify(turn1Res));
    }
    
    if (!turn1Res.data.narrative || !turn1Res.data.choices || turn1Res.data.choices.length === 0) {
      throw new Error('第1回合返回数据不完整');
    }
    
    log('TEST-3', `✅ 通过 - 第1回合成功, 生成 ${turn1Res.data.choices.length} 个选择`);
    results.passed++;

    // 验证选择格式
    const choice = turn1Res.data.choices[0];
    if (!choice.id || !choice.text) {
      throw new Error('选择格式错误: 缺少id或text');
    }
    log('TEST-3', '✅ 通过 - 选择格式正确');
    results.passed++;

    // 测试4: 提交选择
    log('TEST-4', '提交选择...');
    const choiceRes = await request(`/api/game/${gameId}/turn`, 'POST', {
      choice: {
        id: choice.id,
        text: choice.text
      }
    });
    
    if (!choiceRes.success) {
      throw new Error('提交选择失败: ' + JSON.stringify(choiceRes));
    }
    
    log('TEST-4', '✅ 通过 - 选择提交成功');
    results.passed++;

    // 测试5: 获取游戏状态
    log('TEST-5', '获取游戏状态...');
    const stateRes = await request(`/api/game/${gameId}/state`);
    
    if (!stateRes.success || !stateRes.data.state) {
      throw new Error('获取状态失败');
    }
    
    const state = stateRes.data.state;
    if (typeof state.turn !== 'number' || typeof state.pressure !== 'number') {
      throw new Error('状态数据格式错误');
    }
    
    log('TEST-5', `✅ 通过 - 状态获取成功, 当前回合: ${state.turn}, 压强: ${state.pressure}`);
    results.passed++;

    // 测试6: 连续执行多个回合
    log('TEST-6', '连续执行5个回合...');
    for (let i = 0; i < 5; i++) {
      // 生成回合
      const turnRes = await request(`/api/game/${gameId}/turn`, 'POST', {});
      if (!turnRes.success) {
        throw new Error(`回合 ${i + 2} 生成失败`);
      }
      
      // 提交选择
      if (turnRes.data.choices && turnRes.data.choices.length > 0) {
        const c = turnRes.data.choices[0];
        const submitRes = await request(`/api/game/${gameId}/turn`, 'POST', {
          choice: { id: c.id, text: c.text }
        });
        if (!submitRes.success) {
          throw new Error(`回合 ${i + 2} 选择提交失败`);
        }
      }
    }
    log('TEST-6', '✅ 通过 - 连续5回合执行成功');
    results.passed++;

    // 测试7: 获取故事记录
    log('TEST-7', '获取故事记录...');
    const storyRes = await request(`/api/game/${gameId}/story`);
    
    if (!storyRes.success) {
      throw new Error('获取故事失败');
    }
    
    log('TEST-7', '✅ 通过 - 故事记录获取成功');
    results.passed++;

    // 测试8: 错误处理 - 无效游戏ID
    log('TEST-8', '测试错误处理（无效游戏ID）...');
    const invalidRes = await request('/api/game/invalid_id/state');
    if (!invalidRes.success && invalidRes.error && invalidRes.error.code === 'GAME_NOT_FOUND') {
      log('TEST-8', '✅ 通过 - 错误处理正确');
      results.passed++;
    } else {
      throw new Error('错误处理不正确');
    }

    // 测试9: 错误处理 - 无效身份
    log('TEST-9', '测试错误处理（无效身份）...');
    const invalidIdentityRes = await request('/api/game/create', 'POST', {
      apiKey: API_KEY,
      identity: 'invalid_identity'
    });
    if (!invalidIdentityRes.success && invalidIdentityRes.error) {
      log('TEST-9', '✅ 通过 - 无效身份错误处理正确');
      results.passed++;
    } else {
      throw new Error('无效身份错误处理不正确');
    }

    console.log('\n=== 测试完成 ===');
    console.log(`✅ 通过: ${results.passed}`);
    console.log(`❌ 失败: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n错误详情:');
      results.errors.forEach(e => console.log(`  - ${e}`));
    }

    return results.failed === 0;

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    results.failed++;
    results.errors.push(error.message);
    return false;
  }
}

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('测试执行错误:', err);
  process.exit(1);
});
