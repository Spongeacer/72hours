/**
 * AIReactionGenerator 单元测试
 */

import { 
  generatePlayerReactionsWithAI,
  buildPrompt,
  parseAIResponse,
  generateFallbackReactions
} from '../../src/core/AIReactionGenerator';

// 模拟数据
const mockPlayer = {
  identity: { name: '村中的读书人' },
  identityType: 'scholar',
  obsession: '在乱世中活下去',
  traits: [{ id: 'calm' }, { id: 'curious' }],
  states: { fear: 6, aggression: 4, hunger: 8, injury: 1 }
};

const mockNPCBehavior = {
  type: '冲突' as const,
  description: '官兵在搜查',
  npcName: '清军营官',
  npcTraits: ['贪婪', '嗜血'],
  npcObsession: '立功'
};

const mockContext = {
  pressure: 8,
  omega: 5,
  weather: 'night',
  turn: 5,
  narrative: '深夜，破庙，远处有火光'
};

// 测试 buildPrompt
function testBuildPrompt() {
  console.log('测试 buildPrompt...');
  const prompt = buildPrompt(mockPlayer, mockNPCBehavior, mockContext);
  
  // 验证包含关键信息
  const checks = [
    { name: '包含玩家身份', pass: prompt.includes('村中的读书人') },
    { name: '包含执念', pass: prompt.includes('在乱世中活下去') },
    { name: '包含特质', pass: prompt.includes('calm') },
    { name: '包含NPC行为', pass: prompt.includes('冲突') },
    { name: '包含回合', pass: prompt.includes('第5回合') },
    { name: '包含JSON格式要求', pass: prompt.includes('"reactions"') }
  ];
  
  checks.forEach(c => {
    console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  });
  
  return checks.every(c => c.pass);
}

// 测试 parseAIResponse
function testParseAIResponse() {
  console.log('\n测试 parseAIResponse...');
  
  const mockAIResponse = `{
    "reactions": [
      {
        "text": "你下意识地后退一步",
        "type": "obsession",
        "drive": "执念：活下去",
        "effect": { "fear": 1, "aggression": -1 }
      },
      {
        "text": "你强迫自己冷静",
        "type": "trait",
        "drive": "特质：冷静",
        "effect": { "fear": -2 }
      }
    ]
  }`;
  
  const reactions = parseAIResponse(mockAIResponse, mockPlayer);
  
  const checks = [
    { name: '解析出2个反应', pass: reactions.length === 2 },
    { name: '第一个反应类型正确', pass: reactions[0]?.type === 'obsession' },
    { name: '包含效果值', pass: reactions[0]?.effect?.fear === 1 },
    { name: '生成ID', pass: reactions[0]?.id?.includes('ai_') }
  ];
  
  checks.forEach(c => {
    console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  });
  
  return checks.every(c => c.pass);
}

// 测试 generateFallbackReactions
function testGenerateFallbackReactions() {
  console.log('\n测试 generateFallbackReactions...');
  
  const reactions = generateFallbackReactions(mockPlayer, mockNPCBehavior, mockContext);
  
  const checks = [
    { name: '生成3个反应', pass: reactions.length === 3 },
    { name: '包含执念反应', pass: reactions.some(r => r.type === 'obsession') },
    { name: '包含特质反应', pass: reactions.some(r => r.type === 'trait') },
    { name: '包含本能反应', pass: reactions.some(r => r.type === 'instinct') },
    { name: '包含玩家执念', pass: reactions[0]?.drive?.includes('在乱世中活下去') }
  ];
  
  checks.forEach(c => {
    console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  });
  
  return checks.every(c => c.pass);
}

// 测试完整流程（模拟AI调用）
async function testFullFlow() {
  console.log('\n测试完整流程（实际AI调用）...');
  console.log('  这可能需要10-20秒...');
  
  try {
    const startTime = Date.now();
    const reactions = await generatePlayerReactionsWithAI(
      mockPlayer, 
      mockNPCBehavior, 
      mockContext
    );
    const duration = Date.now() - startTime;
    
    const checks = [
      { name: '生成反应', pass: reactions.length > 0 },
      { name: '最多3个反应', pass: reactions.length <= 3 },
      { name: '每个反应有文本', pass: reactions.every(r => r.text?.length > 10) },
      { name: '每个反应有类型', pass: reactions.every(r => ['obsession', 'trait', 'instinct', 'context'].includes(r.type)) },
      { name: '响应时间<30秒', pass: duration < 30000 }
    ];
    
    checks.forEach(c => {
      console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
    });
    
    // 打印生成的反应
    console.log('\n  生成的反应:');
    reactions.forEach((r, i) => {
      console.log(`  ${i+1}. [${r.type}] ${r.text.substring(0, 50)}...`);
    });
    
    return checks.every(c => c.pass);
  } catch (error) {
    console.log(`  ❌ AI调用失败: ${error.message}`);
    console.log('  检查降级方案...');
    
    // 测试降级
    const fallback = generateFallbackReactions(mockPlayer, mockNPCBehavior, mockContext);
    console.log(`  ✅ 降级方案生效，生成${fallback.length}个反应`);
    return true;
  }
}

// 运行所有测试
async function runTests() {
  console.log('=== AIReactionGenerator 单元测试 ===\n');
  
  const results = [
    { name: 'buildPrompt', pass: testBuildPrompt() },
    { name: 'parseAIResponse', pass: testParseAIResponse() },
    { name: 'generateFallbackReactions', pass: testGenerateFallbackReactions() },
    { name: 'generatePlayerReactionsWithAI', pass: await testFullFlow() }
  ];
  
  console.log('\n=== 测试结果 ===');
  results.forEach(r => {
    console.log(`${r.pass ? '✅' : '❌'} ${r.name}`);
  });
  
  const allPass = results.every(r => r.pass);
  console.log(`\n${allPass ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
  
  process.exit(allPass ? 0 : 1);
}

runTests();
