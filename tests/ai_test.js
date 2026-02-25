/**
 * AI叙事测试脚本
 * 
 * 使用方法：
 * node tests/ai_test.js YOUR_API_KEY
 */

const { Game72Hours } = require('../src/Game72Hours');

async function testAI() {
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.log('请提供硅基流动API key:');
    console.log('node tests/ai_test.js sk-xxxxxxxx');
    return;
  }
  
  console.log('=== 72Hours AI叙事测试 ===\n');
  
  // 创建游戏实例，传入API key
  const game = new Game72Hours({
    aiInterface: apiKey
  });
  
  // 初始化
  const init = game.init('scholar');
  
  console.log('身份：', init.player.identity.name);
  console.log('执念：', init.player.obsession);
  console.log('关联NPC：', init.bondedNPCs.map(n => n.name).join(', '));
  console.log('\n' + init.opening + '\n');
  
  // 运行3个回合测试AI
  for (let i = 1; i <= 3; i++) {
    console.log(`\n========== 第${i}回合 ==========\n`);
    
    try {
      const turn = await game.executeTurn();
      
      console.log(`时间：${turn.context.scene.time}`);
      console.log(`天气：${turn.context.scene.weather}`);
      console.log(`压强：${turn.context.scene.pressure} | Ω：${turn.context.scene.omega}`);
      console.log(`聚光灯：${turn.context.spotlight?.name || '无'}`);
      
      console.log('\n--- AI生成叙事 ---');
      console.log(turn.narrative);
      
      console.log('\n--- AI生成选择 ---');
      turn.choices.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.text}`);
      });
      
    } catch (error) {
      console.error('AI生成失败:', error.message);
      console.log('使用占位叙事...');
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

testAI().catch(console.error);
