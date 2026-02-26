#!/usr/bin/env node
/**
 * AIReactionGenerator 快速单元测试（跳过AI调用）
 */

const { 
  buildPrompt,
  parseAIResponse,
  generateFallbackReactions
} = require('./dist/src/core/AIReactionGenerator');

// 模拟数据
const mockPlayer = {
  identity: { name: '村中的读书人' },
  identityType: 'scholar',
  obsession: '在乱世中活下去',
  traits: [{ id: 'calm' }, { id: 'curious' }],
  states: { fear: 6, aggression: 4, hunger: 8, injury: 1 }
};

const mockNPCBehavior = {
  type: '冲突',
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

console.log('=== AIReactionGenerator 单元测试 ===\n');

// 测试 buildPrompt
console.log('1. 测试 buildPrompt');
const prompt = buildPrompt(mockPlayer, mockNPCBehavior, mockContext);
const checks1 = [
  { name: '包含玩家身份', pass: prompt.includes('村中的读书人') },
  { name: '包含执念', pass: prompt.includes('在乱世中活下去') },
  { name: '包含特质', pass: prompt.includes('calm') },
  { name: '包含NPC行为', pass: prompt.includes('冲突') },
  { name: '包含回合', pass: prompt.includes('5') },
  { name: '包含JSON格式要求', pass: prompt.includes('"reactions"') }
];
checks1.forEach(c => console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`));

// 测试 parseAIResponse
console.log('\n2. 测试 parseAIResponse');
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
const checks2 = [
  { name: '解析出2个反应', pass: reactions.length === 2 },
  { name: '第一个反应类型正确', pass: reactions[0]?.type === 'obsession' },
  { name: '包含效果值', pass: reactions[0]?.effect?.fear === 1 },
  { name: '生成ID', pass: reactions[0]?.id?.includes('ai_') }
];
checks2.forEach(c => console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`));

// 测试 generateFallbackReactions
console.log('\n3. 测试 generateFallbackReactions');
const fallback = generateFallbackReactions(mockPlayer, mockNPCBehavior, mockContext);
const checks3 = [
  { name: '生成3个反应', pass: fallback.length === 3 },
  { name: '包含执念反应', pass: fallback.some(r => r.type === 'obsession') },
  { name: '包含特质反应', pass: fallback.some(r => r.type === 'trait') },
  { name: '包含本能反应', pass: fallback.some(r => r.type === 'instinct') },
  { name: '包含玩家执念', pass: fallback[0]?.drive?.includes('在乱世中活下去') }
];
checks3.forEach(c => console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`));

// 打印降级反应示例
console.log('\n4. 降级反应示例:');
fallback.forEach((r, i) => {
  console.log(`  ${i+1}. [${r.type}] ${r.text.substring(0, 40)}...`);
  console.log(`     驱动: ${r.drive}`);
});

// 总结
const allPass = [...checks1, ...checks2, ...checks3].every(c => c.pass);
console.log(`\n${allPass ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);

process.exit(allPass ? 0 : 1);
