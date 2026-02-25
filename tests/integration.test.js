/**
 * 72Hours 集成测试
 */

const { Game72Hours } = require('../src/Game72Hours');
const { GravityEngine } = require('../src/core/GravityEngine');
const { PressureSystem } = require('../src/core/PressureSystem');
const { MassSystem } = require('../src/core/MassSystem');
const { Utils } = require('../src/utils/Utils');

// 测试配置
const TEST_CONFIG = {
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  GRAVITY: { G: 1.0, PRESSURE_MULTIPLIER: 0.02 },
  PRESSURE: { BASE_GROWTH: 0.5, VIOLENCE_BONUS: 5, THRESHOLD_RAID: 50 },
  MASS: { STORY_PER_EVENT: 1, KNOT_PER_INTERACTION: 0.5 },
  TRAP: { BONUS_PER_DEEP_EVENT: 0.5, DECAY_RATE: 0.1 },
  MOVEMENT: { FEAR_ESCAPE_THRESHOLD: 80, FEAR_BIAS_FACTOR: 0.3 },
  BEHAVIOR: {}
};

// 简单的测试框架
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ========== 单元测试 ==========

console.log('\n=== 单元测试 ===\n');

// 引力引擎测试
test('引力计算 - 同位置返回Infinity', () => {
  const engine = new GravityEngine(TEST_CONFIG);
  const agent1 = { position: { x: 0, y: 0 }, getTotalMass: () => 5 };
  const agent2 = { position: { x: 0, y: 0 }, getTotalMass: () => 5 };
  const F = engine.calculateGravity(agent1, agent2, 10, 1);
  assert(F === Infinity, '同位置引力应为Infinity');
});

test('引力计算 - 距离增加引力减小', () => {
  const engine = new GravityEngine(TEST_CONFIG);
  const agent1 = { position: { x: 0, y: 0 }, getTotalMass: () => 5 };
  const agent2 = { position: { x: 1, y: 0 }, getTotalMass: () => 5 };
  const agent3 = { position: { x: 2, y: 0 }, getTotalMass: () => 5 };
  
  const F1 = engine.calculateGravity(agent1, agent2, 10, 1);
  const F2 = engine.calculateGravity(agent1, agent3, 10, 1);
  
  assert(F1 > F2, '距离近的引力应更大');
});

// 压强系统测试
test('压强增长 - 每回合增加', () => {
  const pressure = new PressureSystem(TEST_CONFIG);
  const initial = pressure.getPressure();
  pressure.update(1);
  assert(pressure.getPressure() > initial, '压强应增加');
});

test('压强限制 - 不超过100', () => {
  const pressure = new PressureSystem(TEST_CONFIG);
  pressure.setPressure(95);
  pressure.update(1, { violent: true });
  pressure.update(1, { violent: true });
  assert(pressure.getPressure() <= 100, '压强不应超过100');
});

// 质量系统测试
test('质量计算 - M = B + S + K + O', () => {
  const massSystem = new MassSystem(TEST_CONFIG);
  const agent = {
    baseMass: 5,
    storyMass: 2,
    knotMass: new Map([['p1', 3]]),
    objectMass: 1
  };
  agent.getTotalMass = () => massSystem.calculateMass(agent);
  
  assert(agent.getTotalMass() === 11, '总质量应为11');
});

// 工具函数测试
test('距离计算 - 欧几里得距离', () => {
  const d = Utils.distance({ x: 0, y: 0 }, { x: 3, y: 4 });
  assert(d === 5, '距离应为5');
});

test('限制范围 - clamp', () => {
  assert(Utils.clamp(10, 0, 5) === 5, '应限制为5');
  assert(Utils.clamp(-5, 0, 10) === 0, '应限制为0');
  assert(Utils.clamp(3, 0, 5) === 3, '应保持3');
});

// ========== 集成测试 ==========

console.log('\n=== 集成测试 ===\n');

test('游戏初始化 - 创建玩家和NPC', () => {
  const game = new Game72Hours({ config: TEST_CONFIG });
  const init = game.init('scholar');
  
  assert(init.player !== null, '玩家应创建');
  assert(init.player.bondedNPCs.length === 2, '应有2个关联NPC');
  assert(game.gameState.npcs.length >= 7, '应有至少7个NPC（2关联+5精英）');
});

test('回合执行 - 完整流程', async () => {
  const game = new Game72Hours({ config: TEST_CONFIG });
  game.init('scholar');
  
  // 执行第一回合
  const turn1 = await game.executeTurn();
  
  assert(turn1.narrative !== undefined, '应生成叙事');
  assert(turn1.choices.length === 3, '应提供3个选择');
  assert(turn1.turn === 1, '应为第1回合');
});

test('引力系统 - 聚光灯选择', () => {
  const game = new Game72Hours({ config: TEST_CONFIG });
  game.init('scholar');
  
  const { player, npcs } = game.gameState;
  
  // 手动设置NPC位置
  npcs[0].position = { x: 1, y: 0 }; // 最近
  npcs[1].position = { x: 5, y: 5 }; // 最远
  
  const engine = new GravityEngine(TEST_CONFIG);
  const { npc: spotlight } = engine.findSpotlightNPC(player, npcs, 10, 1);
  
  assert(spotlight === npcs[0], '最近的NPC应为聚光灯');
});

test('NPC解锁 - 精英NPC条件检查', () => {
  const game = new Game72Hours({ config: TEST_CONFIG });
  game.init('scholar');
  
  const fengYunshan = game.gameState.npcs.find(n => n.id === 'feng_yunshan');
  assert(fengYunshan.isUnlocked === false, '初始应未解锁');
  
  // 模拟满足条件
  const unlocked = fengYunshan.checkUnlock({
    turn: 45,
    pressure: 50,
    player: game.gameState.player,
    npcs: game.gameState.npcs
  });
  
  assert(unlocked === true, '满足条件后应解锁');
  assert(fengYunshan.isUnlocked === true, '解锁状态应更新');
});

// ========== 完整测试用例 ==========

console.log('\n=== 完整测试用例（前5回合） ===\n');

async function runFullTest() {
  const game = new Game72Hours({ config: TEST_CONFIG });
  const init = game.init('scholar');
  
  console.log('开场：');
  console.log(init.opening);
  console.log('\n关联NPC：');
  init.bondedNPCs.forEach(npc => {
    console.log(`- ${npc.name} (K=${npc.getKnotWith(init.player.id)})`);
  });
  
  console.log('\n--- 回合开始 ---\n');
  
  // 模拟5个回合
  for (let i = 0; i < 5; i++) {
    const turn = await game.executeTurn();
    
    console.log(`\n第${turn.turn}回合`);
    console.log(`天气：${turn.context.scene.weather}`);
    console.log(`压强：${turn.context.scene.pressure}`);
    console.log(`聚光灯：${turn.context.spotlight?.name || '无'}`);
    
    console.log('\n叙事：');
    console.log(turn.narrative);
    
    console.log('\n选择：');
    turn.choices.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.text}`);
    });
    
    // 模拟选择第一个选项
    // const result = await game.executeTurn(turn.choices[0]);
    // console.log('\n结果：');
    // console.log(result.result?.text || '（占位结果）');
    
    // if (result.gameOver) {
    //   console.log('\n游戏结束：', result.gameOver.type);
    //   break;
    // }
    
    console.log('\n(选择处理暂时跳过)');
  }
  
  console.log('\n--- 测试完成 ---');
}

// 运行完整测试
runFullTest().catch(err => {
  console.error('测试出错：', err);
});
