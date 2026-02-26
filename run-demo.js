/**
 * 72Hours 演示运行 - 使用真实AI
 * 运行10回合作为示例
 */

const { Game72HoursStream } = require('./src/Game72HoursStream');
const { AIProviderFactory } = require('./src/narrative/AIProviderFactory');

const API_KEY = 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

async function runDemo() {
  console.log('=== 72Hours 演示运行 (10回合) ===\n');
  console.log('使用模型: Pro/MiniMaxAI/MiniMax-M2.5');
  console.log('API: 硅基流动 (SiliconFlow)\n');
  
  const aiProvider = AIProviderFactory.create('siliconflow', {
    apiKey: API_KEY,
    model: 'Pro/MiniMaxAI/MiniMax-M2.5'
  });
  
  const game = new Game72HoursStream({ aiProvider });
  
  const traits = [
    { id: 'calm', name: '冷静', type: 'temperament' },
    { id: 'curious', name: '好奇', type: 'personality' },
    { id: 'honest', name: '诚实', type: 'sociability' }
  ];
  
  console.log('初始化游戏...');
  const init = await game.init('scholar', traits);
  
  console.log('\n角色信息:');
  console.log('  姓名:', init.characterInfo?.name || '周文远');
  console.log('  年龄:', init.characterInfo?.age || 28);
  
  console.log('\n开场:');
  console.log(init.opening);
  
  const storyLog = [];
  
  console.log('\n=== 开始10回合演示 ===\n');
  
  for (let turn = 1; turn <= 10; turn++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`【第 ${turn} 回合】`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      const turnResult = await game.executeTurn();
      
      if (turnResult.error) {
        console.log('错误:', turnResult.error);
        break;
      }
      
      const turnRecord = {
        turn: turnResult.turn,
        time: turnResult.context?.scene?.time,
        weather: turnResult.context?.scene?.weather,
        pressure: turnResult.context?.scene?.pressure,
        omega: turnResult.context?.scene?.omega,
        narrative: turnResult.narrative,
        choices: turnResult.choices,
        spotlight: turnResult.context?.spotlight?.name
      };
      
      storyLog.push(turnRecord);
      
      console.log(`\n时间: ${turnRecord.time} | 天气: ${turnRecord.weather}`);
      console.log(`压强: ${turnRecord.pressure}/100 | Ω: ${turnRecord.omega}`);
      
      console.log('\n【叙事】');
      console.log(turnRecord.narrative);
      
      console.log('\n【选择】');
      turnRecord.choices.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.text}`);
      });
      
      const selectedChoice = turnRecord.choices[Math.floor(Math.random() * turnRecord.choices.length)];
      console.log(`\n【玩家选择】${selectedChoice.text}`);
      
      const choiceResult = await game.executeChoice(selectedChoice.id);
      
      if (choiceResult.success) {
        console.log('\n【结果】');
        console.log(choiceResult.result.text);
        
        if (choiceResult.followUpNarrative) {
          console.log('\n【后续】');
          console.log(choiceResult.followUpNarrative);
        }
        
        turnRecord.selectedChoice = selectedChoice.text;
        turnRecord.result = choiceResult.result.text;
        turnRecord.followUp = choiceResult.followUpNarrative;
      }
      
    } catch (error) {
      console.error(`第 ${turn} 回合出错:`, error.message);
      break;
    }
  }
  
  // 生成Markdown故事
  const fs = require('fs');
  let md = `# 72Hours - 金田起义 (演示)\n\n`;
  md += `**身份**: 村中的读书人\n\n`;
  md += `**特质**: 冷静 · 好奇 · 诚实\n\n`;
  md += `**角色**: ${init.characterInfo?.name || '周文远'}\n\n`;
  md += `## 故事线\n\n`;
  
  for (const turn of storyLog) {
    md += `### 第 ${turn.turn} 回合\n\n`;
    md += `**时间**: ${turn.time} | **天气**: ${turn.weather} | **压强**: ${turn.pressure}/100 | **Ω**: ${turn.omega}\n\n`;
    
    if (turn.spotlight) {
      md += `**聚光灯NPC**: ${turn.spotlight}\n\n`;
    }
    
    md += `**叙事**:\n\n${turn.narrative}\n\n`;
    
    md += `**选择**:\n`;
    turn.choices.forEach((c, i) => {
      md += `${i + 1}. ${c.text}\n`;
    });
    md += `\n`;
    
    if (turn.selectedChoice) {
      md += `**玩家选择**: ${turn.selectedChoice}\n\n`;
    }
    
    if (turn.result) {
      md += `**结果**: ${turn.result}\n\n`;
    }
    
    if (turn.followUp) {
      md += `**后续**: ${turn.followUp}\n\n`;
    }
    
    md += `---\n\n`;
  }
  
  fs.writeFileSync('/root/.openclaw/workspace/72hours/demo-story.md', md);
  
  console.log('\n\n=== 演示结束 ===');
  console.log(`共进行 ${storyLog.length} 回合`);
  console.log('故事记录已保存到: demo-story.md');
  
  return storyLog;
}

runDemo().catch(console.error);
