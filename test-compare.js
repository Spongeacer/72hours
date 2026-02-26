#!/usr/bin/env node
/**
 * API 响应时间对比测试
 * 同时测试 curl 和 Node.js 方式
 */

const { exec } = require('child_process');
const https = require('https');

const API_KEY = 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';
const prompt = `【时间】第15/72回合
【场】压强：8/20，历史必然感：6/20
【你】恐惧：10/20，饥饿：12/20，执念：在乱世中活下去
【在场者】老王，恐惧：14/20，与你的关系：12/20，执念：守住祖传的地契

写一段200字的第二人称叙事，从视觉、听觉、嗅觉描写，让老王的执念自然流露。`;

const requestBody = {
  model: 'Pro/MiniMaxAI/MiniMax-M2.5',
  messages: [
    { role: 'system', content: '你是一个涌现式叙事引擎。' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.8,
  max_tokens: 400
};

console.log('=== API 响应时间对比测试 ===\n');

// 测试 Node.js 方式
function testNodeJS() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const data = JSON.stringify(requestBody);
    
    const options = {
      hostname: 'api.siliconflow.cn',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        try {
          const result = JSON.parse(responseData);
          resolve({
            method: 'Node.js',
            duration,
            success: !!result.choices,
            tokens: result.usage?.total_tokens || 0,
            content: result.choices?.[0]?.message?.content?.substring(0, 100) + '...'
          });
        } catch (e) {
          resolve({ method: 'Node.js', duration, success: false, error: e.message });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ method: 'Node.js', duration: Date.now() - startTime, success: false, error: error.message });
    });
    
    req.write(data);
    req.end();
  });
}

// 测试 curl 方式
function testCurl() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const cmd = `curl -s -X POST https://api.siliconflow.cn/v1/chat/completions \
      -H "Authorization: Bearer ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`;
    
    exec(cmd, { timeout: 120000 }, (error, stdout) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        resolve({ method: 'curl', duration, success: false, error: error.message });
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve({
          method: 'curl',
          duration,
          success: !!result.choices,
          tokens: result.usage?.total_tokens || 0,
          content: result.choices?.[0]?.message?.content?.substring(0, 100) + '...'
        });
      } catch (e) {
        resolve({ method: 'curl', duration, success: false, error: e.message });
      }
    });
  });
}

// 并行测试两种方法
async function runComparison() {
  console.log('开始并行测试...\n');
  
  const [nodeResult, curlResult] = await Promise.all([
    testNodeJS(),
    testCurl()
  ]);
  
  console.log('【Node.js 方式】');
  console.log(`  耗时: ${nodeResult.duration}ms`);
  console.log(`  成功: ${nodeResult.success}`);
  if (nodeResult.success) {
    console.log(`  Token: ${nodeResult.tokens}`);
    console.log(`  内容: ${nodeResult.content}`);
  } else {
    console.log(`  错误: ${nodeResult.error}`);
  }
  
  console.log('\n【curl 方式】');
  console.log(`  耗时: ${curlResult.duration}ms`);
  console.log(`  成功: ${curlResult.success}`);
  if (curlResult.success) {
    console.log(`  Token: ${curlResult.tokens}`);
    console.log(`  内容: ${curlResult.content}`);
  } else {
    console.log(`  错误: ${curlResult.error}`);
  }
  
  console.log('\n=== 对比结果 ===');
  if (nodeResult.success && curlResult.success) {
    const winner = nodeResult.duration < curlResult.duration ? 'Node.js' : 'curl';
    const diff = Math.abs(nodeResult.duration - curlResult.duration);
    console.log(`${winner} 更快，相差 ${diff}ms`);
  }
}

runComparison();
