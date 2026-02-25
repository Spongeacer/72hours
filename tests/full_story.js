/**
 * 72Hours 完整72回合故事线生成
 * 
 * 使用方法：
 * node tests/full_story.js YOUR_API_KEY [identity]
 * 
 * identity可选: scholar(默认), landlord, soldier, cultist
 */

const { Game72Hours } = require('../src/Game72Hours');
const fs = require('fs');

async function generateFullStory() {
  const apiKey = process.argv[2];
  const identity = process.argv[3] || 'scholar';
  
  if (!apiKey) {
    console.log('请提供硅基流动API key:');
    console.log('node tests/full_story.js sk-xxxxxxxx [identity]');
    return;
  }
  
  console.log('=== 72Hours 完整72回合故事线 ===\n');
  console.log(`身份：${identity}`);
  console.log('开始生成...\n');
  
  // 创建游戏实例
  const game = new Game72Hours({
    aiInterface: apiKey
  });
  
  // 初始化
  const init = game.init(identity);
  
  // 收集故事
  const story = {
    identity: init.player.identity.name,
    obsession: init.player.obsession,
    bondedNPCs: init.bondedNPCs.map(n => ({ name: n.name, initialK: n.getKnotWith(init.player.id) })),
    opening: init.opening,
    turns: []
  };
  
  // 运行72回合
  for (let i = 1; i <= 72; i++) {
    try {
      const turn = await game.executeTurn();
      
      // 记录关键信息
      const turnRecord = {
        turn: i,
        time: turn.context.scene.time,
        weather: turn.context.scene.weather,
        pressure: turn.context.scene.pressure,
        omega: turn.context.scene.omega,
        spotlight: turn.context.spotlight?.name || '无',
        event: turn.context.event?.id || null,
        narrative: turn.narrative,
        choices: turn.choices.map(c => c.text)
      };
      
      story.turns.push(turnRecord);
      
      // 显示进度
      if (i % 10 === 0 || [24, 48, 60, 71, 72].includes(i)) {
        console.log(`第${i}回合完成 - ${turn.context.scene.time}`);
        if (turn.context.event) {
          console.log(`  *** 事件：${turn.context.event.id} ***`);
        }
      }
      
      // 检查游戏结束
      if (i === 72) {
        console.log('\n=== 故事完成 ===');
      }
      
    } catch (error) {
      console.error(`第${i}回合失败:`, error.message);
      story.turns.push({
        turn: i,
        error: error.message,
        narrative: '（AI生成失败）'
      });
    }
  }
  
  // 保存到文件
  const outputFile = `/root/.openclaw/workspace/projects/72Hours/tests/full_story_${identity}_${Date.now()}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(story, null, 2));
  console.log(`\n故事已保存到: ${outputFile}`);
  
  // 生成Markdown版本
  const mdContent = generateMarkdown(story);
  const mdFile = outputFile.replace('.json', '.md');
  fs.writeFileSync(mdFile, mdContent);
  console.log(`Markdown版本: ${mdFile}`);
  
  return story;
}

function generateMarkdown(story) {
  let md = `# 72Hours 完整故事线\n\n`;
  md += `**身份：** ${story.identity}\n\n`;
  md += `**执念：** ${story.obsession}\n\n`;
  md += `**关联NPC：** ${story.bondedNPCs.map(n => n.name).join(', ')}\n\n`;
  md += `---\n\n`;
  md += `## 开场\n\n`;
  md += story.opening + '\n\n';
  md += `---\n\n`;
  
  // 按阶段分组
  const phases = [
    { name: '第一幕：暗流涌动', turns: [1, 10] },
    { name: '第二幕：官兵搜查', turns: [11, 30] },
    { name: '第三幕：天父下凡', turns: [31, 55] },
    { name: '第四幕：万寿祝寿', turns: [56, 71] },
    { name: '第五幕：金田起义', turns: [72, 72] }
  ];
  
  for (const phase of phases) {
    md += `## ${phase.name}\n\n`;
    
    const phaseTurns = story.turns.filter(t => 
      t.turn >= phase.turns[0] && t.turn <= phase.turns[1]
    );
    
    for (const turn of phaseTurns) {
      if (turn.error) continue;
      
      // 只显示关键回合或事件回合
      const isKeyTurn = [
        1, 5, 10, 15, 20, 24, 30, 35, 40, 45, 
        48, 50, 55, 60, 65, 71, 72
      ].includes(turn.turn);
      
      const hasEvent = turn.event !== null;
      
      if (isKeyTurn || hasEvent) {
        md += `### 第${turn.turn}回合 - ${turn.time}\n\n`;
        md += `**环境：** ${turn.weather} | **压强：** ${turn.pressure} | **Ω：** ${turn.omega}\n\n`;
        
        if (turn.event) {
          md += `***事件：${turn.event}***\n\n`;
        }
        
        md += `**聚光灯：** ${turn.spotlight}\n\n`;
        md += turn.narrative + '\n\n';
        
        md += '**选择：**\n';
        turn.choices.forEach((c, idx) => {
          md += `${idx + 1}. ${c}\n`;
        });
        md += '\n---\n\n';
      }
    }
  }
  
  md += '## 故事结束\n\n';
  md += '1851年1月11日，金田起义爆发。你的故事在此完成。\n';
  
  return md;
}

// 运行
generateFullStory().catch(console.error);
