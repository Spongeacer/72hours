/**
 * SiliconFlow AI Provider - 格式化上下文（基于 DESIGN.md v1.1）
 * 核心原则：玩家是催化剂，物理驱动叙事，故事自己涌现
 */

class SiliconFlowAI_formatContext {
  /**
   * 格式化上下文（优化版）
   */
  formatContext(data) {
    const { scene, spotlight, player, event, memories, turn } = data;
    
    let context = `=== 物理场域 ===\n`;
    context += `回合：${turn || '?'}/72\n`;
    context += `时间：${scene.time}\n`;
    context += `天气：${scene.weather}\n`;
    
    // 压强氛围描述 - 物理驱动
    const pressure = scene.pressure;
    let pressureDesc = '';
    let pressureNarrativeHint = '';
    if (pressure < 30) {
      pressureDesc = '平静期';
      pressureNarrativeHint = '多描写日常细节，异常更隐晦（如"他今天话特别少"）';
    } else if (pressure < 50) {
      pressureDesc = '紧张期';
      pressureNarrativeHint = '开始出现紧张迹象（如"路上行人神色匆匆"）';
    } else if (pressure < 70) {
      pressureDesc = '高压期';
      pressureNarrativeHint = '冲突随时可能爆发，危险元素明显增加';
    } else {
      pressureDesc = '危机期';
      pressureNarrativeHint = '生死存亡，必须有危险或冲突的元素';
    }
    
    context += `环境压强 P：${pressure}/100（${pressureDesc}）\n`;
    context += `叙事提示：${pressureNarrativeHint}\n`;
    
    // Ω值 - 历史大势
    const omega = scene.omega;
    let omegaDesc = '';
    let omegaNarrativeHint = '';
    if (omega < 2.0) {
      omegaDesc = '局势可控';
      omegaNarrativeHint = '个人选择仍有意义，历史大势尚未显现';
    } else if (omega < 3.0) {
      omegaDesc = '大势显现';
      omegaNarrativeHint = '增加"山雨欲来"的压迫感，命运感增强';
    } else if (omega < 4.0) {
      omegaDesc = '大势已去';
      omegaNarrativeHint = '个人渺小，历史事件即将强制发生';
    } else {
      omegaDesc = '历史洪流';
      omegaNarrativeHint = '命运被裹挟，大势不可阻挡';
    }
    
    context += `全局因子 Ω：${omega.toFixed(2)}/5.0（${omegaDesc}）\n`;
    context += `叙事提示：${omegaNarrativeHint}\n\n`;
    
    // 特殊事件
    if (event) {
      context += `*** 涌现事件：${event.id} ***\n`;
      context += `这是物理状态达到临界后的自然现象，不是预设剧情。\n`;
      if (event.id === 'raid') context += '官兵NPC因高P值自然聚集，形成搜查态势。\n';
      if (event.id === 'divine') context += '会众质量总和达到阈值，天父下凡自然涌现。\n';
      context += '\n';
    }
    
    // 聚光灯NPC - 包含K值影响
    if (spotlight) {
      context += `=== 聚光灯NPC：${spotlight.name} ===\n`;
      context += `基础质量：${spotlight.baseMass || 5}\n`;
      context += `特质：${spotlight.traits?.join(', ') || '未知'}\n`;
      context += `执念：${spotlight.obsession || '未知'}\n`;
      
      // 状态
      const fear = spotlight.states?.fear || 50;
      const aggression = spotlight.states?.aggression || 50;
      const hunger = spotlight.states?.hunger || 50;
      context += `当前状态：恐惧${fear}%，戾气${aggression}%，饥饿${hunger}%\n`;
      
      // K值 - 关系羁绊（核心）
      const knot = spotlight.knotWithPlayer || 0;
      let knotDesc = '';
      let knotBehaviorHint = '';
      if (knot >= 8) {
        knotDesc = '生死之交';
        knotBehaviorHint = '会主动保护你，分享核心秘密，身体前倾，眼神信任';
      } else if (knot >= 5) {
        knotDesc = '深厚羁绊';
        knotBehaviorHint = '愿意交流，有所保留但逐渐敞开心扉';
      } else if (knot >= 3) {
        knotDesc = '有些交情';
        knotBehaviorHint = '礼貌但戒备，会观察你的反应再决定';
      } else if (knot > 0) {
        knotDesc = '泛泛之交';
        knotBehaviorHint = '保持距离，谨慎回应';
      } else {
        knotDesc = '素不相识';
        knotBehaviorHint = '警惕、疏远、身体后仰';
      }
      
      context += `\n【关系羁绊 K】${knot}/10（${knotDesc}）\n`;
      context += `对你的态度：${knotBehaviorHint}\n`;
      context += `物理影响：K值增加NPC质量，增强引力，使TA更容易成为聚光灯\n\n`;
    }
    
    // 玩家 - 催化剂
    context += `=== 玩家：催化剂 ===\n`;
    context += `身份：${player.identity}\n`;
    context += `特质：${player.traits?.join(', ') || '无'}\n`;
    context += `执念：${player.obsession || '活下去'}\n`;
    
    const pFear = player.states?.fear || 50;
    const pAgg = player.states?.aggression || 50;
    const pHunger = player.states?.hunger || 50;
    context += `自身状态：恐惧${pFear}%，戾气${pAgg}%，饥饿${pHunger}%\n`;
    context += `当前质量：${player.getTotalMass ? player.getTotalMass() : 3}\n`;
    context += `携带道具：${player.inventory?.join(', ') || '无'}\n`;
    context += `\n【玩家气场】${player.aura || '沉默'}\n`;
    context += `气场说明：你的在场会改变周围的"场"，NPC的行为会因你而变，但故事不由你决定。\n\n`;
    
    // 记忆
    if (memories && memories.length > 0) {
      context += `=== 涌现记忆 ===\n`;
      memories.slice(0, 3).forEach(m => {
        context += `- ${m.content}\n`;
      });
      context += '\n';
    }
    
    // 写作要求 - 基于 DESIGN.md
    context += `=== 涌现式叙事要求 ===\n`;
    context += `【核心原则】\n`;
    context += `1. 玩家是催化剂：在场即影响，但不控制故事走向\n`;
    context += `2. 物理驱动叙事：P=${pressure}、Ω=${omega.toFixed(2)}、K=${spotlight?.knotWithPlayer || 0} 决定可能性\n`;
    context += `3. 故事自己涌现：有框架，无预设，让叙事自然流淌\n\n`;
    
    context += `【具体写作指南】\n`;
    context += `- 压强P=${pressure}（${pressureDesc}）：${pressureNarrativeHint}\n`;
    context += `- Ω=${omega.toFixed(2)}（${omegaDesc}）：${omegaNarrativeHint}\n`;
    context += `- 羁绊K=${spotlight?.knotWithPlayer || 0}：${knotBehaviorHint || '根据K值调整NPC态度'}\n\n`;
    
    context += `【氛围营造】\n`;
    context += `- 通过动作和细节展现人物状态，不要直白描述心理\n`;
    context += `- 使用粗粝的历史感词汇（残羹冷炙、烛芯将熄、雾气压得很低）\n`;
    context += `- 留白处理：恐惧通过"指节发白"、"警惕扫视"暗示，不要直接说"他很害怕"\n`;
    context += `- 环境渗透：让天气、声音、光线成为叙事的一部分\n\n`;
    
    context += `【历史锚点】\n`;
    context += `- 保持1851年清末的时代感\n`;
    context += `- 历史大势不可变：洪秀全会出现，起义会爆发\n`;
    context += `- 个人命运可塑造：谁与你同行，由你的存在决定\n`;
    
    return context;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SiliconFlowAI_formatContext };
}
