#!/usr/bin/env node
/**
 * 并发初始化模块单元测试
 */

const path = require('path');

// 设置测试环境
process.env.SILICONFLOW_API_KEY = 'sk-test-key';

// 模拟AI接口
class MockAI {
  async generate(prompt) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 根据提示词返回模拟结果
    if (prompt.includes('读书人')) {
      return '在知识中寻找救赎';
    } else if (prompt.includes('母亲')) {
      return '保护家人平安';
    } else if (prompt.includes('教书先生')) {
      return '传承文化火种';
    }
    return '在乱世中活下去';
  }
}

// 加载被测模块
const { Game72Hours } = require('./src/Game72Hours');
const { GAME_CONFIG } = require('./src/utils/Constants');

console.log('=== 并发初始化模块单元测试 ===\n');

// 测试1: 特质随机抽取
async function testTraitGeneration() {
  console.log('测试1: 特质随机抽取');
  
  const game = new Game72Hours({
    aiInterface: new MockAI(),
    config: { MAX_TURNS: 72 }
  });
  
  // 创建玩家（不调用init，直接测试特质生成）
  const { Player } = require('./src/agents/Player');
  const player = new Player('scholar');
  game.gameState.player = player;
  
  // 生成特质
  game.generatePlayerTraits();
  
  const personalityTraits = player.traits.filter(t => t.type === 'personality');
  console.log(`  ✅ 玩家特质数量: ${personalityTraits.length} (期望: 2-3)`);
  console.log(`  ✅ 特质列表: ${personalityTraits.map(t => t.id).join(', ')}`);
  
  // 验证特质数量
  if (personalityTraits.length < 2 || personalityTraits.length > 3) {
    console.log('  ❌ 特质数量不符合预期');
    return false;
  }
  
  // 验证特质不重复
  const traitIds = personalityTraits.map(t => t.id);
  const uniqueTraits = [...new Set(traitIds)];
  if (traitIds.length !== uniqueTraits.length) {
    console.log('  ❌ 特质有重复');
    return false;
  }
  
  console.log('  ✅ 特质不重复');
  return true;
}

// 测试2: NPC特质生成
async function testNPCTraitGeneration() {
  console.log('\n测试2: NPC特质生成');
  
  const game = new Game72Hours({
    aiInterface: new MockAI(),
    config: { MAX_TURNS: 72 }
  });
  
  const { NPC } = require('./src/agents/NPC');
  const npc = new NPC({ name: '测试NPC', baseMass: 3 });
  
  game.generateNPCTraits(npc);
  
  const personalityTraits = npc.traits.filter(t => t.type === 'personality');
  console.log(`  ✅ NPC特质数量: ${personalityTraits.length} (期望: 2-3)`);
  console.log(`  ✅ 特质列表: ${personalityTraits.map(t => t.id).join(', ')}`);
  
  if (personalityTraits.length < 2 || personalityTraits.length > 3) {
    console.log('  ❌ 特质数量不符合预期');
    return false;
  }
  
  console.log('  ✅ NPC特质生成正常');
  return true;
}

// 测试3: 执念数据结构
async function testObsessionDataStructure() {
  console.log('\n测试3: 执念数据结构');
  
  const { Player } = require('./src/agents/Player');
  const player = new Player('scholar');
  
  // 添加一些特质
  player.traits = [
    { id: 'mystical', type: 'personality' },
    { id: 'insane', type: 'personality' }
  ];
  
  const obsessionData = player.generateObsession();
  
  console.log(`  ✅ 类型: ${obsessionData.type}`);
  console.log(`  ✅ 身份: ${obsessionData.identityName}`);
  console.log(`  ✅ 特质: ${obsessionData.traitsDesc}`);
  console.log(`  ✅ Prompt长度: ${obsessionData.prompt.length} 字符`);
  
  // 验证数据结构
  if (!obsessionData.type || !obsessionData.identityName || !obsessionData.prompt) {
    console.log('  ❌ 执念数据结构不完整');
    return false;
  }
  
  console.log('  ✅ 执念数据结构正确');
  return true;
}

// 测试4: 并发执念生成
async function testConcurrentObsessionGeneration() {
  console.log('\n测试4: 并发执念生成');
  
  const game = new Game72Hours({
    aiInterface: new MockAI(),
    config: { MAX_TURNS: 72 }
  });
  
  // 创建玩家
  const { Player } = require('./src/agents/Player');
  const player = new Player('scholar');
  player.traits = [{ id: 'calm', type: 'personality' }];
  game.gameState.player = player;
  
  // 创建NPC
  const { NPC } = require('./src/agents/NPC');
  const npc1 = new NPC({ name: '母亲', baseMass: 4, isBonded: true });
  const npc2 = new NPC({ name: '教书先生', baseMass: 3, isBonded: true });
  npc1.traits = [{ id: 'fearful', type: 'personality' }];
  npc2.traits = [{ id: 'scholarly', type: 'personality' }];
  game.gameState.npcs = [npc1, npc2];
  
  // 记录开始时间
  const startTime = Date.now();
  
  // 执行并发生成
  await game.generateAllObsessionsConcurrently();
  
  const duration = Date.now() - startTime;
  
  console.log(`  ✅ 并发生成耗时: ${duration}ms`);
  console.log(`  ✅ 玩家执念: ${player.obsession}`);
  console.log(`  ✅ NPC1执念: ${npc1.obsession}`);
  console.log(`  ✅ NPC2执念: ${npc2.obsession}`);
  
  // 验证所有执念都已生成
  if (!player.obsession || !npc1.obsession || !npc2.obsession) {
    console.log('  ❌ 有角色的执念未生成');
    return false;
  }
  
  // 并发应该比串行快（3个100ms的调用，串行需要300ms+）
  if (duration > 250) {
    console.log('  ⚠️  耗时较长，可能不是完全并发');
  } else {
    console.log('  ✅ 并发执行正常');
  }
  
  return true;
}

// 测试5: 完整初始化流程
async function testFullInit() {
  console.log('\n测试5: 完整初始化流程');
  
  const game = new Game72Hours({
    aiInterface: new MockAI(),
    config: { MAX_TURNS: 72 }
  });
  
  const startTime = Date.now();
  
  try {
    const result = await game.init('scholar');
    
    const duration = Date.now() - startTime;
    
    console.log(`  ✅ 初始化耗时: ${duration}ms`);
    console.log(`  ✅ 玩家身份: ${result.player.identity.name}`);
    console.log(`  ✅ 关联NPC数: ${result.bondedNPCs.length}`);
    console.log(`  ✅ 开场白长度: ${result.opening.length} 字符`);
    console.log(`  ✅ 玩家执念: ${result.player.obsession}`);
    
    // 验证NPC也有执念
    result.bondedNPCs.forEach((npc, i) => {
      console.log(`  ✅ NPC${i+1}(${npc.name})执念: ${npc.obsession || '未生成'}`);
    });
    
    if (duration > 1000) {
      console.log('  ⚠️  初始化耗时较长');
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ 初始化失败: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  const results = [];
  
  results.push(await testTraitGeneration());
  results.push(await testNPCTraitGeneration());
  results.push(await testObsessionDataStructure());
  results.push(await testConcurrentObsessionGeneration());
  results.push(await testFullInit());
  
  console.log('\n=== 测试结果 ===');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ 所有测试通过！');
    process.exit(0);
  } else {
    console.log('❌ 有测试失败');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('测试执行错误:', err);
  process.exit(1);
});
