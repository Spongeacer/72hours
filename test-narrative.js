const dotenv = require('dotenv');
dotenv.config();

// 模拟 GameState
const gameState = {
  turn: 1,
  datetime: new Date().toISOString(),
  weather: 'night',
  pressure: 10,
  omega: 2,
  player: {
    id: 'player_1',
    identity: { name: '书生' },
    traits: [{ id: 'calm' }, { id: 'curious' }],
    obsession: '在乱世中活下去',
    states: { fear: 5, aggression: 5, hunger: 5, injury: 0 },
    aura: '沉默的警惕',
    position: { x: 0, y: 0 }
  },
  npcs: [
    {
      id: 'npc_1',
      name: '教书先生',
      obsession: '传承知识',
      traits: [{ id: 'wise' }],
      states: { fear: 5, aggression: 3, hunger: 5, injury: 0 },
      isUnlocked: true,
      position: { x: 2, y: 2 },
      mass: 5
    }
  ],
  history: []
};

// 导入 narrative 引擎
const { EmergentNarrativeEngine } = require('./dist/src/narrative/EmergentNarrativeEngine');

async function test() {
  console.log('测试 AI 叙事生成...');
  console.log('API Key:', process.env.SILICONFLOW_API_KEY ? '已设置' : '未设置');
  
  const engine = new EmergentNarrativeEngine(null, 'Pro/MiniMaxAI/MiniMax-M2.1');
  
  try {
    const narrative = await engine.generateEmergentNarrative(gameState);
    console.log('\n生成的叙事:');
    console.log(narrative);
  } catch (error) {
    console.error('错误:', error);
  }
}

test();
