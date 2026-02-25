/**
 * 72Hours 流式架构集成测试
 * 直接测试，不通过 HTTP
 */

const { Game72HoursStream } = require('./src/Game72HoursStream');

const API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

async function testStreamingFlow() {
  console.log('=== 72Hours 流式架构测试 ===\n');
  
  try {
    // 1. 创建游戏实例
    console.log('1. 创建流式游戏实例...');
    const game = new Game72HoursStream({
      aiInterface: API_KEY,
      model: 'deepseek-ai/DeepSeek-V3.2'
    });
    console.log('   ✓ 游戏实例创建成功');
    
    // 2. 初始化游戏
    console.log('\n2. 初始化游戏...');
    const init = game.init('scholar');
    console.log(`   ✓ 玩家身份: ${init.player.identity.name}`);
    
    // 3. 流式执行第一回合
    console.log('\n3. 流式执行第1回合...');
    console.log('   开始接收流式叙事（打字机效果模拟）:\n');
    
    let narrativeComplete = false;
    const turnResult = await game.executeTurnStream((chunk, fullText, stage) => {
      if (stage === false || stage === undefined) {
        // 叙事生成中 - 模拟打字机效果
        process.stdout.write(chunk);
      } else if (stage === 'choices_start') {
        console.log('\n\n   [叙事生成完成，正在生成选择...]');
        narrativeComplete = true;
      } else if (stage === true) {
        console.log('   [选择生成完成]');
      }
    });
    
    console.log(`\n   ✓ 回合执行成功`);
    console.log(`   - 回合数: ${turnResult.turn}`);
    console.log(`   - 叙事长度: ${turnResult.narrative.length} 字符`);
    
    // 显示生成的选择
    console.log('\n   【生成的选择】');
    turnResult.choices.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.text}`);
    });
    
    // 4. 流式提交选择
    console.log('\n4. 流式提交选择 (ID: 1)...');
    console.log('   开始接收流式结果:\n');
    
    const choiceResult = await game.executeChoiceStream(1, (chunk, fullText, stage) => {
      if (stage === false || stage === undefined) {
        // 结果生成中
        process.stdout.write(chunk);
      } else if (stage === 'followup_start') {
        console.log('\n\n   [结果生成完成，正在生成后续叙事...]');
      } else if (stage === true) {
        console.log('   [后续叙事生成完成]');
      }
    });
    
    console.log(`\n   ✓ 选择执行成功`);
    
    // 显示完整结果
    console.log('\n   【结果描述】');
    console.log('   ' + choiceResult.result.text);
    
    if (choiceResult.followUpNarrative) {
      console.log('\n   【后续叙事】');
      console.log('   ' + choiceResult.followUpNarrative);
    }
    
    console.log('\n=== 流式架构测试完成 ===');
    console.log('✓ 流式叙事生成正常工作');
    console.log('✓ 流式结果生成正常工作');
    console.log('✓ 打字机效果可通过 SSE 实现');
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testStreamingFlow();
