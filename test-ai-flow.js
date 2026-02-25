/**
 * 72Hours AI 调用完整流程测试
 * 使用真实的 SiliconFlow API
 */

const { Game72Hours } = require('./src/Game72Hours');

// 从环境变量或硬编码获取 API Key
const API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

async function testFullAIFlow() {
  console.log('=== 72Hours AI 完整流程测试 ===\n');
  
  try {
    // 1. 创建游戏实例
    console.log('1. 创建游戏实例...');
    const game = new Game72Hours({
      aiInterface: API_KEY,
      model: 'deepseek-ai/DeepSeek-V3.2'
    });
    console.log('   ✓ 游戏实例创建成功');
    console.log(`   - 使用模型: ${game.model}`);
    console.log(`   - AI接口: ${game.aiInterface ? '已配置' : '未配置'}`);
    
    // 2. 初始化游戏
    console.log('\n2. 初始化游戏 (身份: scholar)...');
    const init = game.init('scholar');
    console.log('   ✓ 游戏初始化成功');
    console.log(`   - 玩家身份: ${init.player.identity.name}`);
    console.log(`   - 玩家执念: ${init.player.obsession.description || init.player.obsession}`);
    console.log(`   - 关联NPC: ${init.bondedNPCs.map(n => n.name).join(', ')}`);
    
    // 3. 显示开场叙事
    console.log('\n3. 开场叙事:');
    console.log('   ' + init.opening.split('\n').join('\n   '));
    
    // 4. 执行第一回合（调用 AI 生成叙事）
    console.log('\n4. 执行第1回合（调用 AI 生成叙事）...');
    console.log('   等待 AI 响应...');
    const turn1 = await game.executeTurn();
    
    if (turn1.error) {
      console.error('   ✗ 回合执行失败:', turn1.error);
      return;
    }
    
    console.log('   ✓ 回合执行成功');
    console.log(`   - 回合数: ${turn1.turn}`);
    console.log(`   - 场景: ${turn1.context.scene.time}, ${turn1.context.scene.weather}`);
    console.log(`   - 环境压强: ${turn1.context.scene.pressure}/100`);
    console.log(`   - 全局因子: Ω ${turn1.context.scene.omega}`);
    
    // 显示 AI 生成的叙事
    console.log('\n   【AI 生成的叙事】');
    console.log('   ' + turn1.narrative.split('\n').join('\n   '));
    
    // 显示 AI 生成的选择
    console.log('\n   【AI 生成的选择】');
    turn1.choices.forEach((choice, idx) => {
      console.log(`   ${idx + 1}. ${choice.text}`);
    });
    
    // 5. 提交选择（调用 AI 生成结果）
    const selectedChoiceId = 1; // 选择第一个选项
    console.log(`\n5. 提交选择 (ID: ${selectedChoiceId})...`);
    console.log('   等待 AI 响应...');
    
    const choiceResult = await game.executeChoice(selectedChoiceId);
    
    if (choiceResult.error) {
      console.error('   ✗ 选择执行失败:', choiceResult.error);
      return;
    }
    
    console.log('   ✓ 选择执行成功');
    
    // 显示 AI 生成的结果
    console.log('\n   【AI 生成的结果】');
    console.log('   ' + choiceResult.result.text.split('\n').join('\n   '));
    
    // 显示后续叙事
    if (choiceResult.followUpNarrative) {
      console.log('\n   【AI 生成的后续叙事】');
      console.log('   ' + choiceResult.followUpNarrative.split('\n').join('\n   '));
    }
    
    // 显示状态变化
    if (choiceResult.stateChanges) {
      console.log('\n   【状态变化】');
      console.log('   ' + JSON.stringify(choiceResult.stateChanges));
    }
    
    // 6. 执行第二回合
    console.log('\n6. 执行第2回合（调用 AI 生成叙事）...');
    console.log('   等待 AI 响应...');
    const turn2 = await game.executeTurn();
    
    if (turn2.error) {
      console.error('   ✗ 回合执行失败:', turn2.error);
      return;
    }
    
    console.log('   ✓ 回合执行成功');
    console.log(`   - 回合数: ${turn2.turn}`);
    
    // 显示 AI 生成的叙事
    console.log('\n   【AI 生成的叙事】');
    console.log('   ' + turn2.narrative.split('\n').join('\n   '));
    
    // 显示 AI 生成的选择
    console.log('\n   【AI 生成的选择】');
    turn2.choices.forEach((choice, idx) => {
      console.log(`   ${idx + 1}. ${choice.text}`);
    });
    
    console.log('\n=== 测试完成 ===');
    console.log('✓ AI 调用流程正常运行');
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testFullAIFlow();
