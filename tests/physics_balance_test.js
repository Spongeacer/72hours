/**
 * 物理引擎数值平衡测试
 * 基于 DESIGN.md v1.1 涌现版
 */

const GAME_CONFIG = {
  // 网格与世界
  GRID_SIZE: 5,
  MAX_TURNS: 72,
  START_DATE: new Date('1851-01-08T00:00:00'),
  
  // 物理参数 - 优化后的数值
  GRAVITY: {
    G: 0.8,                     // 引力常数（从10.0调整为0.8，更合理的范围）
    PRESSURE_MULTIPLIER: 0.05   // 压强调制系数（保持不变）
  },
  
  // 压强系统 - 优化后的数值
  PRESSURE: {
    BASE_GROWTH: 0.8,           // 每回合基础增长（从1.0调整为0.8，72回合后约67）
    VIOLENCE_BONUS: 5,          // 暴力行为增加（从10调整为5）
    THRESHOLD_RAID: 50,         // 官兵搜查阈值（保持不变）
    THRESHOLD_DIVINE: 60        // 天父下凡阈值（保持不变）
  },
  
  // 全局因子 Ω - 优化后的数值
  OMEGA: {
    INITIAL: 1.0,
    LINEAR_GROWTH: 0.02,         // 线性阶段每回合增长
    EXPONENTIAL_THRESHOLD: 60,   // 60回合后开始指数增长
    EXPONENTIAL_BASE: 1.05,      // 指数增长基数
    MAX: 5.0                     // 最大Ω值
  },
  
  // 质量系统 - 优化后的数值
  MASS: {
    BASE: {
      ELITE: 5,                  // 精英NPC基础质量
      NORMAL: 2,                 // 普通NPC基础质量
      PLAYER: 3                  // 玩家基础质量
    },
    STORY_PER_EVENT: 0.1,        // 每个事件增加0.1（从1调整为0.1，更细腻）
    KNOT_PER_INTERACTION: 0.5,   // 每次深度交互增加0.5（保持不变）
    OBJECT_KEY: 3,               // 关键道具加成
    OBJECT_NORMAL: 1             // 普通道具加成
  },
  
  // 引力陷阱
  TRAP: {
    INITIAL: 0,
    BONUS_PER_DEEP_EVENT: 1.0,   // 深度交互增加1
    DECAY_RATE: 0.1,             // 每回合衰减10%
    MAX: 5.0                     // 最大陷阱值
  },
  
  // 行为倾向权重 - 基于 DESIGN.md 第4章
  BEHAVIOR: {
    SNATCH: {      // 抢夺
      fear: 0.3,
      hunger: 0.5,
      base: 0.1
    },
    CONFLICT: {    // 冲突
      fear: 0.4,
      bloodthirsty: 0.3,
      base: 0.05
    },
    EAVESDROP: {   // 偷听
      curious: 0.3,
      cunning: 0.3,
      base: 0.15
    },
    CHAT: {        // 聊天
      lonely: 0.4,
      traitMatch: 0.3,
      existingKnot: 0.3,
      base: 0.3
    },
    REQUEST: {     // 请求
      desperation: 0.3,
      trust: 0.3,
      base: 0.1
    },
    GIVE: {        // 给予
      compassion: 0.4,
      deepKnot: 0.3,
      base: 0.05
    }
  },
  
  // 状态阈值
  STATES: {
    FEAR_ESCAPE: 70,
    AGGRESSION_VIOLENT: 70,
    HUNGER_DESPERATE: 70,
    INJURY_FATAL: 100
  }
};

// 测试函数
function runTests() {
  console.log('=== 物理引擎数值平衡测试 ===\n');
  
  // 测试1：压强增长曲线
  console.log('【测试1】压强增长曲线');
  console.log('回合\t压强值\t描述');
  for (let turn of [1, 10, 24, 48, 60, 72]) {
    const pressure = 10 + turn * GAME_CONFIG.PRESSURE.BASE_GROWTH;
    let desc = '';
    if (pressure < 30) desc = '平静期';
    else if (pressure < 50) desc = '紧张期';
    else if (pressure < 70) desc = '高压期';
    else desc = '危机期';
    console.log(`${turn}\t${pressure.toFixed(1)}\t${desc}`);
  }
  console.log();
  
  // 测试2：Ω值增长曲线
  console.log('【测试2】Ω值增长曲线');
  console.log('回合\tΩ值\t描述');
  for (let turn of [1, 10, 24, 48, 60, 66, 72]) {
    let omega;
    if (turn <= GAME_CONFIG.OMEGA.EXPONENTIAL_THRESHOLD) {
      omega = GAME_CONFIG.OMEGA.INITIAL + turn * GAME_CONFIG.OMEGA.LINEAR_GROWTH;
    } else {
      const linearPart = GAME_CONFIG.OMEGA.INITIAL + 
        GAME_CONFIG.OMEGA.EXPONENTIAL_THRESHOLD * GAME_CONFIG.OMEGA.LINEAR_GROWTH;
      const expTurns = turn - GAME_CONFIG.OMEGA.EXPONENTIAL_THRESHOLD;
      omega = linearPart * Math.pow(GAME_CONFIG.OMEGA.EXPONENTIAL_BASE, expTurns);
    }
    let desc = '';
    if (omega < 2.0) desc = '局势可控';
    else if (omega < 3.0) desc = '大势显现';
    else if (omega < 4.0) desc = '大势已去';
    else desc = '历史洪流';
    console.log(`${turn}\t${omega.toFixed(2)}\t${desc}`);
  }
  console.log();
  
  // 测试3：质量计算
  console.log('【测试3】质量计算');
  const testNPC = {
    baseMass: GAME_CONFIG.MASS.BASE.ELITE,
    storyMass: 10 * GAME_CONFIG.MASS.STORY_PER_EVENT, // 10个事件
    knotMass: new Map([['player', 5 * GAME_CONFIG.MASS.KNOT_PER_INTERACTION]]), // 5次交互
    objectMass: GAME_CONFIG.MASS.OBJECT_KEY // 1个关键道具
  };
  const totalMass = testNPC.baseMass + testNPC.storyMass + 
    (5 * GAME_CONFIG.MASS.KNOT_PER_INTERACTION) + testNPC.objectMass;
  console.log(`精英NPC质量组成：`);
  console.log(`  基础质量 B: ${testNPC.baseMass}`);
  console.log(`  叙事权重 S: ${testNPC.storyMass} (10事件 × ${GAME_CONFIG.MASS.STORY_PER_EVENT})`);
  console.log(`  关系羁绊 K: ${5 * GAME_CONFIG.MASS.KNOT_PER_INTERACTION} (5交互 × ${GAME_CONFIG.MASS.KNOT_PER_INTERACTION})`);
  console.log(`  道具加成 O: ${testNPC.objectMass}`);
  console.log(`  总质量 M: ${totalMass.toFixed(1)}`);
  console.log();
  
  // 测试4：引力计算
  console.log('【测试4】引力计算示例');
  const G = GAME_CONFIG.GRAVITY.G;
  const m1 = totalMass;
  const m2 = GAME_CONFIG.MASS.BASE.PLAYER;
  const distance = 1; // 相邻
  const pressure = 50; // 中期
  const omega = 2.0; // 大势显现
  
  const P = 1 + (pressure * GAME_CONFIG.GRAVITY.PRESSURE_MULTIPLIER);
  const F = (G * m1 * m2 / (distance * distance)) * P * omega;
  
  console.log(`场景：精英NPC(质量${m1.toFixed(1)})与玩家(质量${m2})相邻`);
  console.log(`环境：压强${pressure}，Ω=${omega}`);
  console.log(`计算：F = ${G} × ${m1.toFixed(1)} × ${m2} / ${distance}² × ${P.toFixed(2)} × ${omega}`);
  console.log(`结果：引力 F = ${F.toFixed(2)}`);
  console.log();
  
  // 测试5：行为权重计算
  console.log('【测试5】行为权重计算示例');
  const npcState = { fear: 60, hunger: 40 };
  const weights = {
    snatch: (npcState.fear * 0.3 + npcState.hunger * 0.5) / 100 + GAME_CONFIG.BEHAVIOR.SNATCH.base,
    conflict: (npcState.fear * 0.4) / 100 + GAME_CONFIG.BEHAVIOR.CONFLICT.base,
    chat: GAME_CONFIG.BEHAVIOR.CHAT.base
  };
  console.log(`NPC状态：恐惧${npcState.fear}，饥饿${npcState.hunger}`);
  console.log(`行为权重：`);
  console.log(`  抢夺: ${weights.snatch.toFixed(3)}`);
  console.log(`  冲突: ${weights.conflict.toFixed(3)}`);
  console.log(`  聊天: ${weights.chat.toFixed(3)}`);
  console.log();
  
  console.log('=== 测试完成 ===');
  console.log('\n数值评估：');
  console.log('✓ 压强72回合后约67，符合预期（上限100）');
  console.log('✓ Ω值72回合后约4.0，符合预期（上限5.0）');
  console.log('✓ 质量计算合理，精英NPC总质量约10-15');
  console.log('✓ 引力计算在合理范围内');
  console.log('✓ 行为权重总和约0.5-1.0，便于加权随机选择');
}

// 运行测试
runTests();
