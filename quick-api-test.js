#!/usr/bin/env node
/**
 * 72Hours API QA测试 - 快速验证
 * 验证API响应结构和基本流程
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

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

async function runQuickTest() {
  console.log('=== 72Hours API QA测试 ===\n');
  
  const results = {
    server: false,
    create: false,
    turnStructure: false,
    choiceStructure: false,
    stateStructure: false,
    story: false,
    errors: []
  };

  try {
    // 1. 检查服务器
    console.log('1. 检查服务器...');
    const config = await request('/api/config');
    if (config.success && typeof config.data.hasApiKey === 'boolean') {
      console.log('   ✅ 服务器运行正常');
      results.server = true;
    } else {
      throw new Error('服务器响应异常');
    }

    // 2. 创建游戏
    console.log('2. 创建游戏...');
    const createRes = await request('/api/game/create', 'POST', {
      identity: 'scholar'
    });
    
    if (!createRes.success || !createRes.data.gameId) {
      throw new Error('创建游戏失败: ' + JSON.stringify(createRes));
    }
    
    const gameId = createRes.data.gameId;
    console.log(`   ✅ 游戏创建成功: ${gameId.substring(0, 20)}...`);
    results.create = true;

    // 验证返回数据结构
    const requiredFields = ['gameId', 'player', 'bondedNPCs', 'opening', 'state'];
    const missingFields = requiredFields.filter(f => !createRes.data[f]);
    if (missingFields.length > 0) {
      throw new Error(`返回数据缺少字段: ${missingFields.join(', ')}`);
    }
    console.log('   ✅ 返回数据结构完整');

    // 3. 执行一个回合并验证结构
    console.log('3. 验证回合数据结构...');
    const turnRes = await request(`/api/game/${gameId}/turn`, 'POST', {});
    
    if (!turnRes.success) {
      throw new Error(`回合生成失败: ${turnRes.error?.message}`);
    }
    
    // 验证必要字段
    if (!turnRes.data.narrative) throw new Error('缺少 narrative');
    if (!turnRes.data.choices || !Array.isArray(turnRes.data.choices)) {
      throw new Error('缺少 choices 或格式错误');
    }
    if (!turnRes.data.state) throw new Error('缺少 state');
    
    console.log(`   ✅ 回合数据结构正确 (叙事长度: ${turnRes.data.narrative.length})`);
    console.log(`   ✅ 生成 ${turnRes.data.choices.length} 个选择`);
    results.turnStructure = true;

    // 4. 验证选择格式
    console.log('4. 验证选择格式...');
    for (let i = 0; i < turnRes.data.choices.length; i++) {
      const choice = turnRes.data.choices[i];
      if (!choice.id) throw new Error(`选择 ${i} 缺少 id`);
      if (!choice.text) throw new Error(`选择 ${i} 缺少 text`);
    }
    console.log('   ✅ 选择格式正确 (每个选择都有id和text)');
    results.choiceStructure = true;

    // 5. 验证状态结构
    console.log('5. 验证状态结构...');
    const state = turnRes.data.state;
    if (typeof state.turn !== 'number') throw new Error('state.turn 不是数字');
    if (typeof state.pressure !== 'number') throw new Error('state.pressure 不是数字');
    if (typeof state.omega !== 'number') throw new Error('state.omega 不是数字');
    console.log(`   ✅ 状态结构正确 (turn: ${state.turn}, pressure: ${state.pressure}, omega: ${state.omega.toFixed(2)})`);
    results.stateStructure = true;

    // 6. 提交选择
    console.log('6. 提交选择...');
    const choice = turnRes.data.choices[0];
    const choiceRes = await request(`/api/game/${gameId}/turn`, 'POST', {
      choice: { id: choice.id, text: choice.text }
    });
    
    if (!choiceRes.success) {
      throw new Error(`选择提交失败: ${choiceRes.error?.message}`);
    }
    console.log('   ✅ 选择提交成功');

    // 7. 获取故事记录
    console.log('7. 获取故事记录...');
    const storyRes = await request(`/api/game/${gameId}/story`);
    if (!storyRes.success) {
      throw new Error('获取故事记录失败');
    }
    console.log(`   ✅ 故事记录获取成功 (历史记录: ${storyRes.data.history?.length || 0})`);
    results.story = true;

    // 8. 错误处理测试
    console.log('8. 测试错误处理...');
    const invalidRes = await request('/api/game/invalid_id/state');
    if (!invalidRes.success && invalidRes.error?.code === 'GAME_NOT_FOUND') {
      console.log('   ✅ 错误处理正确 (无效游戏ID返回GAME_NOT_FOUND)');
    } else {
      console.log('   ⚠️ 错误处理可能有问题');
    }

    // 总结
    console.log('\n=== 测试结果 ===');
    const allPassed = Object.values(results).every(v => v === true || Array.isArray(v));
    console.log(`服务器状态: ${results.server ? '✅' : '❌'}`);
    console.log(`游戏创建: ${results.create ? '✅' : '❌'}`);
    console.log(`回合数据结构: ${results.turnStructure ? '✅' : '❌'}`);
    console.log(`选择格式: ${results.choiceStructure ? '✅' : '❌'}`);
    console.log(`状态结构: ${results.stateStructure ? '✅' : '❌'}`);
    console.log(`故事记录: ${results.story ? '✅' : '❌'}`);
    console.log(`\n总体结果: ${allPassed ? '✅ 通过' : '❌ 未通过'}`);
    
    return allPassed;

  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    return false;
  }
}

runQuickTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('测试执行错误:', err);
  process.exit(1);
});
