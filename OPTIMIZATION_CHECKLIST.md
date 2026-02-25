# 72Hours 优化清单（基于 DESIGN.md v1.1）

> 严格遵循"涌现式叙事"和"玩家作为催化剂"设计理念
> 创建时间: 2025-02-25

---

## 优化进度总览

| 优先级 | 总数 | 已完成 | 进行中 | 待开始 |
|--------|------|--------|--------|--------|
| P0 (核心机制) | 4 | 0 | 0 | 4 |
| P1 (涌现增强) | 3 | 0 | 0 | 3 |
| P2 (体验优化) | 2 | 0 | 0 | 2 |
| **总计** | **9** | **0** | **0** | **9** |

---

## 核心设计原则检查

在开始优化前，确认每项优化都符合：

- [ ] **玩家是催化剂**：在场即影响，但不控制
- [ ] **故事自己涌现**：有框架，无预设
- [ ] **物理驱动叙事**：F/P/M 决定可能性，不决定结果
- [ ] **历史大势不可变**：锚点事件必须发生
- [ ] **个人命运可塑造**：谁与你同行，由你的存在决定

---

## P0 - 核心机制（必须实现）

### [ ] 1. 完善物理引擎数值体系

**状态**: 待开始  
**预估时间**: 4小时  
**设计依据**: DESIGN.md 第3章、第8章

**问题**: 核心机制清单中所有数值都"待定"

**任务清单**:
- [ ] 1.1 确定引力常数 G（建议：0.5-1.0之间测试）
- [ ] 1.2 确定基础质量 B 的基准值（精英NPC vs 普通NPC）
- [ ] 1.3 确定叙事权重 S 的累积方式（每回合+0.1？）
- [ ] 1.4 确定关系系数 K 的计算（每次深度交互+0.5-1）
- [ ] 1.5 确定道具加成 O 的数值（关键道具+2-5）
- [ ] 1.6 确定环境压强 P_history 的增长曲线（线性+0.8/回合？）
- [ ] 1.7 确定特质扰动 P_traits 的系数（激化型×1.2，缓冲型×0.8）
- [ ] 1.8 确定全局因子 Ω 的增长曲线（前期线性，60回合后指数）
- [ ] 1.9 编写数值平衡测试脚本
- [ ] 1.10 更新 DESIGN.md 第8章

**实现代码框架**:
```javascript
// PhysicsEngine.js
class PhysicsEngine {
  constructor() {
    this.G = 0.8; // 引力常数，待调优
    
    // 质量基准值
    this.MASS_BASE = {
      ELITE: 5,    // 精英NPC基础质量
      NORMAL: 2,   // 普通NPC基础质量
      PLAYER: 3    // 玩家基础质量
    };
    
    // 压强参数
    this.PRESSURE = {
      BASE_INCREMENT: 0.8,     // 每回合基础增长
      TRAIT_AGGRESSIVE: 1.2,   // 激化型特质系数
      TRAIT_BUFFER: 0.8,       // 缓冲型特质系数
      HISTORY_MULTIPLIER: 1.0  // 历史压强乘数
    };
    
    // 全局因子
    this.OMEGA = {
      LINEAR_PHASE: 60,        // 线性增长阶段（前60回合）
      LINEAR_INCREMENT: 0.02,  // 线性阶段每回合增长
      EXPONENTIAL_BASE: 1.05   // 指数增长基数
    };
  }
  
  calculateMass(entity) {
    const B = entity.baseMass || this.MASS_BASE.NORMAL;
    const S = (entity.storyWeight || 0) * 0.1; // 每事件+0.1
    const K = (entity.knotWithPlayer || 0) * 0.5; // 每次交互+0.5
    const O = this.calculateObjectBonus(entity.objects);
    return B + S + K + O;
  }
  
  calculatePressure(turn, traits = []) {
    const P_history = 1 + (turn * this.PRESSURE.BASE_INCREMENT / 100);
    const P_traits = traits.reduce((acc, trait) => {
      if (trait === 'aggressive') return acc * this.PRESSURE.TRAIT_AGGRESSIVE;
      if (trait === 'buffer') return acc * this.PRESSURE.TRAIT_BUFFER;
      return acc;
    }, 1);
    return Math.min(P_history * P_traits, 5.0); // 上限5.0
  }
  
  calculateOmega(turn) {
    if (turn <= this.OMEGA.LINEAR_PHASE) {
      return 1.0 + (turn * this.OMEGA.LINEAR_INCREMENT);
    } else {
      const linearPart = 1.0 + (this.OMEGA.LINEAR_PHASE * this.OMEGA.LINEAR_INCREMENT);
      const expTurns = turn - this.OMEGA.LINEAR_PHASE;
      return linearPart * Math.pow(this.OMEGA.EXPONENTIAL_BASE, expTurns);
    }
  }
  
  calculateGravity(entity1, entity2, distance, pressure, omega) {
    const M1 = this.calculateMass(entity1);
    const M2 = this.calculateMass(entity2);
    const r = Math.max(distance, 0.1); // 防止除零
    return this.G * M1 * M2 / (r * r) * pressure * omega;
  }
}
```

---

### [ ] 2. 实现行为模式库涌现机制

**状态**: 待开始  
**预估时间**: 6小时  
**设计依据**: DESIGN.md 第4章

**问题**: 当前行为选择过于随机，缺乏"共振"感

**任务清单**:
- [ ] 2.1 实现六类行为的倾向计算（抢夺/冲突/偷听/聊天/请求/给予）
- [ ] 2.2 根据NPC状态（fear/hunger/执念）计算行为权重
- [ ] 2.3 根据玩家在场状态（气场/信号）调整权重
- [ ] 2.4 实现"共振"机制：相似状态增加行为概率
- [ ] 2.5 添加随机扰动（无因之果，10%随机性）
- [ ] 2.6 编写行为涌现测试
- [ ] 2.7 更新文档

**实现代码框架**:
```javascript
// BehaviorEmergence.js
class BehaviorEmergence {
  constructor() {
    this.behaviors = ['snatch', 'conflict', 'eavesdrop', 'chat', 'request', 'give'];
    this.randomFactor = 0.1; // 10%随机扰动
  }
  
  calculateBehaviorWeights(npc, player, context) {
    const weights = {};
    
    // 基于NPC状态的权重
    const fear = npc.state.fear || 0;
    const hunger = npc.state.hunger || 0;
    const obsession = npc.profile.obsession || '';
    
    // 抢夺：恐惧+饥饿
    weights.snatch = (fear * 0.3 + hunger * 0.5) / 100;
    
    // 冲突：恐惧+特质
    weights.conflict = (fear * 0.4 + (npc.profile.traits.includes('bloodthirsty') ? 0.3 : 0)) / 100;
    
    // 偷听：好奇+狡诈
    weights.eavesdrop = ((npc.profile.traits.includes('curious') ? 0.3 : 0) + 
                         (npc.profile.traits.includes('cunning') ? 0.3 : 0)) / 100;
    
    // 聊天：孤独+特质共鸣
    weights.chat = this.calculateChatWeight(npc, player);
    
    // 请求：绝望+信任
    const knot = npc.knotWithPlayer || 0;
    weights.request = ((100 - npc.state.hope || 50) * 0.3 + knot * 0.2) / 100;
    
    // 给予：慈悲+报恩
    weights.give = ((npc.profile.traits.includes('compassionate') ? 0.4 : 0) + 
                    (knot > 5 ? 0.3 : 0)) / 100;
    
    // 玩家气场影响
    const playerAura = this.detectPlayerAura(player, context);
    weights = this.applyPlayerAura(weights, playerAura);
    
    // 共振增强
    weights = this.applyResonance(weights, npc, player);
    
    // 随机扰动
    weights = this.applyRandomPerturbation(weights);
    
    return weights;
  }
  
  detectPlayerAura(player, context) {
    // 检测玩家散发的"气场"
    const aura = {
      tension: 0,    // 紧张（沉默磨刀）
      comfort: 0,    // 安慰（陪伴）
      charity: 0,    // 恩情（给予食物）
      resonance: 0   // 共鸣（讲述恐惧）
    };
    
    if (context.playerAction === 'sharpen_weapon') aura.tension = 0.8;
    if (context.playerAction === 'silent_presence') aura.comfort = 0.6;
    if (context.playerAction === 'give_food') aura.charity = 0.9;
    if (context.playerAction === 'share_fear') aura.resonance = 0.7;
    
    return aura;
  }
  
  applyResonance(weights, npc, player) {
    // 如果玩家和NPC有相似状态，增加某些行为概率
    if (Math.abs(npc.state.fear - player.state.fear) < 20) {
      // 恐惧共鸣 → 增加聊天概率
      weights.chat *= 1.5;
    }
    if (npc.profile.traits.some(t => player.profile.traits.includes(t))) {
      // 特质共鸣 → 增加聊天概率
      weights.chat *= 1.3;
    }
    return weights;
  }
  
  emergeBehavior(npc, player, context) {
    const weights = this.calculateBehaviorWeights(npc, player, context);
    
    // 加权随机选择
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [behavior, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) return behavior;
    }
    
    return 'chat'; // 默认行为
  }
}
```

---

### [ ] 3. 实现历史锚点动态触发机制

**状态**: 待开始  
**预估时间**: 5小时  
**设计依据**: DESIGN.md 第5章

**问题**: 当前锚点是固定的，缺乏"涌现"感

**任务清单**:
- [ ] 3.1 实现5个历史锚点的动态触发条件
- [ ] 3.2 实现锚点2（官兵搜查）的P值和玩家戾气值检测
- [ ] 3.3 实现锚点3（天父下凡）的会众质量总和检测
- [ ] 3.4 实现锚点4（万寿祝寿）的精英NPC强制聚集
- [ ] 3.5 实现锚点事件的涌现式呈现（不是触发剧情，而是物理状态临界）
- [ ] 3.6 编写锚点触发测试
- [ ] 3.7 更新文档

**实现代码框架**:
```javascript
// AnchorSystem.js
class AnchorSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.anchors = [
      { id: 1, turn: 1, type: 'fixed', name: '暗流涌动' },
      { id: 2, turn: 24, variance: 6, type: 'dynamic', name: '官兵搜查', 
        condition: this.checkOfficialSearch.bind(this) },
      { id: 3, turn: 48, variance: 4, type: 'dynamic', name: '天父下凡',
        condition: this.checkGodDescends.bind(this) },
      { id: 4, turn: 71, type: 'fixed', name: '万寿祝寿',
        effect: this.forceEliteGathering.bind(this) },
      { id: 5, turn: 72, type: 'fixed', name: '金田起义' }
    ];
  }
  
  checkAnchorTrigger(turn) {
    for (const anchor of this.anchors) {
      if (anchor.type === 'fixed' && turn === anchor.turn) {
        return this.triggerAnchor(anchor);
      }
      if (anchor.type === 'dynamic') {
        const shouldTrigger = anchor.condition(turn);
        if (shouldTrigger) {
          return this.triggerAnchor(anchor);
        }
      }
    }
    return null;
  }
  
  checkOfficialSearch(currentTurn) {
    const targetTurn = this.anchors.find(a => a.name === '官兵搜查').turn;
    const variance = this.anchors.find(a => a.name === '官兵搜查').variance;
    
    // 提前触发条件
    if (this.gameState.pressure > 0.5 || this.gameState.player.violence > 70) {
      return currentTurn >= targetTurn - variance;
    }
    
    // 延后触发条件
    if (this.gameState.pressure < 0.3 && this.gameState.player.mass < 4) {
      return currentTurn >= targetTurn + variance;
    }
    
    // 正常触发
    return currentTurn >= targetTurn;
  }
  
  checkGodDescends(currentTurn) {
    const targetTurn = this.anchors.find(a => a.name === '天父下凡').turn;
    const variance = this.anchors.find(a => a.name === '天父下凡').variance;
    
    // 计算会众质量总和
    const congregationMass = this.gameState.npcs
      .filter(n => n.profile.faction === 'taiping')
      .reduce((sum, n) => sum + n.mass, 0);
    
    // 提前触发条件
    if (congregationMass > 20) {
      return currentTurn >= targetTurn - variance;
    }
    
    // 延后触发条件
    const yangXiuqing = this.gameState.npcs.find(n => n.name === '杨秀清');
    if (!yangXiuqing || yangXiuqing.mass < 6) {
      return currentTurn >= targetTurn + variance;
    }
    
    return currentTurn >= targetTurn;
  }
  
  triggerAnchor(anchor) {
    // 涌现式呈现：不是触发剧情，而是物理状态达到临界
    if (anchor.name === '官兵搜查') {
      // 在玩家坐标附近刷新3个官兵NPC
      const soldiers = this.spawnSoldiersNearPlayer(3);
      // 他们的F值瞬间飙升（P调制）
      soldiers.forEach(s => {
        s.mass += 2; // 临时质量增加
        s.state.fear = 60; // 官兵也有恐惧
      });
      
      return {
        type: 'emergence',
        description: '深夜，雨，三个官兵出现在门口',
        npcs: soldiers,
        spotlight: soldiers[0] // 聚光灯锁定领头的
      };
    }
    
    // 其他锚点...
    
    return { type: 'anchor', anchor };
  }
  
  spawnSoldiersNearPlayer(count) {
    // 在玩家附近生成官兵NPC
    const playerPos = this.gameState.player.position;
    return Array.from({ length: count }, (_, i) => ({
      id: `soldier_${Date.now()}_${i}`,
      name: i === 0 ? '营官' : '兵丁',
      profile: {
        traits: ['greedy', i === 0 ? 'bloodthirsty' : 'fearful'],
        obsession: '掠夺财物'
      },
      position: {
        x: playerPos.x + (Math.random() - 0.5) * 2,
        y: playerPos.y + (Math.random() - 0.5) * 2
      },
      mass: i === 0 ? 6 : 3,
      state: { fear: 40, hunger: 30 }
    }));
  }
}
```

---

### [ ] 4. 实现玩家"气场"系统

**状态**: 待开始  
**预估时间**: 3小时  
**设计依据**: DESIGN.md 第1章、第4章

**问题**: 当前玩家只是"选择选项"，没有"在场即影响"的感觉

**任务清单**:
- [ ] 4.1 定义四种玩家气场（陪伴/恩情/共鸣/紧张）
- [ ] 4.2 根据玩家行为计算当前气场
- [ ] 4.3 将气场广播给周围NPC（影响其行为权重）
- [ ] 4.4 在叙事中体现气场影响
- [ ] 4.5 编写气场系统测试
- [ ] 4.6 更新文档

**实现代码框架**:
```javascript
// PlayerAura.js
class PlayerAura {
  constructor() {
    this.auraTypes = {
      PRESENCE: 'presence',     // 陪伴催化
      CHARITY: 'charity',       // 恩情催化
      RESONANCE: 'resonance',   // 共鸣催化
      TENSION: 'tension'        // 紧张催化
    };
    
    this.currentAura = {
      type: null,
      intensity: 0,
      duration: 0
    };
  }
  
  updateAura(playerAction, context) {
    // 根据玩家行为更新气场
    switch (playerAction) {
      case 'silent_sit':
        this.currentAura = { type: this.auraTypes.PRESENCE, intensity: 0.6, duration: 3 };
        break;
      case 'give_food':
        this.currentAura = { type: this.auraTypes.CHARITY, intensity: 0.9, duration: 5 };
        break;
      case 'share_fear':
        this.currentAura = { type: this.auraTypes.RESONANCE, intensity: 0.7, duration: 4 };
        break;
      case 'sharpen_weapon':
        this.currentAura = { type: this.auraTypes.TENSION, intensity: 0.8, duration: 3 };
        break;
      default:
        this.currentAura.duration--;
        if (this.currentAura.duration <= 0) {
          this.currentAura = { type: null, intensity: 0, duration: 0 };
        }
    }
  }
  
  broadcastToNPCs(npcs) {
    // 将气场广播给周围NPC
    if (!this.currentAura.type) return;
    
    npcs.forEach(npc => {
      const distance = this.calculateDistance(npc);
      const attenuation = 1 / (1 + distance); // 距离衰减
      
      npc.receivedAura = {
        type: this.currentAura.type,
        intensity: this.currentAura.intensity * attenuation
      };
    });
  }
  
  getAuraDescription() {
    // 在叙事中体现气场
    if (!this.currentAura.type) return '';
    
    const descriptions = {
      [this.auraTypes.PRESENCE]: '你的沉默像一块石头，压住了暴涨的情绪',
      [this.auraTypes.CHARITY]: '你把最后一块干粮递给他，像母亲一样',
      [this.auraTypes.RESONANCE]: '你讲述恐惧，他也想起父亲',
      [this.auraTypes.TENSION]: '你沉默地磨刀，刀光映着他未收鞘的刀尖'
    };
    
    return descriptions[this.currentAura.type] || '';
  }
}
```

---

## P1 - 涌现增强

### [ ] 5. 强化叙事对撞机的共振生成

**状态**: 待开始  
**预估时间**: 4小时  
**设计依据**: DESIGN.md 第2章、第5章

**问题**: 当前叙事生成过于依赖模板，缺乏"共振"感

**任务清单**:
- [ ] 5.1 收集聚光灯NPC的执念、记忆、当前状态
- [ ] 5.2 收集玩家的气场、信号、记忆
- [ ] 5.3 收集环境信号（天气、声音、光线）
- [ ] 5.4 在prompt中构建"共振场"
- [ ] 5.5 让AI一次生成完整的叙事瞬间（不是三段式）
- [ ] 5.6 编写共振生成测试
- [ ] 5.7 更新文档

---

### [ ] 6. 实现NPC记忆与执念系统

**状态**: 待开始  
**预估时间**: 5小时  
**设计依据**: DESIGN.md 第1章、第7章

**问题**: NPC缺乏记忆，每次互动都像第一次见面

**任务清单**:
- [ ] 6.1 为每个NPC建立记忆库（事件历史）
- [ ] 6.2 实现记忆检索（根据当前情境召回相关记忆）
- [ ] 6.3 实现执念系统（NPC此刻最重要的是什么）
- [ ] 6.4 在叙事中体现记忆触发（"你让他想起..."）
- [ ] 6.5 实现精英NPC的免疫遗忘机制
- [ ] 6.6 编写记忆系统测试
- [ ] 6.7 更新文档

---

### [ ] 7. 完善涌现式提前结束机制

**状态**: 待开始  
**预估时间**: 3小时  
**设计依据**: DESIGN.md 第6章

**问题**: 当前只有固定结局，缺乏涌现式结束

**任务清单**:
- [ ] 7.1 实现死亡检测（injury=致命 + 无救治）
- [ ] 7.2 实现逃离检测（fear=100 + 连续逃跑成功）
- [ ] 7.3 实现疯癫检测（pressure=100 + 精神崩溃）
- [ ] 7.4 实现囚禁检测（被囚禁 + 无法逃脱）
- [ ] 7.5 实现死亡后的信息展示（历史如何继续）
- [ ] 7.6 编写提前结束测试
- [ ] 7.7 更新文档

---

## P2 - 体验优化

### [ ] 8. 优化K值与Ω值的叙事体现

**状态**: 待开始  
**预估时间**: 2小时  
**设计依据**: 测试反馈

**任务清单**:
- [ ] 8.1 在prompt中明确提示K值变化
- [ ] 8.2 在prompt中明确提示Ω值变化
- [ ] 8.3 让AI在叙事中自然体现这些变化
- [ ] 8.4 测试不同K值/Ω值下的叙事差异
- [ ] 8.5 更新文档

---

### [ ] 9. 优化场景转换与NPC轮换

**状态**: 待开始  
**预估时间**: 3小时  
**设计依据**: 测试反馈

**任务清单**:
- [ ] 9.1 在回合开头增加位置说明
- [ ] 9.2 实现NPC轮换机制（每3-4回合）
- [ ] 9.3 跟进关键线索（自动提醒）
- [ ] 9.4 测试场景连贯性
- [ ] 9.5 更新文档

---

## 执行计划

### 第1周（P0 - 核心机制）
| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-2 | #1 完善物理引擎数值体系 | 可运行的PhysicsEngine，数值文档 |
| Day 3-4 | #2 实现行为模式库涌现机制 | BehaviorEmergence类，测试用例 |
| Day 5 | #3 实现历史锚点动态触发机制 | AnchorSystem类，锚点测试 |
| Day 6-7 | #4 实现玩家"气场"系统 | PlayerAura类，气场测试 |

### 第2周（P1 - 涌现增强）
| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-2 | #5 强化叙事对撞机的共振生成 | 新的NarrativeEngine.prompt |
| Day 3-4 | #6 实现NPC记忆与执念系统 | MemorySystem类，记忆测试 |
| Day 5 | #7 完善涌现式提前结束机制 | EndingSystem类，结束测试 |

### 第3周（P2 - 体验优化）
| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1 | #8 优化K值与Ω值的叙事体现 | 更新的prompt模板 |
| Day 2 | #9 优化场景转换与NPC轮换 | 轮换机制，场景测试 |
| Day 3-5 | 集成测试 + Bug修复 | 完整测试报告 |
| Day 6-7 | 文档更新 + 代码审查 | 更新后的DESIGN.md |

---

## 完成标准

每项优化完成后需要：
1. ✅ 代码实现并通过单元测试
2. ✅ 符合 DESIGN.md 设计理念（检查核心设计原则）
3. ✅ 在 checklist 中标记完成
4. ✅ 提交到 GitHub（commit message 包含 `[optimize]` 标签）
5. ✅ 更新相关文档

---

## 当前阻塞项

- [ ] 需要确定物理引擎的具体数值（G、B、S、K、O、P、Ω）
- [ ] 需要设计行为权重的具体计算公式
- [ ] 需要确定锚点触发的具体阈值

---

*最后更新: 2025-02-25*
*基于 DESIGN.md v1.1 涌现版*
