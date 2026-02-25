# 72Hours 优化清单

> 按优先级逐个进行优化
> 创建时间: 2025-02-25

---

## 优化进度总览

| 优先级 | 总数 | 已完成 | 进行中 | 待开始 |
|--------|------|--------|--------|--------|
| P0 (高) | 3 | 0 | 0 | 3 |
| P1 (中) | 3 | 0 | 0 | 3 |
| P2 (低) | 3 | 0 | 0 | 3 |
| **总计** | **9** | **0** | **0** | **9** |

---

## P0 - 高优先级（立即实施）

### [ ] 1. K值注入Prompt

**状态**: 待开始  
**预估时间**: 2小时  
**影响**: 大幅提升NPC一致性

**任务清单**:
- [ ] 1.1 修改 `NarrativeEngine.formatContext()` 方法
- [ ] 1.2 添加 `getKnotDescription()` 辅助函数
- [ ] 1.3 在系统prompt中增加【关系羁绊】部分
- [ ] 1.4 测试不同K值下的NPC态度变化
- [ ] 1.5 更新文档

**实现代码**:
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

---

### [ ] 2. Ω值注入Prompt

**状态**: 待开始  
**预估时间**: 1小时  
**影响**: 增强历史大势感

**任务清单**:
- [ ] 2.1 修改 `NarrativeEngine.formatContext()` 方法
- [ ] 2.2 添加 `getOmegaDescription()` 辅助函数
- [ ] 2.3 在系统prompt中增加【历史大势】部分
- [ ] 2.4 测试不同Ω值下的叙事变化
- [ ] 2.5 更新文档

**实现代码**:
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

### [ ] 3. NPC轮换机制

**状态**: 待开始  
**预估时间**: 3小时  
**影响**: 解决故事线单一问题

**任务清单**:
- [ ] 3.1 修改 `TurnManager.selectSpotlight()` 方法
- [ ] 3.2 添加回合计数器追踪同一NPC连续回合数
- [ ] 3.3 实现强制轮换逻辑（每3-4回合）
- [ ] 3.4 测试轮换机制是否正常工作
- [ ] 3.5 调整轮换阈值（如需）
- [ ] 3.6 更新文档

**实现代码**:
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

## P1 - 中优先级

### [ ] 4. 强化场景转换叙事

**状态**: 待开始  
**预估时间**: 2小时  
**影响**: 提升空间连贯性

**任务清单**:
- [ ] 4.1 在 `NarrativeEngine` 中添加位置追踪
- [ ] 4.2 实现 `buildScenePrompt()` 方法
- [ ] 4.3 在回合开头增加【场景转换】提示
- [ ] 4.4 测试场景转换是否自然
- [ ] 4.5 更新文档

---

### [ ] 5. 线索跟进机制

**状态**: 待开始  
**预估时间**: 4小时  
**影响**: 增强剧情连贯性

**任务清单**:
- [ ] 5.1 在 `GameState` 中添加线索管理（`activeClues` Map）
- [ ] 5.2 实现 `addClue()` 方法
- [ ] 5.3 实现 `followUpClues()` 方法
- [ ] 5.4 在叙事生成中自动跟进线索
- [ ] 5.5 测试线索跟进是否正常
- [ ] 5.6 更新文档

---

### [ ] 6. 优化P值与叙事氛围匹配

**状态**: 待开始  
**预估时间**: 2小时  
**影响**: 提升机制与叙事一致性

**任务清单**:
- [ ] 6.1 在prompt中明确P值影响说明
- [ ] 6.2 修改低P值时的叙事风格（更平静、日常）
- [ ] 6.3 测试不同P值下的叙事变化
- [ ] 6.4 调整P值阈值（如需）
- [ ] 6.5 更新文档

---

## P2 - 低优先级

### [ ] 7. 增加选择结果多样性

**状态**: 待开始  
**预估时间**: 6小时  
**影响**: 增加游戏深度

**任务清单**:
- [ ] 7.1 实现物品获取机制
- [ ] 7.2 实现事件触发机制
- [ ] 7.3 实现NPC位置变化机制
- [ ] 7.4 更新选择结果解析器
- [ ] 7.5 测试新结果类型
- [ ] 7.6 更新文档

---

### [ ] 8. 优化时间推进节奏

**状态**: 待开始  
**预估时间**: 2小时  
**影响**: 改善节奏感

**任务清单**:
- [ ] 8.1 修改时间推进逻辑（前期1小时/回合，后期2-3小时/回合）
- [ ] 8.2 测试时间推进是否正常
- [ ] 8.3 调整时间阈值（如需）
- [ ] 8.4 更新文档

---

### [ ] 9. 增加隐藏选择机制

**状态**: 待开始  
**预估时间**: 4小时  
**影响**: 增加游戏深度

**任务清单**:
- [ ] 9.1 实现K值解锁机制
- [ ] 9.2 实现物品触发机制
- [ ] 9.3 实现时间触发机制
- [ ] 9.4 更新选择生成逻辑
- [ ] 9.5 测试隐藏选择是否正常
- [ ] 9.6 更新文档

---

## 执行计划

### 第1周（P0优先级）
- Day 1-2: 完成 #1 K值注入Prompt
- Day 3: 完成 #2 Ω值注入Prompt
- Day 4-5: 完成 #3 NPC轮换机制

### 第2周（P1优先级）
- Day 1-2: 完成 #4 强化场景转换叙事
- Day 3-4: 完成 #5 线索跟进机制
- Day 5: 完成 #6 优化P值与叙事氛围匹配

### 第3周（P2优先级）
- Day 1-3: 完成 #7 增加选择结果多样性
- Day 4: 完成 #8 优化时间推进节奏
- Day 5: 完成 #9 增加隐藏选择机制

---

## 完成标准

每项优化完成后需要：
1. 代码实现并通过测试
2. 更新相关文档
3. 在 checklist 中标记完成
4. 提交到 GitHub

---

*最后更新: 2025-02-25*
