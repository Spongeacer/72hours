/**
 * 结果多样性系统 - 增加选择结果的类型和影响
 * 基于 DESIGN.md：玩家是催化剂，物理驱动叙事
 */

const { GAME_CONFIG } = require('../utils/Constants');

class ResultDiversitySystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    
    // 结果类型定义
    this.resultTypes = {
      STATE_CHANGE: 'state_change',       // 状态变化（恐惧/饥饿等）
      KNOT_CHANGE: 'knot_change',         // 羁绊变化
      HOSTILITY_CHANGE: 'hostility_change', // 敌意变化
      ITEM_GAIN: 'item_gain',             // 获得物品
      ITEM_LOSS: 'item_loss',             // 失去物品
      NPC_MOVE: 'npc_move',               // NPC移动
      POSITION_CHANGE: 'position_change', // 位置变化
      EVENT_TRIGGER: 'event_trigger',     // 触发事件
      CLUE_RESOLUTION: 'clue_resolution', // 解决线索
      MEMORY_CREATION: 'memory_creation', // 创建记忆
      SPECIAL_ACTION: 'special_action'    // 特殊行动（隐藏选择）
    };
    
    // 结果组合模板
    this.resultTemplates = {
      // 观察类选择
      observe: {
        baseEffects: ['STATE_CHANGE'],
        possibleEffects: ['MEMORY_CREATION', 'CLUE_DISCOVERY'],
        description: '通过观察获得信息，可能发现线索或创建记忆'
      },
      // 交流类选择
      communicate: {
        baseEffects: ['KNOT_CHANGE', 'STATE_CHANGE'],
        possibleEffects: ['MEMORY_CREATION', 'CLUE_RESOLUTION', 'NPC_MOVE'],
        description: '通过交流改变关系，可能解决线索或影响NPC行为'
      },
      // 行动类选择
      action: {
        baseEffects: ['STATE_CHANGE', 'POSITION_CHANGE'],
        possibleEffects: ['ITEM_GAIN', 'EVENT_TRIGGER', 'HOSTILITY_CHANGE'],
        description: '通过行动改变状态，可能获得物品或触发事件'
      },
      // 给予类选择
      give: {
        baseEffects: ['KNOT_CHANGE', 'ITEM_LOSS'],
        possibleEffects: ['NPC_MOVE', 'MEMORY_CREATION'],
        description: '通过给予加深羁绊，可能失去物品但获得信任'
      },
      // 威胁类选择
      threaten: {
        baseEffects: ['HOSTILITY_CHANGE', 'STATE_CHANGE'],
        possibleEffects: ['NPC_MOVE', 'EVENT_TRIGGER'],
        description: '通过威胁产生敌意，可能驱赶NPC或引发冲突'
      }
    };
  }
  
  /**
   * 解析选择类型
   */
  parseChoiceType(choiceText) {
    const text = choiceText.toLowerCase();
    
    if (text.includes('看') || text.includes('观察') || text.includes('注视')) {
      return 'observe';
    }
    if (text.includes('说') || text.includes('问') || text.includes('聊')) {
      return 'communicate';
    }
    if (text.includes('给') || text.includes('递') || text.includes('塞')) {
      return 'give';
    }
    if (text.includes('威胁') || text.includes('逼') || text.includes('冷')) {
      return 'threaten';
    }
    return 'action';
  }
  
  /**
   * 生成多样化结果
   */
  generateDiverseResult(choice, context, baseResult) {
    const choiceType = this.parseChoiceType(choice.text || choice);
    const template = this.resultTemplates[choiceType];
    
    if (!template) {
      return baseResult;
    }
    
    const result = {
      ...baseResult,
      resultType: choiceType,
      effects: []
    };
    
    // 添加基础效果
    for (const effectType of template.baseEffects) {
      const effect = this.generateEffect(effectType, context, choiceType);
      if (effect) {
        result.effects.push(effect);
      }
    }
    
    // 随机添加可能效果（基于物理状态）
    const { pressure, omega, player, spotlightNPC } = context;
    const luckFactor = (pressure / 100) * (omega / 5); // 0-1之间的运气因子
    
    for (const effectType of template.possibleEffects) {
      // 高P值和高Ω值增加额外效果的概率
      if (Math.random() < (0.3 + luckFactor * 0.4)) {
        const effect = this.generateEffect(effectType, context, choiceType);
        if (effect) {
          result.effects.push(effect);
        }
      }
    }
    
    // 根据效果更新结果对象
    this.applyEffectsToResult(result, result.effects);
    
    return result;
  }
  
  /**
   * 生成具体效果
   */
  generateEffect(effectType, context, choiceType) {
    const { player, spotlightNPC, scene } = context;
    
    switch (effectType) {
      case 'STATE_CHANGE':
        return this.generateStateChange(context, choiceType);
      case 'KNOT_CHANGE':
        return this.generateKnotChange(context, choiceType);
      case 'HOSTILITY_CHANGE':
        return this.generateHostilityChange(context, choiceType);
      case 'ITEM_GAIN':
        return this.generateItemGain(context);
      case 'ITEM_LOSS':
        return this.generateItemLoss(context);
      case 'NPC_MOVE':
        return this.generateNPCMove(context);
      case 'POSITION_CHANGE':
        return this.generatePositionChange(context);
      case 'MEMORY_CREATION':
        return this.generateMemoryCreation(context, choiceType);
      default:
        return null;
    }
  }
  
  /**
   * 生成状态变化
   */
  generateStateChange(context, choiceType) {
    const changes = {};
    
    switch (choiceType) {
      case 'observe':
        changes.fear = Math.random() < 0.5 ? -5 : 5; // 观察可能缓解或增加恐惧
        break;
      case 'communicate':
        changes.fear = -3; // 交流缓解恐惧
        changes.hunger = -2; // 分散注意力，减轻饥饿感
        break;
      case 'action':
        changes.fear = Math.random() < 0.7 ? -10 : 10; // 行动通常缓解恐惧，但有时增加
        changes.aggression = 5; // 行动增加戾气
        break;
      case 'give':
        changes.fear = -5; // 给予缓解恐惧
        changes.hunger = 5; // 但增加饥饿（如果给的是食物）
        break;
      case 'threaten':
        changes.fear = -5; // 威胁他人缓解自己的恐惧
        changes.aggression = 10; // 但增加戾气
        break;
    }
    
    return {
      type: 'STATE_CHANGE',
      changes
    };
  }
  
  /**
   * 生成羁绊变化
   */
  generateKnotChange(context, choiceType) {
    let delta = 0;
    
    switch (choiceType) {
      case 'communicate':
        delta = 0.5; // 交流增加羁绊
        break;
      case 'give':
        delta = 1.0; // 给予大幅增加羁绊
        break;
      case 'threaten':
        delta = -1.0; // 威胁减少羁绊
        break;
      case 'observe':
        delta = 0.2; // 观察轻微增加羁绊（陪伴）
        break;
    }
    
    return {
      type: 'KNOT_CHANGE',
      delta
    };
  }
  
  /**
   * 生成敌意变化
   */
  generateHostilityChange(context, choiceType) {
    let delta = 0;
    
    switch (choiceType) {
      case 'threaten':
        delta = 15; // 威胁增加敌意
        break;
      case 'action':
        delta = Math.random() < 0.5 ? 5 : -5; // 行动可能增加或减少敌意
        break;
      case 'give':
        delta = -10; // 给予减少敌意
        break;
    }
    
    return {
      type: 'HOSTILITY_CHANGE',
      delta
    };
  }
  
  /**
   * 生成物品获得
   */
  generateItemGain(context) {
    const possibleItems = [
      { name: '干粮', massO: 1, type: 'food' },
      { name: '旧书', massO: 2, type: 'knowledge' },
      { name: '铜钱', massO: 1, type: 'currency' },
      { name: '信件', massO: 1, type: 'clue' },
      { name: '匕首', massO: 2, type: 'weapon' }
    ];
    
    const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    
    return {
      type: 'ITEM_GAIN',
      item: {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
  }
  
  /**
   * 生成物品失去
   */
  generateItemLoss(context) {
    const { player } = context;
    
    if (!player.inventory || player.inventory.length === 0) {
      return null;
    }
    
    const item = player.inventory[Math.floor(Math.random() * player.inventory.length)];
    
    return {
      type: 'ITEM_LOSS',
      itemId: item.id
    };
  }
  
  /**
   * 生成NPC移动
   */
  generateNPCMove(context) {
    const { spotlightNPC, player } = context;
    
    if (!spotlightNPC) return null;
    
    // NPC可能跟随玩家或离开
    const followPlayer = Math.random() < 0.6;
    
    return {
      type: 'NPC_MOVE',
      npcId: spotlightNPC.id,
      action: followPlayer ? 'follow' : 'leave',
      description: followPlayer ? 'NPC决定跟随你' : 'NPC选择离开'
    };
  }
  
  /**
   * 生成位置变化
   */
  generatePositionChange(context) {
    const { player } = context;
    
    // 玩家位置轻微变化
    const deltaX = (Math.random() - 0.5) * 2;
    const deltaY = (Math.random() - 0.5) * 2;
    
    return {
      type: 'POSITION_CHANGE',
      newPosition: {
        x: player.position.x + deltaX,
        y: player.position.y + deltaY
      }
    };
  }
  
  /**
   * 生成记忆创建
   */
  generateMemoryCreation(context, choiceType) {
    const { spotlightNPC, turn } = context;
    
    if (!spotlightNPC) return null;
    
    const memoryTemplates = {
      observe: `你仔细观察了${spotlightNPC.name}，记住了TA的某些细节`,
      communicate: `你与${spotlightNPC.name}的谈话，成为你们关系的一部分`,
      give: `${spotlightNPC.name}收下了你的礼物，这份恩情被铭记`,
      threaten: `${spotlightNPC.name}记住了你的威胁，关系出现裂痕`,
      action: `你的行动让${spotlightNPC.name}印象深刻`
    };
    
    return {
      type: 'MEMORY_CREATION',
      memory: {
        content: memoryTemplates[choiceType] || `与${spotlightNPC.name}的互动`,
        turn,
        npcId: spotlightNPC.id
      }
    };
  }
  
  /**
   * 应用效果到结果对象
   */
  applyEffectsToResult(result, effects) {
    for (const effect of effects) {
      switch (effect.type) {
        case 'STATE_CHANGE':
          result.stateDelta = { ...result.stateDelta, ...effect.changes };
          break;
        case 'KNOT_CHANGE':
          result.knotDelta = effect.delta;
          result.deepInteraction = true;
          break;
        case 'HOSTILITY_CHANGE':
          result.hostilityDelta = effect.delta;
          break;
        case 'ITEM_GAIN':
          result.itemGained = effect.item;
          break;
        case 'ITEM_LOSS':
          result.itemLost = { id: effect.itemId };
          break;
        case 'MEMORY_CREATION':
          result.memory = effect.memory;
          break;
        case 'NPC_MOVE':
          result.npcMove = effect;
          break;
        case 'POSITION_CHANGE':
          result.positionChange = effect.newPosition;
          break;
      }
    }
  }
  
  /**
   * 生成结果描述文本
   */
  generateResultDescription(result, context) {
    const { spotlightNPC } = context;
    const descriptions = [];
    
    // 状态变化描述
    if (result.stateDelta) {
      const changes = [];
      if (result.stateDelta.fear) {
        changes.push(result.stateDelta.fear > 0 ? '恐惧增加了' : '恐惧减轻了');
      }
      if (result.stateDelta.hunger) {
        changes.push(result.stateDelta.hunger > 0 ? '饥饿感增强了' : '饥饿感减轻了');
      }
      if (result.stateDelta.aggression) {
        changes.push(result.stateDelta.aggression > 0 ? '戾气上升了' : '戾气下降了');
      }
      if (changes.length > 0) {
        descriptions.push(`你感到${changes.join('，')}。`);
      }
    }
    
    // 羁绊变化描述
    if (result.knotDelta) {
      if (result.knotDelta > 0) {
        descriptions.push(`你与${spotlightNPC?.name || 'TA'}的关系加深了。`);
      } else if (result.knotDelta < 0) {
        descriptions.push(`你与${spotlightNPC?.name || 'TA'}的关系疏远了。`);
      }
    }
    
    // 物品变化描述
    if (result.itemGained) {
      descriptions.push(`你获得了${result.itemGained.name}。`);
    }
    if (result.itemLost) {
      descriptions.push(`你失去了某件物品。`);
    }
    
    // 记忆描述
    if (result.memory) {
      descriptions.push(`这段经历将成为你的记忆。`);
    }
    
    return descriptions.join('') || '选择已执行。';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResultDiversitySystem };
}
