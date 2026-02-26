/**
 * 叙事引擎 - 场景生成与AI接口
 */

const { SiliconFlowAI } = require('./SiliconFlowAI');

class NarrativeEngine {
  constructor(aiInterface = null, model = 'deepseek-ai/DeepSeek-V3.2') {
    // 如果传入的是API key，创建SiliconFlowAI实例
    if (typeof aiInterface === 'string') {
      this.ai = new SiliconFlowAI(aiInterface, model);
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
   * 纯叙事风格，通过文字体现状态变化
   */
  buildScenePrompt(context) {
    const { player, npcs, pressure, weather, turn } = context;
    
    // 构建状态提示
    let stateHints = [];
    
    // 压强体现
    if (pressure > 70) {
      stateHints.push("氛围极度紧张：空气凝重、声音刺耳、光线刺眼");
    } else if (pressure > 50) {
      stateHints.push("氛围紧张：细微声响都被放大、人心惶惶");
    } else if (pressure > 30) {
      stateHints.push("氛围压抑：沉默中暗藏不安");
    }
    
    // 玩家状态体现
    if (player.states) {
      if (player.states.fear > 70) {
        stateHints.push("玩家恐惧：手抖、呼吸急促、四处张望");
      } else if (player.states.fear > 40) {
        stateHints.push("玩家不安：警觉、防备姿态");
      }
      
      if (player.states.hunger > 70) {
        stateHints.push("玩家饥饿：虚弱、头晕、胃部绞痛");
      }
      
      if (player.states.aggression > 70) {
        stateHints.push("玩家愤怒：紧握拳头、眼神凶狠");
      }
    }
    
    // 天气体现
    const weatherDesc = {
      'night': '深夜，黑暗笼罩',
      'fog': '浓雾弥漫，能见度低',
      'rain': '阴雨连绵，潮湿阴冷',
      'clear': '天色阴沉，压抑沉闷'
    };
    stateHints.push(weatherDesc[weather] || '天色阴沉');
    
    return {
      role: "你是《72Hours》的叙事导演。你的任务是通过文字让读者感受到角色的状态变化，而不是直接告诉读者数字。",
      
      context: {
        time: `1851年1月${8 + Math.floor(turn/24)}日`,
        location: "金田村",
        pressure: pressure,
        weather: weather,
        playerIdentity: player.identity?.name || '读书人',
        playerTraits: player.traits?.map(t => t.id).join('、'),
        spotlight: context.spotlight?.name || '无'
      },
      
      stateHints: stateHints,
      
      instructions: [
        "通过动作、环境、细节体现角色状态，不要直接说'你很恐惧'",
        "例如：恐惧时写'手指不受控制地颤抖'，而不是'你很害怕'",
        "例如：关系改善时写'她第一次主动靠近你'，而不是'羁绊增加了'",
        "压强高时，让环境也变得更紧张：风声像尖叫、影子像人形",
        "每个场景都要体现玩家的身份特质",
        "100-150字，粗粝、留白、时代感"
      ],
      
      example: {
        good: "煤油灯的火苗剧烈摇晃。母亲的手从你腕上滑落，指节发白。村口有火把在移动，橙红色的光。她把一枚铜钱塞进你手心，冰凉的，圆润的。然后她推了你一把，力道很轻。",
        bad: "你很恐惧，压强是82。母亲很担心你。你们的关系变好了。"
      },
      
      output: "场景描述（通过细节体现状态，不解释心理状态）"
    };
  }

  /**
   * 生成执念
   */
  async generateObsession(obsessionData) {
    if (this.ai) {
      const prompt = `你是一个叙事游戏设计师。请为以下角色生成一个执念：

角色身份：${obsessionData.identityName}
性格特质：${obsessionData.traitsDesc}
时代背景：1851年，金田村，太平天国起义前夕

要求：
1. 执念应该体现角色的身份和特质
2. 与历史背景相关或有张力
3. 简洁有力，15字以内
4. 有文学性和记忆点

请直接输出执念文本，不要解释。`;

      try {
        const result = await this.ai.generate(prompt);
        return result.trim();
      } catch (error) {
        console.error('生成执念失败:', error);
        return '在乱世中活下去';
      }
    }
    
    // 无AI时返回默认
    return '在乱世中活下去';
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
   * 通过叙事体现选择后果
   */
  buildResultPrompt(context, choice) {
    const { player, spotlight, stateChanges = {} } = context;
    
    // 构建变化提示（定性描述，不是数字）
    let changeHints = [];
    
    if (stateChanges.fear) {
      if (stateChanges.fear > 0) {
        changeHints.push("恐惧增加：身体僵硬、呼吸急促、眼神游移");
      } else {
        changeHints.push("恐惧减少：肩膀放松、呼吸平稳");
      }
    }
    
    if (stateChanges.knot) {
      if (stateChanges.knot > 0) {
        changeHints.push("关系改善：对方主动靠近、眼神柔和、肢体放松");
      } else {
        changeHints.push("关系恶化：对方后退、眼神警惕、保持距离");
      }
    }
    
    if (stateChanges.hunger) {
      if (stateChanges.hunger > 0) {
        changeHints.push("饥饿加剧：胃部绞痛、头晕、虚弱");
      } else {
        changeHints.push("饥饿缓解：有了力气、胃部舒适");
      }
    }
    
    return {
      role: "你是《72Hours》的叙事导演。描述选择的结果，通过细节体现变化，不要直接说数字。",
      
      choice: choice.text,
      spotlight: spotlight?.name,
      
      changeHints: changeHints,
      
      instructions: [
        "通过动作、神态、环境变化体现后果",
        "不要直接说'恐惧增加了10点'或'羁绊增加了'",
        "例如：安慰后写'她第一次主动握住你的手'，而不是'羁绊+5'",
        "例如：威胁后写'她后退一步，眼中的信任消失了'，而不是'关系恶化'",
        "50-80字，简洁有力"
      ],
      
      example: {
        good: "她愣了一下，然后慢慢靠近你，头轻轻靠在你肩上。你感觉到她的颤抖渐渐平息。",
        bad: "你安慰了她。她的恐惧减少了10点，你们的关系变好了。"
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

  /**
   * 生成后续叙事（选择后的故事发展）
   */
  async generateFollowUp(context) {
    if (this.ai) {
      const messages = this.buildFollowUpMessages(context);
      return await this.ai.callAPI(messages);
    }
    
    return this.generatePlaceholderFollowUp(context);
  }

  /**
   * 构建后续叙事Prompt
   */
  buildFollowUpMessages(context) {
    const systemPrompt = `你是《72Hours》的叙事导演。
根据刚才的选择结果，生成一段后续叙事，推进故事发展。

【要求】
1. 80-120字，承接上文
2. 描述选择后的直接后果和场景变化
3. 为"下一回合"做铺垫
4. 保持粗粝、留白的叙事风格
5. 使用第二人称"你"

【风格】
- 强调动作和环境变化
- 不解释心理，只呈现外在
- 时代感（1851年清末）`;

    // 使用 ai 实例的 formatContext 方法（如果存在），否则使用简化的上下文
    let userPrompt;
    if (this.ai && this.ai.formatContext) {
      userPrompt = this.ai.formatContext(context) + 
        `\n\n刚才的结果：${context.previousResult?.narrative || '选择已执行'}\n\n请生成后续叙事，推进故事发展：`;
    } else {
      // 简化的上下文描述
      const scene = context.scene || {};
      userPrompt = `=== 当前场景 ===\n时间：${scene.time || '未知'}\n天气：${scene.weather || '未知'}\n环境压强：${scene.pressure || 0}/100\n\n刚才的结果：${context.previousResult?.narrative || '选择已执行'}\n\n请生成后续叙事，推进故事发展：`;
    }

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  generatePlaceholderFollowUp(context) {
    return '故事继续发展，新的情况正在出现...';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NarrativeEngine };
}
