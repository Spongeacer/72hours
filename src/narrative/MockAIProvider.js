/**
 * Mock AI 提供商 - 用于测试
 */

const { IAIProvider } = require('./IAIProvider');

class MockAIProvider extends IAIProvider {
  constructor(options = {}) {
    super();
    this.delay = options.delay || 100; // 模拟延迟
  }

  async generateNarrative(context) {
    await this._delay();
    const { scene, spotlight } = context;
    const npcName = spotlight?.name || '一个陌生人';
    return `${scene?.time || '深夜'}，${scene?.weather || '寂静'}。你遇到了${npcName}。空气中弥漫着紧张的气息。远处传来隐约的声响。`;
  }

  async generateChoices(context) {
    await this._delay();
    return [
      { id: 1, text: '你沉默地看着对方，手按在刀柄上' },
      { id: 2, text: '你开口说话，声音比想象中更沙哑' },
      { id: 3, text: '你转身，假装没有看见' }
    ];
  }

  async generateResult(context, choice) {
    await this._delay();
    return {
      text: `你做出了选择：${choice?.text || '...'}。事情发生了，但结果还不确定。`,
      stateDelta: { fear: 5 },
      knotDelta: 0.5
    };
  }

  async generateFollowUp(context) {
    await this._delay();
    return '故事继续发展，新的情况正在出现...';
  }

  async generateCharacter(identity, traits) {
    await this._delay();
    
    const names = {
      scholar: ['周文远', '李书田', '王墨轩'],
      landlord: ['陈德厚', '张富贵', '刘守业'],
      soldier: ['李铁柱', '赵大勇', '孙武'],
      cultist: ['杨阿福', '王信', '张恩典']
    };
    
    const name = names[identity]?.[Math.floor(Math.random() * 3)] || '无名氏';
    
    return {
      name,
      age: 20 + Math.floor(Math.random() * 30),
      backstory: `这是一个${identity}的背景故事。`,
      startingLocation: '某个地方',
      items: ['物品1', '物品2'],
      relations: [{ name: '某人', relation: '某种关系' }],
      secret: '这是一个秘密'
    };
  }

  /**
   * 流式生成叙事
   * @param {Object} context - 游戏上下文
   * @param {Function} onChunk - 流式回调
   * @returns {Promise<Object>} 包含 narrative 和 choices 的对象
   */
  async generateNarrativeStream(context, onChunk) {
    const narrative = await this.generateNarrative(context);
    
    // 模拟流式输出
    if (onChunk) {
      const words = narrative.split('');
      let fullText = '';
      for (const word of words) {
        fullText += word;
        onChunk(word, fullText, false);
        await new Promise(r => setTimeout(r, 10));
      }
      onChunk('', fullText, true);
    }
    
    return { narrative, choices: await this.generateChoices(context) };
  }

  /**
   * 流式生成结果
   * @param {Object} context - 游戏上下文
   * @param {Object} choice - 玩家选择
   * @param {Function} onChunk - 流式回调
   * @returns {Promise<Object>} 包含 result 和 followUpNarrative 的对象
   */
  async generateResultStream(context, choice, onChunk) {
    const result = await this.generateResult(context, choice);
    
    // 模拟流式输出
    if (onChunk) {
      const text = result.text;
      let fullText = '';
      for (const char of text) {
        fullText += char;
        onChunk(char, fullText, false);
        await new Promise(r => setTimeout(r, 10));
      }
      onChunk('', fullText, 'followup_start');
      
      // 模拟后续叙事
      const followUp = '故事继续发展...';
      let followUpText = '';
      for (const char of followUp) {
        followUpText += char;
        onChunk(char, followUpText, 'followup_generating');
        await new Promise(r => setTimeout(r, 10));
      }
      onChunk('', followUpText, true);
    }
    
    return { result, followUpNarrative: '故事继续发展...' };
  }

  _delay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }
}

module.exports = { MockAIProvider };
