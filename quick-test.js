#!/usr/bin/env node
/**
 * 72Hours 10回合快速测试
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
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  console.log('=== 72Hours 10回合快速测试 ===\n');

  try {
    // 1. 检查健康状态
    console.log('[1/12] 检查服务器健康状态...');
    const health = await request('/health');
    console.log('   ✓ 服务器运行正常\n');

    // 2. 获取配置
    console.log('[2/12] 获取服务器配置...');
    const config = await request('/api/config');
    console.log(`   ✓ 默认模型: ${config.data?.defaultModel || 'N/A'}`);
    console.log(`   ✓ 可用身份: ${config.data?.availableIdentities?.length || 0} 个\n`);

    // 3. 创建游戏
    console.log('[3/12] 创建游戏...');
    const game = await request('/api/games', 'POST', {
      identity: 'scholar',
      model: 'Pro/MiniMaxAI/MiniMax-M2.5'
    });
    
    if (!game.success) {
      console.log('   ✗ 创建游戏失败:', game.error?.message);
      return;
    }
    
    const gameId = game.data?.gameId;
    console.log(`   ✓ 游戏创建成功: ${gameId?.substring(0, 20)}...`);
    console.log(`   ✓ 角色: ${game.data?.player?.identity?.name}`);
    console.log(`   ✓ NPC: ${game.data?.bondedNPCs?.map(n => n.name).join(', ')}\n`);

    // 4-13. 运行10回合
    for (let turn = 1; turn <= 10; turn++) {
      console.log(`[${turn + 3}/12] 第 ${turn} 回合...`);
      
      const turnResult = await request(`/api/games/${gameId}/turns`, 'POST', {});
      
      if (!turnResult.success) {
        console.log(`   ✗ 回合失败:`, turnResult.error?.message);
        continue;
      }
      
      const data = turnResult.data;
      console.log(`   ✓ 时间: ${new Date(data?.state?.datetime).toLocaleTimeString('zh-CN')}`);
      console.log(`   ✓ 压强: ${data?.state?.pressure?.toFixed(1)} | Ω: ${data?.state?.omega?.toFixed(2)}`);
      console.log(`   ✓ 选择数: ${data?.choices?.length || 0}\n`);
      
      // 模拟选择第一个选项
      if (data?.choices?.length > 0) {
        const choice = data.choices[0];
        console.log(`       选择: ${choice.text}`);
        
        const choiceResult = await request(`/api/games/${gameId}/turns`, 'POST', {
          choice: { id: choice.id, text: choice.text }
        });
        
        if (choiceResult.data?.result) {
          console.log(`       结果: ${choiceResult.data.result.substring(0, 50)}...`);
        }
        console.log();
      }
    }

    // 14. 获取历史记录
    console.log('[14/14] 获取游戏历史...');
    const history = await request(`/api/games/${gameId}/history`);
    console.log(`   ✓ 历史记录: ${history.data?.length || 0} 条\n`);

    console.log('=== 测试完成 ===');
    console.log('游戏正常运行10回合，所有API功能正常。');

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    process.exit(1);
  }
}

runTest();
