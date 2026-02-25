# 72Hours 游戏设计改进建议

> 基于完整72回合游戏测试的分析总结
> 测试时间: 2025-02-25
> 使用模型: Pro/MiniMaxAI/MiniMax-M2.1

---

## 一、核心问题总结

### 1.1 机制与叙事脱节

| 机制 | 当前问题 | 改进目标 |
|------|---------|---------|
| **K值（关系羁绊）** | 只在系统内部计算，AI不知道NPC与玩家的关系深度 | 将K值注入prompt，让AI根据关系生成对应态度 |
| **Ω值（全局因子）** | 未在叙事中体现历史大势的推进感 | 将Ω值注入prompt，增加"命运感"和"压迫感" |
| **P值（环境压强）** | 低P值时叙事过于紧张，与机制数值脱节 | 调整叙事氛围，让低P值更平静、高P值更紧张 |

### 1.2 叙事连贯性问题

- **场景跳跃**：回合间空间转换缺乏过渡说明
- **NPC单一化**：教书先生占据过多回合，母亲线中断过久
- **线索中断**："黑衣人"等关键线索引入后未跟进
- **时间推进慢**：72回合推进72小时，节奏偏慢

---

## 二、高优先级改进建议

### 2.1 将K值注入Prompt（立即实施）

**问题**：
K值（关系羁绊）只在系统内部计算，AI不知道NPC与玩家的关系深度，导致NPC态度 inconsistent。

**解决方案**：

在 `NarrativeEngine.formatContext()` 中增加【关系羁绊】部分：

```javascript
formatContext(data) {
  let context = `=== 当前场景 ===\n`;
  // ... 原有代码
  
  // 新增：关系羁绊信息
  if (data.spotlight) {
    const knot = data.spotlight.knotWithPlayer || 0;
    const knotLevel = knot <= 3 ? '低' : knot <= 6 ? '中' : '高';
    context += `\n=== 关系羁绊 ===\n`;
    context += `${data.spotlight.name}：K=${knot}/10（${knotLevel}）\n`;
    context += `态度：${this.getKnotDescription(knot)}\n\n`;
  }
  
  return context;
}

getKnotDescription(knot) {
  if (knot <= 3) return '警惕、疏远、话少、身体后仰';
  if (knot <= 6) return '友好、愿意交流、有所保留';
  return '信任、分享秘密、主动帮助、身体前倾';
}
```

**预期效果**：
- NPC态度一致：AI会根据K值生成相应态度的叙事
- 关系变化可感知：玩家能从叙事中感受到关系深化
- 选择更有意义：高K值解锁特殊对话选项

---

### 2.2 将Ω值注入Prompt（立即实施）

**问题**：
Ω值（全局因子）同样未注入到prompt中，导致叙事缺乏"命运感"和"压迫感"。

**解决方案**：

在 prompt 中增加【历史大势】部分：

```
【历史大势】
- 当前Ω值：1.46/5.0（历史正在加速推进）
- 影响：
  - NPC行为更激进、更恐慌
  - 冲突更容易爆发
  - 个人命运感减弱，历史大势增强
- 叙事提示：增加"大势已去"、"山雨欲来"的压迫感
```

**实现方式**：

```javascript
formatContext(data) {
  // ... 原有代码
  
  // 新增：历史大势信息
  const omega = data.scene?.omega || 1.0;
  context += `\n=== 历史大势 ===\n`;
  context += `Ω值：${omega}/5.0\n`;
  context += `影响：${this.getOmegaDescription(omega)}\n\n`;
  
  return context;
}

getOmegaDescription(omega) {
  if (omega < 2.0) return '局势尚可控制，个人选择仍有意义';
  if (omega < 3.0) return '历史大势开始显现，命运感增强';
  if (omega < 4.0) return '大势已去，个人渺小，历史事件即将强制发生';
  return '历史洪流不可阻挡，个人命运被裹挟';
}
```

---

### 2.3 增加NPC轮换机制（立即实施）

**问题**：
第8-20回合连续与教书先生互动，母亲线中断12回合，故事线单一。

**解决方案**：

修改 `TurnManager.selectSpotlight()`，增加NPC轮换逻辑：

```javascript
selectSpotlight() {
  const { player, npcs, turn } = this.gameState;
  
  // 获取可选择的NPC（已解锁）
  const availableNPCs = npcs.filter(n => n.isUnlocked);
  
  // 检查是否需要轮换（每3-4回合）
  const lastNPC = this.lastSpotlightNPC;
  const roundsWithLastNPC = this.roundsWithSameNPC || 0;
  
  if (lastNPC && roundsWithLastNPC >= 3) {
    // 强制轮换，排除上一个NPC
    const otherNPCs = availableNPCs.filter(n => n.id !== lastNPC.id);
    if (otherNPCs.length > 0) {
      // 选择羁绊最高的其他NPC
      const selected = otherNPCs.sort((a, b) => 
        b.getKnotWith(player.id) - a.getKnotWith(player.id)
      )[0];
      this.lastSpotlightNPC = selected;
      this.roundsWithSameNPC = 1;
      return { npc: selected, gravity: this.calculateGravity(selected) };
    }
  }
  
  // 正常选择
  const selected = this.gravityEngine.findSpotlightNPC(player, availableNPCs);
  if (selected.npc === lastNPC) {
    this.roundsWithSameNPC++;
  } else {
    this.lastSpotlightNPC = selected.npc;
    this.roundsWithSameNPC = 1;
  }
  
  return selected;
}
```

---

## 三、中优先级改进建议

### 3.1 强化场景转换叙事

**问题**：
回合间空间跳跃（宴席→家→破庙→祠堂），缺乏明确过渡。

**解决方案**：

在每个回合开头增加位置说明：

```javascript
// 在 NarrativeEngine 中
buildScenePrompt(context) {
  const previousContext = this.getPreviousContext();
  let prompt = '';
  
  // 如果有位置变化，增加过渡叙事
  if (previousContext && previousContext.location !== context.location) {
    prompt += `【场景转换】你从${previousContext.location}来到${context.location}。\n\n`;
  }
  
  // ... 原有prompt构建
  
  return prompt;
}
```

---

### 3.2 跟进关键线索

**问题**：
"黑衣人"、"查账"等关键线索引入后未跟进，剧情连贯性受损。

**解决方案**：

增加线索追踪机制：

```javascript
// 在 GameState 中增加线索管理
this.activeClues = new Map();

// 引入线索
addClue(clueId, description, relatedNPCs) {
  this.activeClues.set(clueId, {
    description,
    relatedNPCs,
    introduced: this.turn,
    status: 'active'
  });
}

// 在叙事中跟进线索
followUpClues() {
  for (const [clueId, clue] of this.activeClues) {
    if (clue.status === 'active' && this.turn - clue.introduced >= 3) {
      // 3回合后自动跟进
      return this.generateClueFollowUp(clue);
    }
  }
  return null;
}
```

---

### 3.3 优化P值与叙事氛围匹配

**问题**：
P=11-20（平静期），但叙事中恐惧、紧张氛围较浓。

**解决方案**：

在 prompt 中明确P值影响：

```
【环境压强】
- 当前P值：15/100（相对平静）
- 叙事提示：
  - 低P值（<30）：多描写日常细节，异常更隐晦
  - 中P值（30-60）：开始出现紧张迹象
  - 高P值（>60）：冲突随时可能爆发
```

---

## 四、低优先级改进建议

### 4.1 增加选择结果多样性

- 获得物品（如教书先生赠送的《论语》）
- 触发事件（如"黑衣人"主动接触）
- 改变NPC位置（如母亲前往祠堂避难）

### 4.2 优化时间推进节奏

- 前期（1-24回合）：每回合推进1小时
- 中期（25-48回合）：每回合推进1-2小时
- 后期（49-72回合）：每回合推进2-3小时，加快节奏

### 4.3 增加隐藏选择机制

- 特定K值解锁特殊选项
- 特定物品触发额外对话
- 特定时间（如深夜）出现独特选择

---

## 五、技术实现优先级

| 优先级 | 改进项 | 预估工作量 | 影响 |
|--------|--------|-----------|------|
| **P0** | K值注入Prompt | 2小时 | 大幅提升NPC一致性 |
| **P0** | Ω值注入Prompt | 1小时 | 增强历史大势感 |
| **P0** | NPC轮换机制 | 3小时 | 解决故事线单一问题 |
| **P1** | 场景转换叙事 | 2小时 | 提升空间连贯性 |
| **P1** | 线索跟进机制 | 4小时 | 增强剧情连贯性 |
| **P2** | 选择结果多样性 | 6小时 | 增加游戏深度 |
| **P2** | 时间推进优化 | 2小时 | 改善节奏感 |

---

## 六、Ω值与P值的关系说明

**结论：Ω值有必要保留**，与P值功能不同：

| 维度 | P值（环境压强） | Ω值（全局因子） |
|------|----------------|----------------|
| **定义** | 局势紧张程度 | 历史大势推进 |
| **影响** | NPC冲突倾向、事件触发 | 命运感、个人渺小感 |
| **叙事体现** | 紧张氛围、冲突频率 | 史诗感、大势已去 |

**示例区别**：
- P=80, Ω=1.5：局势紧张，但仍是个人层面的冲突
- P=50, Ω=3.0：局势中等，但历史大势已不可逆转（起义即将爆发）

Ω值提供了P值无法替代的功能：**史诗感**和**命运机制**。

---

*整理时间：2025-02-25*
*基于完整72回合游戏测试*
