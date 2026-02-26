#!/usr/bin/env node
/**
 * AI 叙事生成测试 - 简化版
 */

const https = require('https');

const API_KEY = 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';
const MODEL = 'Pro/MiniMaxAI/MiniMax-M2.5';

const prompt = `【时间】第15/72回合
【场】压强：8/20，历史必然感：6/20
【你】恐惧：10/20，饥饿：12/20，执念：在乱世中活下去
【在场者】老王，恐惧：14/20，与你的关系：12/20，执念：守住祖传的地契

写一段200字的第二人称叙事，从视觉、听觉、嗅觉描写，让老王的执念自然流露。`;

const data = JSON.stringify({
  model: MODEL,
  messages: [
    { role: 'system', content: '你是一个涌现式叙事引擎。' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.8,
  max_tokens: 400,
  stream: false
});

const options = {
  hostname: 'api.siliconflow.cn',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 60000
};

console.log('=== AI 叙事生成测试 ===\n');
console.log('【Prompt】');
console.log(prompt);
console.log('\n【调用 API】...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      if (result.choices && result.choices[0]) {
        console.log('【生成的叙事】\n');
        console.log(result.choices[0].message.content);
        console.log('\n=== 测试完成 ===');
      } else {
        console.error('【错误】', result);
      }
    } catch (e) {
      console.error('【解析错误】', e.message);
      console.log('原始响应:', responseData.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('【请求错误】', error.message);
});

req.on('timeout', () => {
  console.error('【超时】请求超时');
  req.destroy();
});

req.write(data);
req.end();
