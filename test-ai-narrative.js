#!/usr/bin/env node
/**
 * AI 叙事生成测试
 * 使用真实的 SiliconFlow API
 */

const axios = require('axios');

const API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';
const MODEL = 'Pro/MiniMaxAI/MiniMax-M2.5';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

// 模拟游戏状态
const gameState = {
  turn: 15,
  datetime: '1851-01-08T15:00:00',
  pressure: 8,
  omega: 6,
  player: {
    fear: 10,
    aggression: 5,
    hunger: 12,
    injury: 2,
    obsession: '在乱世中活下去',
    identity: '村中的读书人'
  },
  npc: {
    name: '老王',
    fear: 14,
    aggression: 6,
    knot: 12,
    obsession: '守住祖传的地契'
  }
};

// 构建 prompt
const prompt = `
【时间】第${gameState.turn}/72回合，${new Date(gameState.datetime).toLocaleString('zh-CN')}

【场】
压强：${gameState.pressure}/20
历史必然感：${gameState.omega}/20

【你】
恐惧：${gameState.player.fear}/20
攻击性：${gameState.player.aggression}/20
饥饿：${gameState.player.hunger}/20
伤势：${gameState.player.injury}/20
执念：${gameState.player.obsession}

【在场者】${gameState.npc.name}
恐惧：${gameState.npc.fear}/20
攻击性：${gameState.npc.aggression}/20
与你的关系：${gameState.npc.knot}/20
执念：${gameState.npc.obsession}

【约束】
- 从视觉、听觉、嗅觉写环境，不解释"压强高"是什么意思
- 让${gameState.npc.name}的执念自然流露，不直接说"他想..."
- 200字，第二人称，暗示而非说明
`;

async function testAI() {
  console.log('=== AI 叙事生成测试 ===\n');
  console.log('【Prompt】');
  console.log(prompt);
  console.log('\n【调用 API】...\n');

  try {
    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: '你是一个涌现式叙事引擎，专注于生成沉浸式的第二人称叙事。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const narrative = response.data.choices[0].message.content;
    
    console.log('【生成的叙事】\n');
    console.log(narrative);
    console.log('\n=== 测试完成 ===');
    
    // 统计
    const wordCount = narrative.length;
    console.log(`\n字数: ${wordCount}`);
    console.log(`模型: ${response.data.model}`);
    console.log(`耗时: ${response.data.usage ? response.data.usage.total_tokens + ' tokens' : 'N/A'}`);
    
  } catch (error) {
    console.error('【错误】', error.response?.data || error.message);
    process.exit(1);
  }
}

testAI();
