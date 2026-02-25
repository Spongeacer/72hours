/**
 * 选择后结果叙事测试
 * 
 * 使用方法：
 * node tests/choice_result_test.js YOUR_API_KEY
 */

const { Game72Hours } = require('../src/Game72Hours');

async function testChoiceResult() {
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.log('请提供硅基流动API key');
    return;
  }
  
  console.log('=== 选择后结果叙事测试 ===\n');
  
  const game = new Game72Hours({ aiInterface: apiKey });
  const init = game.init('scholar');
  
  console.log('身份：', init.player.identity.name);
  console.log('关联NPC：', init.bondedNPCs.map(n => n.name).join(', '));
  console.log();
  
  // 执行3个回合，每个回合选择后显示结果
  for (let i = 1; i <= 3; i++) {
    console.log(`\n========== 第${i}回合 ==========\n`);
    
    // 生成叙事和选择
    const turn = await game.executeTurn();
    
    console.log(`时间：${turn.context.scene.time} | 聚光灯：${turn.context.spotlight?.name}`);
    console.log('\n--- 场景叙事 ---');
    console.log(turn.narrative);
    
    console.log('\n--- 选择 ---');
    turn.choices.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.text}`);
    });
    
    // 选择第一个选项并生成结果
    const choice = turn.choices[0];
    console.log(`\n>>> 玩家选择：${choice.text}`);
    
    try {
      const result = await game.executeTurn(choice);
      
      console.log('\n--- 结果叙事 ---');
      console.log(result.result?.text || '（无结果）');
      
      if (result.result?.stateDelta) {
        console.log('\n--- 状态变化 ---');
        const delta = result.result.stateDelta;
        Object.entries(delta).forEach(([key, value]) => {
          const sign = value > 0 ? '+' : '';
          console.log(`  ${key}: ${sign}${value}`);
        });
      }
      
      if (result.result?.knotDelta) {
        console.log(`  关系: +${result.result.knotDelta}`);
      }
      
    } catch (error) {
      console.error('生成结果失败:', error.message);
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

testChoiceResult().catch(console.error);
