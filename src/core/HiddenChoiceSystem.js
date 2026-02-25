/**
 * 隐藏选择系统 - 基于条件解锁的特殊选择
 * 基于 DESIGN.md：玩家是催化剂，物理驱动叙事
 */

const { GAME_CONFIG } = require('../utils/Constants');

class HiddenChoiceSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    
    // 隐藏选择模板库
    this.hiddenChoiceTemplates = {
      // 高K值解锁（羁绊深厚）
      highKnot: {
        id: 'hidden_high_knot',
        condition: (context) => {
          const knot = context.spotlight?.knotWithPlayer || 0;
          return knot >= 7;
        },
        choices: [
          {
            text: '你握住TA的手，低声说出藏在心底的秘密',
            description: '羁绊达到7以上解锁，可以分享内心深处的想法',
            effect: 'knot+1, memory+1, special_bond'
          },
          {
            text: '你把最珍贵的物品交给TA保管',
            description: '羁绊达到7以上解锁，体现深度信任',
            effect: 'item_transfer, knot+0.5, trust+10'
          },
          {
            text: '你请求TA和你一起离开这个村子',
            description: '羁绊达到8以上解锁，邀请NPC共同行动',
            effect: 'npc_follow, knot+1, story_branch'
          }
        ]
      },
      
      // 特定物品解锁
      hasItem: {
        id: 'hidden_has_item',
        condition: (context) => {
          const inventory = context.player?.inventory || [];
          return inventory.length > 0;
        },
        choices: [
          {
            text: '你悄悄取出怀中的{item}，在桌下递给TA',
            description: '携带物品时解锁，可以赠送物品',
            effect: 'item_give, knot+0.5, gratitude'
          },
          {
            text: '你展示{item}，询问TA是否知道它的来历',
            description: '携带线索物品时解锁，可以询问信息',
            effect: 'clue_discover, info_gain'
          }
        ]
      },
      
      // 高P值解锁（危机时刻）
      highPressure: {
        id: 'hidden_high_pressure',
        condition: (context) => {
          const pressure = context.scene?.pressure || 0;
          return pressure >= 60;
        },
        choices: [
          {
            text: '你拔腿就跑，顾不上回头看',
            description: '压强60以上解锁，恐慌性逃跑',
            effect: 'escape, fear+10, npc_react'
          },
          {
            text: '你把TA护在身后，准备拼死一搏',
            description: '压强60以上且羁绊5以上解锁，保护NPC',
            effect: 'protect, knot+1, bravery+10, risk_injury'
          },
          {
            text: '你大声呼喊，试图引起其他人的注意',
            description: '压强60以上解锁，公开求救',
            effect: 'attract_attention, event_trigger, risk_discovery'
          }
        ]
      },
      
      // 高Ω值解锁（大势已去）
      highOmega: {
        id: 'hidden_high_omega',
        condition: (context) => {
          const omega = parseFloat(context.scene?.omega) || 1.0;
          return omega >= 3.0;
        },
        choices: [
          {
            text: '你跪倒在地，接受命运的安排',
            description: 'Ω值3以上解锁，放弃抵抗',
            effect: 'surrender, fate_accept, story_end_variant'
          },
          {
            text: '你疯狂大笑，在末日来临之际失去理智',
            description: 'Ω值3.5以上且恐惧80以上解锁，精神崩溃',
            effect: 'madness, story_branch, npc_fear'
          }
        ]
      },
      
      // 特定时间解锁
      specialTime: {
        id: 'hidden_special_time',
        condition: (context) => {
          const hour = new Date(context.scene?.time).getHours();
          return hour >= 0 && hour < 5; // 深夜
        },
        choices: [
          {
            text: '你趁着夜色掩护，悄悄潜入祠堂',
            description: '深夜时段解锁，可以执行秘密行动',
            effect: 'stealth, location_change, clue_discover, risk_caught'
          },
          {
            text: '你在黑暗中等待，直到听到约定的暗号',
            description: '深夜时段且有关联NPC解锁，秘密会面',
            effect: 'secret_meeting, info_gain, knot+0.5'
          }
        ]
      },
      
      // 特定天气解锁
      specialWeather: {
        id: 'hidden_special_weather',
        condition: (context) => {
          const weather = context.scene?.weather;
          return weather === 'fog' || weather === 'rain';
        },
        choices: [
          {
            text: '你借着雾气的掩护，迅速离开现场',
            description: '雾天解锁，可以隐秘移动',
            effect: 'stealth_escape, position_change, untracked'
          },
          {
            text: '你在雨中大声哭泣，让泪水和雨水混在一起',
            description: '雨天且恐惧60以上解锁，情绪宣泄',
            effect: 'emotional_release, fear-10, vulnerability'
          }
        ]
      },
      
      // 特定NPC特质解锁
      npcTrait: {
        id: 'hidden_npc_trait',
        condition: (context) => {
          const traits = context.spotlight?.traits || [];
          return traits.includes('scholar') || traits.includes('compassionate');
        },
        choices: [
          {
            text: '你引用《论语》中的话，试图打动TA',
            description: '对方是读书人时解锁，文化共鸣',
            effect: 'cultural_resonance, knot+0.5, respect+5'
          },
          {
            text: '你讲述自己的苦难，唤起TA的同情心',
            description: '对方富有同情心时解锁，情感诉求',
            effect: 'empathy_trigger, knot+0.8, help_offered'
          }
        ]
      },
      
      // 组合条件解锁（最难触发）
      combo: {
        id: 'hidden_combo',
        condition: (context) => {
          const knot = context.spotlight?.knotWithPlayer || 0;
          const pressure = context.scene?.pressure || 0;
          const omega = parseFloat(context.scene?.omega) || 1.0;
          const hour = new Date(context.scene?.time).getHours();
          
          // 高羁绊 + 高压力 + 高Ω值 + 深夜
          return knot >= 8 && pressure >= 70 && omega >= 3.5 && (hour >= 0 && hour < 5);
        },
        choices: [
          {
            text: '你跪在TA面前，请求TA和你一起殉情',
            description: '最高难度解锁：羁绊8+、压力70+、Ω3.5+、深夜',
            effect: 'ultimate_choice, story_branch, npc_test, fate_decide'
          }
        ]
      }
    };
  }
  
  /**
   * 检查并生成隐藏选择
   */
  checkHiddenChoices(context) {
    const hiddenChoices = [];
    
    for (const [key, template] of Object.entries(this.hiddenChoiceTemplates)) {
      // 检查条件
      if (template.condition(context)) {
        // 随机选择该类别中的一个选项
        const choice = template.choices[Math.floor(Math.random() * template.choices.length)];
        
        // 个性化文本（如果有物品）
        let personalizedText = choice.text;
        if (personalizedText.includes('{item}')) {
          const inventory = context.player?.inventory || [];
          const itemName = inventory.length > 0 ? inventory[0] : '某物';
          personalizedText = personalizedText.replace('{item}', itemName);
        }
        
        hiddenChoices.push({
          id: `${template.id}_${hiddenChoices.length}`,
          type: 'hidden',
          category: key,
          text: personalizedText,
          description: choice.description,
          effect: choice.effect,
          unlocked: true
        });
      }
    }
    
    // 限制隐藏选择数量，避免过多
    return hiddenChoices.slice(0, 2);
  }
  
  /**
   * 生成隐藏选择提示（用于AI）
   */
  generateHiddenChoicePrompt(context) {
    const hiddenChoices = this.checkHiddenChoices(context);
    
    if (hiddenChoices.length === 0) {
      return null;
    }
    
    let prompt = `=== 隐藏选择 ===\n`;
    prompt += `以下特殊选择已根据当前条件解锁：\n\n`;
    
    for (const choice of hiddenChoices) {
      prompt += `【${choice.category}】${choice.text}\n`;
      prompt += `说明：${choice.description}\n`;
      prompt += `效果：${choice.effect}\n\n`;
    }
    
    prompt += `请在生成选择时考虑加入这些隐藏选项（最多1-2个）。\n`;
    prompt += `隐藏选择应该比普通选择更有影响力，但也更有风险。\n`;
    
    return prompt;
  }
  
  /**
   * 处理隐藏选择结果
   */
  processHiddenChoice(choice, context) {
    if (choice.type !== 'hidden') {
      return null;
    }
    
    const effects = {
      knotDelta: 0,
      stateDelta: {},
      specialEffect: null,
      narrative: ''
    };
    
    // 根据隐藏选择类型处理效果
    switch (choice.category) {
      case 'highKnot':
        effects.knotDelta = 1;
        effects.narrative = '你们的羁绊在这一刻达到了新的深度。';
        break;
      case 'hasItem':
        effects.specialEffect = 'item_transfer';
        effects.narrative = '物品的转移改变了你们之间的关系。';
        break;
      case 'highPressure':
        effects.stateDelta = { fear: -5, aggression: 10 };
        effects.narrative = '在危机时刻，你做出了决定性的选择。';
        break;
      case 'highOmega':
        effects.specialEffect = 'fate_moment';
        effects.narrative = '你感受到了命运的重压。';
        break;
      case 'specialTime':
        effects.specialEffect = 'stealth_action';
        effects.narrative = '在黑暗中，你完成了秘密的行动。';
        break;
      case 'specialWeather':
        effects.stateDelta = { fear: -10 };
        effects.narrative = '天气成为了你的掩护。';
        break;
      case 'npcTrait':
        effects.knotDelta = 0.5;
        effects.narrative = '你找到了与TA共鸣的方式。';
        break;
      case 'combo':
        effects.knotDelta = 2;
        effects.specialEffect = 'ultimate_decision';
        effects.narrative = '这是一个改变一切的时刻。';
        break;
    }
    
    return effects;
  }
  
  /**
   * 获取已解锁的隐藏选择类型
   */
  getUnlockedCategories(context) {
    const unlocked = [];
    
    for (const [key, template] of Object.entries(this.hiddenChoiceTemplates)) {
      if (template.condition(context)) {
        unlocked.push(key);
      }
    }
    
    return unlocked;
  }
  
  /**
   * 生成隐藏选择统计
   */
  getStats() {
    return {
      totalCategories: Object.keys(this.hiddenChoiceTemplates).length,
      categories: Object.keys(this.hiddenChoiceTemplates)
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HiddenChoiceSystem };
}
