/**
 * 叙事引擎 - 场景生成与AI接口
 */

const { SiliconFlowAI } = require('./SiliconFlowAI');

class NarrativeEngine {
  constructor(aiInterface = null) {
    // 如果传入的是API key，创建SiliconFlowAI实例
    if (typeof aiInterface === 'string') {
      this.ai = new SiliconFlowAI(aiInterface);
    } else if (aiInterface) {
      this.ai = aiInterface;
    } else {
      this.ai = null;
    }
  }

  /**
   * 生成场景叙事
   */
  async generateScene(context) {
    // 如果有AI接口，调用AI生成
    if (this.ai) {
      return await this.ai.generateNarrative(context);
    }
    
    // 否则返回占位文本
    return this.generatePlaceholderScene(context);
  }

  /**
   * 生成选择
   */
  async generateChoices(context) {
    if (this.ai) {
      return await this.ai.generateChoices(context);
    }
    
    return this.generatePlaceholderChoices(context);
  }

  /**
   * 生成结果描述
   */
  async generateResult(context, choice) {
    if (this.ai) {
      return await this.ai.generateResult(context, choice);
    }
    
    return this.generatePlaceholderResult(context, choice);
  }

  /**
   * 生成死亡后记
   */
  async generateDeathEpilogue(player) {
    if (this.aiInterface) {
      const prompt = this.buildDeathPrompt(player);
      return await this.aiInterface.generate(prompt);
    }
    
    return `你死了。历史继续，太平天国将在72小时后爆发。`;
  }

  /**
   * 生成结局后记
   */
  async generateEndingEpilogue(player) {
    if (this.aiInterface) {
      const prompt = this.buildEndingPrompt(player);
      return await this.aiInterface.generate(prompt);
    }
    
    return `第72回合，金田起义爆发。你的故事结束了。`;
  }

  /**
   * 构建场景生成Prompt
   */
  buildScenePrompt(context) {
    return {
      role: "你是《72Hours》的叙事导演。",
      input: {
        scene: context.scene,
        spotlight: context.spotlight,
        player: context.player,
        event: context.event,
        memories: context.memories
      },
      output: {
        narrative: "100-150字的场景描述",
        atmosphere: "氛围关键词"
      },
      style: {
        tone: "粗粝、留白、时代感",
        focus: ["动作细节", "环境渗透", "不解释心理"],
        avoid: ["解释动机", "直白情感", "现代用语"]
      }
    };
  }

  /**
   * 构建选择生成Prompt
   */
  buildChoicesPrompt(context) {
    return {
      role: "你是《72Hours》的叙事导演。",
      input: {
        scene: context.scene,
        spotlight: context.spotlight,
        player: context.player
      },
      output: {
        choices: [
          { id: 1, text: "开放描述的选择1" },
          { id: 2, text: "开放描述的选择2" },
          { id: 3, text: "开放描述的选择3" }
        ]
      },
      style: {
        format: "以'你...'开头，描述动作或状态，不预设结果"
      }
    };
  }

  /**
   * 构建结果生成Prompt
   */
  buildResultPrompt(context, choice) {
    return {
      role: "你是《72Hours》的叙事导演。",
      input: {
        scene: context.scene,
        spotlight: context.spotlight,
        player: context.player,
        choice: choice
      },
      output: {
        result: "选择后的结果描述",
        stateDelta: {},
        knotDelta: 0
      }
    };
  }

  // ========== 占位生成器（无AI时） ==========

  generatePlaceholderScene(context) {
    const { spotlight, scene } = context;
    const npcName = spotlight?.name || '一个陌生人';
    
    return `${scene.time}，${scene.weather}。你遇到了${npcName}。空气中弥漫着紧张的气息。`;
  }

  generatePlaceholderChoices(context) {
    return [
      { id: 1, text: '你沉默地看着对方，手按在刀柄上' },
      { id: 2, text: '你开口说话，声音比想象中更沙哑' },
      { id: 3, text: '你转身，假装没有看见' }
    ];
  }

  generatePlaceholderResult(context, choice) {
    return {
      text: `你做出了选择。事情发生了，但结果还不确定。`,
      stateDelta: { fear: 5 },
      knotDelta: 1
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NarrativeEngine };
}
