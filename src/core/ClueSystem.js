/**
 * 线索系统 - 管理线索的引入、跟进和闭合
 * 基于 DESIGN.md：故事自己涌现，物理驱动叙事
 */

const { GAME_CONFIG } = require('../utils/Constants');

class ClueSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    
    // 活跃线索（正在跟进中）
    this.activeClues = new Map();
    
    // 已闭合线索（已解决或过期）
    this.closedClues = new Map();
    
    // 线索类型定义
    this.clueTypes = {
      MYSTERY: 'mystery',       // 谜团（如"黑衣人是谁"）
      THREAT: 'threat',         // 威胁（如"官兵即将搜查"）
      OPPORTUNITY: 'opportunity', // 机会（如"西边聚集了三千人"）
      RELATIONSHIP: 'relationship', // 关系（如"教书先生的秘密"）
      ITEM: 'item'              // 物品（如"那封信在哪里"）
    };
    
    // 跟进阈值（回合数）
    this.followUpThreshold = 3; // 3回合后自动跟进
    this.urgentThreshold = 5;   // 5回合后变为紧急
    this.expireThreshold = 10;  // 10回合后过期
  }
  
  /**
   * 引入新线索
   * 基于叙事内容自动提取或手动添加
   */
  introduceClue(clueData) {
    const clue = {
      id: clueData.id || `clue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: clueData.type || this.clueTypes.MYSTERY,
      title: clueData.title,
      description: clueData.description,
      source: clueData.source, // 线索来源NPC或事件
      relatedNPCs: clueData.relatedNPCs || [],
      introducedTurn: clueData.turn || 0,
      lastFollowUpTurn: clueData.turn || 0,
      followUpCount: 0,
      status: 'active', // active, urgent, resolved, expired
      urgency: clueData.urgency || 1, // 1-5，影响跟进频率
      hints: clueData.hints || [], // 跟进时给出的提示
      resolution: clueData.resolution || null // 解决条件
    };
    
    this.activeClues.set(clue.id, clue);
    
    console.log(`[线索系统] 引入新线索: ${clue.title} (回合${clue.introducedTurn})`);
    
    return clue;
  }
  
  /**
   * 检查并获取需要跟进的线索
   * 基于 DESIGN.md：故事自己涌现
   */
  checkFollowUps(currentTurn, player, spotlightNPC) {
    const followUps = [];
    
    for (const [clueId, clue] of this.activeClues) {
      if (clue.status !== 'active' && clue.status !== 'urgent') continue;
      
      const turnsSinceIntro = currentTurn - clue.introducedTurn;
      const turnsSinceLastFollowUp = currentTurn - clue.lastFollowUpTurn;
      
      // 检查是否需要跟进
      let shouldFollowUp = false;
      let followUpType = 'normal';
      
      // 基础跟进：超过阈值回合
      if (turnsSinceLastFollowUp >= this.followUpThreshold * (6 - clue.urgency)) {
        shouldFollowUp = true;
      }
      
      // 紧急跟进：超过紧急阈值
      if (turnsSinceIntro >= this.urgentThreshold && clue.status !== 'urgent') {
        clue.status = 'urgent';
        shouldFollowUp = true;
        followUpType = 'urgent';
      }
      
      // 过期处理
      if (turnsSinceIntro >= this.expireThreshold) {
        clue.status = 'expired';
        this.closeClue(clueId, 'expired');
        continue;
      }
      
      // 相关NPC在场时增加跟进概率
      if (spotlightNPC && clue.relatedNPCs.includes(spotlightNPC.id)) {
        shouldFollowUp = true;
        followUpType = 'npc_related';
      }
      
      if (shouldFollowUp) {
        followUps.push(this.generateFollowUp(clue, currentTurn, followUpType, spotlightNPC));
      }
    }
    
    return followUps;
  }
  
  /**
   * 生成跟进内容
   */
  generateFollowUp(clue, currentTurn, followUpType, spotlightNPC) {
    // 更新跟进记录
    clue.lastFollowUpTurn = currentTurn;
    clue.followUpCount++;
    
    // 选择提示
    let hintIndex = Math.min(clue.followUpCount - 1, clue.hints.length - 1);
    let hint = clue.hints[hintIndex] || clue.description;
    
    // 根据跟进类型调整提示
    let followUpText = '';
    let narrativeHint = '';
    
    switch (followUpType) {
      case 'normal':
        followUpText = `【线索跟进】${clue.title}`;
        narrativeHint = `这个线索已经${clue.followUpCount}次出现在叙事中，可以给出新的进展或转折`;
        break;
      case 'urgent':
        followUpText = `【紧急线索】${clue.title}`;
        narrativeHint = `这个线索已经持续${currentTurn - clue.introducedTurn}回合，需要加速推进或给出关键信息`;
        break;
      case 'npc_related':
        followUpText = `【线索相关】通过${spotlightNPC.name}跟进"${clue.title}"`;
        narrativeHint = `${spotlightNPC.name}与这个线索相关，可以通过TA的行为或对话透露新信息`;
        break;
    }
    
    return {
      clueId: clue.id,
      type: followUpType,
      title: clue.title,
      text: followUpText,
      hint: hint,
      narrativeHint: narrativeHint,
      urgency: clue.urgency,
      followUpCount: clue.followUpCount
    };
  }
  
  /**
   * 从叙事内容中提取线索
   * AI生成叙事后，自动分析是否包含新线索
   */
  extractCluesFromNarrative(narrative, turn, npcs) {
    const clues = [];
    
    // 关键词匹配（简单实现，实际可用NLP）
    const cluePatterns = [
      {
        pattern: /黑衣人|黑影|神秘人/i,
        type: this.clueTypes.MYSTERY,
        title: '黑衣人的身份',
        description: '村里出现了神秘的黑衣人'
      },
      {
        pattern: /官兵|搜查|缉匪|告示/i,
        type: this.clueTypes.THREAT,
        title: '官府的威胁',
        description: '官府正在搜查村庄'
      },
      {
        pattern: /起义|拜上帝会|三千人|聚集/i,
        type: this.clueTypes.OPPORTUNITY,
        title: '起义的征兆',
        description: '西边聚集了大量人群'
      },
      {
        pattern: /信|书信|密信|册子|手抄/i,
        type: this.clueTypes.ITEM,
        title: '神秘的书信',
        description: '有人藏着神秘的书信或册子'
      },
      {
        pattern: /查账|父亲|旧账|债务/i,
        type: this.clueTypes.RELATIONSHIP,
        title: '父亲的秘密',
        description: '父亲的过去似乎隐藏着什么'
      }
    ];
    
    for (const pattern of cluePatterns) {
      if (pattern.pattern.test(narrative)) {
        // 检查是否已存在相同线索
        const exists = Array.from(this.activeClues.values()).some(
          c => c.title === pattern.title && c.status !== 'expired'
        );
        
        if (!exists) {
          clues.push({
            type: pattern.type,
            title: pattern.title,
            description: pattern.description,
            source: 'narrative_extraction',
            introducedTurn: turn,
            urgency: 2,
            hints: [
              pattern.description,
              `${pattern.description}，情况变得更加复杂`,
              `${pattern.description}，真相即将浮出水面`
            ]
          });
        }
      }
    }
    
    return clues;
  }
  
  /**
   * 闭合线索
   */
  closeClue(clueId, reason, resolution = null) {
    const clue = this.activeClues.get(clueId);
    if (!clue) return null;
    
    clue.status = reason; // resolved, expired, abandoned
    clue.resolution = resolution;
    clue.closedTurn = clue.lastFollowUpTurn;
    
    this.activeClues.delete(clueId);
    this.closedClues.set(clueId, clue);
    
    console.log(`[线索系统] 线索闭合: ${clue.title} (${reason})`);
    
    return clue;
  }
  
  /**
   * 手动解决线索（玩家行动导致）
   */
  resolveClue(clueId, resolution, turn) {
    return this.closeClue(clueId, 'resolved', resolution);
  }
  
  /**
   * 获取所有活跃线索
   */
  getActiveClues() {
    return Array.from(this.activeClues.values());
  }
  
  /**
   * 获取特定类型的线索
   */
  getCluesByType(type) {
    return this.getActiveClues().filter(c => c.type === type);
  }
  
  /**
   * 获取与NPC相关的线索
   */
  getCluesByNPC(npcId) {
    return this.getActiveClues().filter(
      c => c.relatedNPCs.includes(npcId) || c.source === npcId
    );
  }
  
  /**
   * 获取线索统计
   */
  getStats() {
    const active = this.activeClues.size;
    const urgent = this.getActiveClues().filter(c => c.status === 'urgent').length;
    const closed = this.closedClues.size;
    const resolved = Array.from(this.closedClues.values()).filter(
      c => c.status === 'resolved'
    ).length;
    
    return { active, urgent, closed, resolved };
  }
  
  /**
   * 生成线索叙事提示（用于AI prompt）
   */
  generateCluePrompt(currentTurn, spotlightNPC) {
    const followUps = this.checkFollowUps(currentTurn, null, spotlightNPC);
    
    if (followUps.length === 0) {
      return null;
    }
    
    let prompt = `=== 线索跟进 ===\n`;
    
    for (const followUp of followUps) {
      prompt += `\n${followUp.text}\n`;
      prompt += `提示：${followUp.hint}\n`;
      prompt += `叙事建议：${followUp.narrativeHint}\n`;
    }
    
    prompt += `\n请在叙事中自然融入这些线索，不要生硬提及。\n`;
    
    return prompt;
  }
  
  /**
   * 序列化（用于存档）
   */
  serialize() {
    return {
      active: Array.from(this.activeClues.entries()),
      closed: Array.from(this.closedClues.entries())
    };
  }
  
  /**
   * 反序列化（用于读档）
   */
  deserialize(data) {
    this.activeClues = new Map(data.active);
    this.closedClues = new Map(data.closed);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClueSystem };
}
