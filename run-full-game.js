/**
 * 72Hours 完整游戏运行 - 使用真实AI
 * 记录每个回合的故事线
 */

const { Game72HoursStream } = require('./src/Game72HoursStream');
const { AIProviderFactory } = require('./src/narrative/AIProviderFactory');

const API_KEY = 'sk-loulnfpbpzkhwtkfzjeysrgkoflcagblvinuncxyajtiypbn';

async function runFullGame() {
  console.log('=== 72Hours 完整游戏运行 ===\n');
  console.log('使用模型: Pro/MiniMaxAI/MiniMax-M2.5');
  console.log('API: 硅基流动 (SiliconFlow)\n');
  
  // 创建 AI 提供商
  const aiProvider = AIProviderFactory.create('siliconflow', {
    apiKey: API_KEY,
    model: 'Pro/MiniMaxAI/MiniMax-M2.5'
  });
  
  // 创建游戏实例
  const game = new Game72HoursStream({ aiProvider });
  
  // 随机特质
  const traits = [
    { id: 'calm', name: '冷静', type: 'temperament' },
    { id: 'curious', name: '好奇', type: 'personality' },
    { id: 'honest', name: '诚实', type: 'sociability' }
  ];
  
  console.log('1. 初始化游戏...');
  console.log('   身份: 村中的读书人');
  console.log('   特质:', traits.map(t => t.name).join(' · '));
  
  const init = await game.init('scholar', traits);
  
  console.log('\n2. 角色信息:');
  console.log('   姓名:', init.characterInfo?.name || '周文远');
  console.log('   年龄:', init.characterInfo?.age || 28);
  console.log('   背景:', init.characterInfo?.backstory?.substring(0, 50) + '...');
  
  console.log('\n3. 开场:');
  console.log(init.opening);
  
  // 故事记录
  const storyLog = [];
  
  console.log('\n=== 开始10回合（测试模式）===\n');
  
  // 运行10回合
  for (let turn = 1; turn <= 10; turn++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`【第 ${turn} 回合】`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      // 执行回合
      const turnResult = await game.executeTurn();
      
      if (turnResult.error) {
        console.log('错误:', turnResult.error);
        break;
      }
      
      // 记录回合信息
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
      
      // 显示回合信息
      console.log(`\n时间: ${turnRecord.time} | 天气: ${turnRecord.weather}`);
      console.log(`压强: ${turnRecord.pressure}/100 | Ω: ${turnRecord.omega}`);
      if (turnRecord.spotlight) {
        console.log(`聚光灯NPC: ${turnRecord.spotlight}`);
      }
      
      console.log('\n【叙事】');
      console.log(turnRecord.narrative);
      
      console.log('\n【选择】');
      turnRecord.choices.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.text}`);
      });
      
      // 随机选择一个选项
      const selectedChoice = turnRecord.choices[Math.floor(Math.random() * turnRecord.choices.length)];
      console.log(`\n【玩家选择】${selectedChoice.text}`);
      
      // 执行选择
      const choiceResult = await game.executeChoice(selectedChoice.id);
      
      if (choiceResult.success) {
        console.log('\n【结果】');
        console.log(choiceResult.result.text);
        
        if (choiceResult.followUpNarrative) {
          console.log('\n【后续】');
          console.log(choiceResult.followUpNarrative);
        }
        
        // 记录选择结果
        turnRecord.selectedChoice = selectedChoice.text;
        turnRecord.result = choiceResult.result.text;
        turnRecord.followUp = choiceResult.followUpNarrative;
        
        // 检查游戏结束
        if (choiceResult.gameOver) {
          console.log('\n【游戏结束】');
          console.log('原因:', choiceResult.gameOver.type);
          break;
        }
      }
      
      // 每5回合暂停一下，避免API限制
      if (turn % 5 === 0) {
        console.log('\n[暂停 2 秒...]');
        await new Promise(r => setTimeout(r, 2000));
      }
      
    } catch (error) {
      console.error(`第 ${turn} 回合出错:`, error.message);
      break;
    }
  }
  
  // 保存故事记录
  const fs = require('fs');
  const storyOutput = {
    title: '72Hours - 金田起义',
    date: new Date().toISOString(),
    identity: 'scholar',
    traits: traits.map(t => t.name),
    character: init.characterInfo,
    turns: storyLog
  };
  
  fs.writeFileSync('/root/.openclaw/workspace/72hours/story-log.json', JSON.stringify(storyOutput, null, 2));
  fs.writeFileSync('/root/.openclaw/workspace/72hours/story-log.md', generateMarkdown(storyOutput));
  
  console.log('\n\n=== 10回合测试结束 ===');
  console.log(`共进行 ${storyLog.length} 回合`);
  console.log('故事记录已保存到:');
  console.log('  - story-log.json');
  console.log('  - story-log.md');
  
  return storyOutput;
}

function generateMarkdown(story) {
  let md = `# ${story.title}\n\n`;
  md += `**日期**: ${story.date}\n\n`;
  md += `**身份**: ${story.identity}\n\n`;
  md += `**特质**: ${story.traits.join(' · ')}\n\n`;
  
  if (story.character) {
    md += `## 角色信息\n\n`;
    md += `- **姓名**: ${story.character.name}\n`;
    md += `- **年龄**: ${story.character.age}\n`;
    md += `- **背景**: ${story.character.backstory}\n\n`;
  }
  
  md += `## 故事线\n\n`;
  
  for (const turn of story.turns) {
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
  
  return md;
}

runFullGame().catch(console.error);
