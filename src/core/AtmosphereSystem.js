/**
 * 氛围生成系统 - 根据P值和Ω值生成具体的叙事元素建议
 * 基于 DESIGN.md：物理驱动叙事，故事自己涌现
 */

const { GAME_CONFIG } = require('../utils/Constants');

class AtmosphereSystem {
  constructor(config = GAME_CONFIG) {
    this.config = config;
    
    // 压强P值的叙事元素库
    this.pressureElements = {
      calm: { // P < 30
        range: [0, 30],
        name: '平静期',
        description: '表面平静，暗流涌动',
        environmental: [
          '炊烟袅袅，狗吠鸡鸣',
          '老槐树下，闲人纳凉',
          '灶台前，米香四溢',
          '油灯下，书页翻动'
        ],
        behavioral: [
          '他今天话特别少',
          '眼神躲闪，欲言又止',
          '手指无意识地敲着桌面',
          '望向窗外，似乎在等什么'
        ],
        emotional: [
          '一种说不出的压抑',
          '空气中弥漫着微妙的不安',
          '沉默比往常更重',
          '某种看不见的紧张在蔓延'
        ],
        conflict: [
          '隐晦的暗示',
          '话中有话',
          '眼神交流中的警惕',
          '欲言又止的试探'
        ]
      },
      tense: { // 30 <= P < 50
        range: [30, 50],
        name: '紧张期',
        description: '局势紧张，人们开始警惕',
        environmental: [
          '路上行人神色匆匆',
          '门扉紧闭，窗帘低垂',
          '远处的狗吠声突然停止',
          '风声鹤唳，草木皆兵'
        ],
        behavioral: [
          '脚步加快，不时回头张望',
          '压低声音，警惕地扫视四周',
          '手指攥紧，指节发白',
          '身体紧绷，随时准备逃离'
        ],
        emotional: [
          '恐惧在空气中蔓延',
          '每个人眼中都有警惕',
          '信任变得奢侈',
          '猜疑像野草一样生长'
        ],
        conflict: [
          '言语间的试探',
          '明显的戒备',
          '公开的质疑',
          '紧张的对峙'
        ]
      },
      high: { // 50 <= P < 70
        range: [50, 70],
        name: '高压期',
        description: '危险逼近，冲突一触即发',
        environmental: [
          '火把的光在远处晃动',
          '马蹄声从村口传来',
          '尖叫声划破夜空',
          '门窗砰砰作响'
        ],
        behavioral: [
          '拔刀相向，眼神凶狠',
          '夺门而出，仓皇逃窜',
          '跪地求饶，涕泪横流',
          '疯狂翻找，寻找武器'
        ],
        emotional: [
          '恐慌像瘟疫一样传染',
          '绝望在每个人脸上蔓延',
          '理智被恐惧吞噬',
          '生死存亡的紧迫感'
        ],
        conflict: [
          '肢体冲突',
          '言语威胁',
          '公开对抗',
          '暴力边缘'
        ]
      },
      crisis: { // P >= 70
        range: [70, 100],
        name: '危机期',
        description: '生死存亡，命运即将揭晓',
        environmental: [
          '火光冲天，浓烟滚滚',
          '喊杀声震耳欲聋',
          '血流成河，尸横遍野',
          '房屋倒塌，火光四溅'
        ],
        behavioral: [
          '拼死一搏，鱼死网破',
          '疯狂杀戮，失去理智',
          '护住亲人，以命相搏',
          '跪地等死，放弃抵抗'
        ],
        emotional: [
          '末日降临的绝望',
          '生死一线的恐惧',
          '人性在崩溃边缘',
          '命运不可逆转的无力感'
        ],
        conflict: [
          '生死搏杀',
          '你死我活',
          '全面战争',
          '命运的最终对决'
        ]
      }
    };
    
    // Ω值的叙事元素库
    this.omegaElements = {
      controllable: { // Ω < 2.0
        range: [1.0, 2.0],
        name: '局势可控',
        description: '个人选择仍有意义',
        narrativeHints: [
          '你的决定可以改变命运',
          '还有选择的余地',
          '个人的努力有意义',
          '未来尚未确定'
        ],
        fateSense: '个人英雄主义',
        historySense: '历史尚未加速'
      },
      emerging: { // 2.0 <= Ω < 3.0
        range: [2.0, 3.0],
        name: '大势显现',
        description: '命运感增强',
        narrativeHints: [
          '你感到某种大势正在形成',
          '个人的力量开始显得渺小',
          '历史的车轮开始转动',
          '某种不可阻挡的力量在聚集'
        ],
        fateSense: '命运开始显现',
        historySense: '历史大势初现'
      },
      inevitable: { // 3.0 <= Ω < 4.0
        range: [3.0, 4.0],
        name: '大势已去',
        description: '个人渺小，历史事件即将发生',
        narrativeHints: [
          '你感到大势已去，个人无力回天',
          '历史洪流不可阻挡',
          '个人的选择变得微不足道',
          '命运已经注定，只能随波逐流'
        ],
        fateSense: '命运不可逆转',
        historySense: '历史洪流裹挟一切'
      },
      overwhelming: { // Ω >= 4.0
        range: [4.0, 5.0],
        name: '历史洪流',
        description: '命运被裹挟，大势不可阻挡',
        narrativeHints: [
          '你只是一粒沙，被历史洪流裹挟',
          '个人的存在毫无意义',
          '历史的车轮碾过一切',
          '命运已经写好，你只是旁观者'
        ],
        fateSense: '完全无力',
        historySense: '历史大势完全显现'
      }
    };
  }
  
  /**
   * 根据P值获取氛围配置
   */
  getPressureAtmosphere(pressure) {
    for (const [key, config] of Object.entries(this.pressureElements)) {
      if (pressure >= config.range[0] && pressure < config.range[1]) {
        return { key, ...config };
      }
    }
    return { key: 'crisis', ...this.pressureElements.crisis };
  }
  
  /**
   * 根据Ω值获取氛围配置
   */
  getOmegaAtmosphere(omega) {
    for (const [key, config] of Object.entries(this.omegaElements)) {
      if (omega >= config.range[0] && omega < config.range[1]) {
        return { key, ...config };
      }
    }
    return { key: 'overwhelming', ...this.omegaElements.overwhelming };
  }
  
  /**
   * 生成氛围描述
   */
  generateAtmosphere(pressure, omega, weather, timeOfDay) {
    const pAtmo = this.getPressureAtmosphere(pressure);
    const oAtmo = this.getOmegaAtmosphere(omega);
    
    return {
      pressure: {
        level: pAtmo.key,
        name: pAtmo.name,
        description: pAtmo.description,
        range: pAtmo.range
      },
      omega: {
        level: oAtmo.key,
        name: oAtmo.name,
        description: oAtmo.description,
        range: oAtmo.range
      },
      combined: this.generateCombinedDescription(pAtmo, oAtmo, weather, timeOfDay)
    };
  }
  
  /**
   * 生成组合描述
   */
  generateCombinedDescription(pAtmo, oAtmo, weather, timeOfDay) {
    // P值和Ω值的组合产生独特的氛围
    const combinations = {
      'calm-controllable': '表面平静，但每个人都知道风暴即将来临。你的选择还有意义。',
      'calm-emerging': '平静的表面下，历史的车轮已经开始转动。你感到某种不安。',
      'tense-controllable': '局势紧张，但你仍可以掌控自己的命运。选择变得重要。',
      'tense-emerging': '紧张局势中，你感到大势正在形成。个人的努力开始显得无力。',
      'high-inevitable': '危险逼近，大势已去。你只能选择如何面对，而非改变结果。',
      'crisis-overwhelming': '末日降临，历史洪流裹挟一切。你只是旁观者。'
    };
    
    const key = `${pAtmo.key}-${oAtmo.key}`;
    return combinations[key] || `${pAtmo.description}，${oAtmo.description}`;
  }
  
  /**
   * 生成叙事元素建议（用于AI prompt）
   */
  generateNarrativeHints(pressure, omega) {
    const pAtmo = this.getPressureAtmosphere(pressure);
    const oAtmo = this.getOmegaAtmosphere(omega);
    
    // 随机选择元素
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    return {
      environmental: random(pAtmo.environmental),
      behavioral: random(pAtmo.behavioral),
      emotional: random(pAtmo.emotional),
      conflict: random(pAtmo.conflict),
      omegaHint: random(oAtmo.narrativeHints),
      combined: this.generateCombinedDescription(pAtmo, oAtmo)
    };
  }
  
  /**
   * 生成完整的氛围prompt
   */
  generateAtmospherePrompt(pressure, omega, weather, timeOfDay) {
    const atmo = this.generateAtmosphere(pressure, omega, weather, timeOfDay);
    const hints = this.generateNarrativeHints(pressure, omega);
    
    let prompt = `=== 氛围指南 ===\n\n`;
    
    prompt += `【当前氛围】${atmo.combined}\n\n`;
    
    prompt += `【压强P=${pressure} - ${atmo.pressure.name}】\n`;
    prompt += `描述：${atmo.pressure.description}\n`;
    prompt += `环境元素：${hints.environmental}\n`;
    prompt += `行为特征：${hints.behavioral}\n`;
    prompt += `情绪基调：${hints.emotional}\n`;
    prompt += `冲突水平：${hints.conflict}\n\n`;
    
    prompt += `【全局因子Ω=${omega} - ${atmo.omega.name}】\n`;
    prompt += `描述：${atmo.omega.description}\n`;
    prompt += `命运感：${hints.omegaHint}\n\n`;
    
    prompt += `【写作要求】\n`;
    prompt += `1. 必须体现P=${pressure}的氛围（${atmo.pressure.name}）\n`;
    prompt += `2. 必须体现Ω=${omega}的命运感（${atmo.omega.name}）\n`;
    prompt += `3. 使用提供的环境元素、行为特征、情绪基调\n`;
    prompt += `4. 冲突水平：${hints.conflict}\n`;
    prompt += `5. 通过细节暗示，不要直白描述\n\n`;
    
    return prompt;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AtmosphereSystem };
}
