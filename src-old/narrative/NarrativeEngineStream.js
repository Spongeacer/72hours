/**
 * 流式叙事引擎 - 支持 SSE 流式输出
 */

const { SiliconFlowAIStream } = require('./SiliconFlowAIStream');

class NarrativeEngineStream {
  constructor(aiInterface = null, model = 'deepseek-ai/DeepSeek-V3.2') {
    if (typeof aiInterface === 'string') {
      this.ai = new SiliconFlowAIStream(aiInterface, model);
    } else if (aiInterface) {
      this.ai = aiInterface;
    } else {
      this.ai = null;
    }
  }

  /**
   * 流式生成场景叙事
   * @param {Object} context - 游戏上下文
   * @param {Function} onChunk - 每个数据块的回调 (chunk, fullText, isComplete)
   * @returns {Promise<Object>} 包含 narrative 和 choices 的对象
   */
  async generateSceneStream(context, onChunk) {
    if (!this.ai) {
      const result = this.generatePlaceholderScene(context);
      if (onChunk) onChunk(result.narrative, result.narrative, true);
      return result;
    }

    // 先流式生成叙事
    let narrative = '';
    const { narrative: generatedNarrative, choices } = await this.ai.generateNarrativeStream(context, (chunk, fullText) => {
      narrative = fullText;
      if (onChunk) onChunk(chunk, fullText, false);
    });

    // 叙事完成后，生成选择
    if (onChunk) onChunk('', narrative || generatedNarrative, 'choices_start');
    
    if (onChunk) onChunk('', narrative || generatedNarrative, true);

    return {
      narrative: narrative || generatedNarrative,
      choices
    };
  }

  /**
   * 流式生成结果
   * @param {Object} context - 游戏上下文
   * @param {Object} choice - 玩家选择
   * @param {Function} onChunk - 每个数据块的回调
   * @returns {Promise<Object>} 包含 result 和 followUpNarrative 的对象
   */
  async generateResultStream(context, choice, onChunk) {
    if (!this.ai) {
      const result = this.generatePlaceholderResult(context, choice);
      if (onChunk) onChunk(result.text, result.text, true);
      return { result, followUpNarrative: null };
    }

    // 流式生成结果描述
    const { result } = await this.ai.generateResultStream(context, choice, (chunk, fullText) => {
      if (onChunk) onChunk(chunk, fullText, false);
    });

    // 结果完成后，生成后续叙事
    if (onChunk) onChunk('', result?.text || '', 'followup_start');

    const followUpContext = {
      ...context,
      previousResult: { narrative: result?.text || '' }
    };

    let followUpNarrative = '';
    // 使用 generateFollowUp 获取后续叙事
    followUpNarrative = await this.ai.generateFollowUp(followUpContext);

    if (onChunk) onChunk('', followUpNarrative, true);

    return {
      result,
      followUpNarrative
    };
  }

  /**
   * 生成场景叙事（非流式，兼容旧接口）
   * @param {Object} context - 游戏上下文
   * @returns {Promise<string>} 叙事文本
   */
  async generateScene(context) {
    if (!this.ai) {
      return this.generatePlaceholderScene(context).narrative;
    }
    const result = await this.generateSceneStream(context);
    return result.narrative;
  }

  /**
   * 生成选择（非流式，兼容旧接口）
   * @param {Object} context - 游戏上下文
   * @returns {Promise<Array>} 选择数组
   */
  async generateChoices(context) {
    if (!this.ai) {
      return this.generatePlaceholderScene(context).choices;
    }
    const result = await this.generateSceneStream(context);
    return result.choices;
  }

  /**
   * 生成结果（非流式，兼容旧接口）
   * @param {Object} context - 游戏上下文
   * @param {Object} choice - 玩家选择
   * @returns {Promise<Object>} 结果对象
   */
  async generateResult(context, choice) {
    if (!this.ai) {
      return this.generatePlaceholderResult(context, choice);
    }
    const result = await this.generateResultStream(context, choice);
    return result.result;
  }

  /**
   * 生成后续叙事（非流式，兼容旧接口）
   * @param {Object} context - 游戏上下文
   * @returns {Promise<string>} 后续叙事
   */
  async generateFollowUp(context) {
    if (!this.ai) {
      return this.generatePlaceholderFollowUp(context);
    }
    // 使用流式方法但不传递回调
    let followUpNarrative = '';
    await this.generateResultStream(context, {}, (chunk, fullText, stage) => {
      if (stage === 'followup_generating' || stage === true) {
        followUpNarrative = fullText;
      }
    });
    return followUpNarrative;
  }

  // ========== 流式方法 ==========

  generatePlaceholderScene(context) {
    const { spotlight, scene } = context;
    const npcName = spotlight?.name || '一个陌生人';
    
    return {
      narrative: `${scene.time}，${scene.weather}。你遇到了${npcName}。空气中弥漫着紧张的气息。`,
      choices: [
        { id: 1, text: '你沉默地看着对方，手按在刀柄上' },
        { id: 2, text: '你开口说话，声音比想象中更沙哑' },
        { id: 3, text: '你转身，假装没有看见' }
      ]
    };
  }

  generatePlaceholderResult(context, choice) {
    return {
      text: `你做出了选择。事情发生了，但结果还不确定。`,
      stateDelta: { fear: 5 },
      knotDelta: 0.5
    };
  }
}

module.exports = { NarrativeEngineStream };
