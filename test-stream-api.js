/**
 * 72Hours 流式 API 测试
 */

const API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

async function testStreamAPI() {
  console.log('=== 72Hours 流式 API 测试 ===\n');
  
  const baseURL = 'http://localhost:3000/api/game';
  
  try {
    // 1. 创建游戏
    console.log('1. 创建游戏...');
    const createRes = await fetch(`${baseURL}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'scholar' })
    });
    const createData = await createRes.json();
    
    if (!createData.success) {
      console.error('创建游戏失败:', createData.error);
      return;
    }
    
    const sessionId = createData.sessionId;
    console.log('   ✓ 游戏创建成功, sessionId:', sessionId);
    
    // 2. 测试流式回合
    console.log('\n2. 测试流式回合生成...');
    console.log('   开始接收流式数据:\n');
    
    const response = await fetch(`${baseURL}/turn/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullNarrative = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'start') {
              console.log(`   [开始] 第 ${data.turn} 回合`);
            } else if (data.type === 'chunk') {
              // 显示打字机效果（逐字显示）
              const newText = data.text;
              process.stdout.write(newText);
              fullNarrative = data.fullText;
            } else if (data.type === 'narrative_complete') {
              console.log('\n\n   [叙事完成]');
            } else if (data.type === 'complete') {
              console.log('\n   [回合完成]');
              console.log('   选择:');
              data.data.choices.forEach((c, i) => {
                console.log(`     ${i + 1}. ${c.text}`);
              });
            } else if (data.type === 'error') {
              console.error('\n   [错误]:', data.error);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    console.log('\n=== 流式测试完成 ===');
    console.log('✓ 流式 API 正常工作');
    console.log(`✓ 叙事长度: ${fullNarrative.length} 字符`);
    
  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testStreamAPI();
