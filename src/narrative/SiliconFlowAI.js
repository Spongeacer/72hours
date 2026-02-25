/**
 * AI接口实现 - 硅基流动 (SiliconFlow)
 */

const { GAME_CONFIG } = require('../utils/Constants');

class SiliconFlowAI {
  constructor(apiKey, model = 'Qwen/Qwen2.5-72B-Instruct') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.siliconflow.cn/v1';
  }

  /**
   * 生成叙事文本
   */
  async generateNarrative(promptData) {
    const messages = this.buildNarrativeMessages(promptData);
    return await this.callAPI(messages);
  }

  /**
   * 生成选择
   */
  async generateChoices(promptData) {
    const messages = this.buildChoicesMessages(promptData);
    const response = await this.callAPI(messages);
    return this.parseChoicesResponse(response);
  }

  /**
   * 生成结果
   */
  async generateResult(promptData, choice) {
    const messages = this.buildResultMessages(promptData, choice);
    const response = await this.callAPI(messages);
    return this.parseResultResponse(response);
  }

  /**
   * 构建叙事生成的messages
   */
  buildNarrativeMessages(data) {
    const systemPrompt = `你是《72Hours》的叙事导演。
你的任务是根据游戏状态生成沉浸式的叙事文本。

【核心机制说明】
1. 环境压强P(0-100)：代表局势紧张程度
   - P<30：相对平静，可以日常互动
   - P 30-60：紧张，人们开始警惕
   - P 60-80：危险，冲突随时爆发
   - P>80：极度危险，生死关头

2. 全局因子Ω(1.0-5.0)：代表历史大势的推进
   - Ω越高，命运感越强，个人越渺小
   - Ω>2.0时，历史事件开始强制发生

3. 关系羁绊K(0-10)：代表你与NPC的关系深度
   - K越高，NPC越信任你，互动越深入
   - K变化要在叙事中体现

风格要求：
- 粗粝、留白、时代感（1851年清末）
- 强调动作细节和环境渗透
- 不解释角色心理，只呈现外在行为
- 100-150字，一个完整的瞬间
- 使用第二人称"你"
- 必须体现当前的P值氛围（紧张/危险/平静）

禁止：
- 现代用语和网络用语
- 直白的心理描写（如"他感到害怕"）
- 解释性的叙述（如"这是因为..."）`;

    const userPrompt = this.formatContext(data);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 构建选择生成的messages
   */
  buildChoicesMessages(data) {
    const systemPrompt = `你是《72Hours》的叙事导演。
根据当前场景生成3个开放的选择。

格式要求：
- 以"你..."开头
- 描述动作或状态，不预设结果
- 每个选择15-25字
- 选择之间要有明显的风格差异

示例：
1. 你沉默地看着对方，手按在刀柄上
2. 你开口说话，声音比想象中更沙哑  
3. 你转身走向雨里，不回头`;

    const userPrompt = this.formatContext(data) + '\n\n请生成3个选择：';

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 构建结果生成的messages
   */
  buildResultMessages(data, choice) {
    const systemPrompt = `你是《72Hours》的叙事导演。
根据玩家的选择生成结果描述和状态变化。

【要求】
1. 结果描述：80-120字，描述选择后的直接后果
2. 必须包含具体的动作和场景变化
3. 体现玩家选择对NPC和关系的影响
4. 保持粗粝的叙事风格

【状态变化规则】
- 安慰/温和选择：fear -5~10, knot +0.5~1
- 愤怒/激进选择：aggression +5~10, hostility +10
- 逃跑/回避选择：fear +5, 可能失去机会
- 给予/帮助选择：knot +1, hunger -5
- 深度互动：trapConstant +0.5

【输出格式】
结果描述：[叙事文本]
状态变化：fear ±X, aggression ±X, hunger ±X, knot ±X`;

    const userPrompt = this.formatContext(data) + 
      `\n\n玩家选择：${choice.text}\n\n请生成结果描述和状态变化：\n` +
      `注意：要具体描述发生了什么，不要只说"你做出了选择"。`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  /**
   * 格式化上下文
   */
  formatContext(data) {
    const { scene, spotlight, player, event, memories } = data;
    
    let context = `=== 当前场景 ===\n`;
    context += `时间：${scene.time}\n`;
    context += `天气：${scene.weather}\n`;
    context += `环境压强：${scene.pressure}（0-100，越高越紧张）\n`;
    context += `全局因子：${scene.omega}（1.0-5.0，历史大势的推进）\n\n`;
    
    if (event) {
      context += `*** 特殊事件：${event.id} ***\n\n`;
    }
    
    if (spotlight) {
      context += `=== 聚光灯NPC ===\n`;
      context += `姓名：${spotlight.name}\n`;
      context += `特质：${spotlight.traits?.join(', ') || '未知'}\n`;
      context += `执念：${spotlight.obsession || '未知'}\n`;
      context += `状态：恐惧${spotlight.states?.fear}%, 戾气${spotlight.states?.aggression}%\n`;
      context += `与你的关系：${spotlight.knotWithPlayer || 0}/10\n\n`;
    }
    
    context += `=== 玩家状态 ===\n`;
    context += `身份：${player.identity}\n`;
    context += `特质：${player.traits?.join(', ') || '无'}\n`;
    context += `状态：恐惧${player.states?.fear}%, 戾气${player.states?.aggression}%, 饥饿${player.states?.hunger}%\n`;
    context += `气场：${player.aura}\n`;
    context += `携带：${player.inventory?.join(', ') || '无'}\n\n`;
    
    if (memories && memories.length > 0) {
      context += `=== 相关记忆 ===\n`;
      memories.forEach(m => {
        context += `- ${m.content}\n`;
      });
    }
    
    return context;
  }

  /**
   * 调用API
   */
  async callAPI(messages) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.8,
          max_tokens: 500,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API调用失败: ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI调用失败:', error);
      // 返回占位文本
      return this.getFallbackResponse(messages);
    }
  }

  /**
   * 解析选择响应
   */
  parseChoicesResponse(response) {
    const lines = response.split('\n').filter(l => l.trim());
    const choices = [];
    
    for (let i = 0; i < lines.length && choices.length < 3; i++) {
      const line = lines[i].trim();
      // 匹配 "1. xxx" 或 "- xxx" 格式
      const match = line.match(/^(?:\d+[.\s]+|-\s*)(.+)$/);
      if (match) {
        choices.push({
          id: choices.length + 1,
          text: match[1].trim()
        });
      }
    }
    
    // 如果解析失败，返回默认选择
    if (choices.length === 0) {
      return [
        { id: 1, text: '你沉默地看着对方，手按在刀柄上' },
        { id: 2, text: '你开口说话，声音比想象中更沙哑' },
        { id: 3, text: '你转身，假装没有看见' }
      ];
    }
    
    return choices;
  }

  /**
   * 解析结果响应
   */
  parseResultResponse(response) {
    // 提取结果描述（在"状态变化"之前的部分）
    const resultMatch = response.match(/(.+?)(?=状态变化|$)/s);
    const resultText = resultMatch ? resultMatch[1].trim() : response.trim();
    
    // 提取状态变化
    const stateDelta = {};
    const knotMatch = response.match(/knot\s*([+-]\d+\.?\d*)/i);
    const fearMatch = response.match(/fear\s*([+-]\d+)/i);
    const aggMatch = response.match(/aggression\s*([+-]\d+)/i);
    const hungerMatch = response.match(/hunger\s*([+-]\d+)/i);
    
    if (fearMatch) stateDelta.fear = parseInt(fearMatch[1]);
    if (aggMatch) stateDelta.aggression = parseInt(aggMatch[1]);
    if (hungerMatch) stateDelta.hunger = parseInt(hungerMatch[1]);
    
    // 默认变化
    if (Object.keys(stateDelta).length === 0) {
      stateDelta.fear = 5;
    }
    
    return {
      text: resultText,
      stateDelta: stateDelta,
      knotDelta: knotMatch ? parseFloat(knotMatch[1]) : 0.5
    };
  }

  /**
   * 获取备用响应
   */
  getFallbackResponse(messages) {
    return '（AI服务暂时不可用，使用默认叙事）';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SiliconFlowAI };
}
