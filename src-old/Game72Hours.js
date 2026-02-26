/**
 * Game72Hours - 游戏主类
 */

const { Player } = require('./agents/Player');
const { NPC } = require('./agents/NPC');
const { TurnManager } = require('./core/TurnManager');
const { NarrativeEngine } = require('./narrative/NarrativeEngine');
const { GAME_CONFIG } = require('./utils/Constants');
const { Utils } = require('./utils/Utils');

class Game72Hours {
  constructor(options = {}) {
    this.config = { ...GAME_CONFIG, ...options.config };
    this.aiInterface = options.aiInterface || null;
    this.model = options.model || 'deepseek-ai/DeepSeek-V3.2';
    
    // 游戏状态
    this.gameState = {
      turn: 0,
      datetime: new Date('1851-01-08T00:00:00'),
      pressure: 10,
      omega: 1.0,
      weather: 'night',
      player: null,
      npcs: [],
      history: [],
      config: this.config
    };
    
    // 核心系统
    this.narrativeEngine = new NarrativeEngine(this.aiInterface, this.model);
    this.turnManager = null;
    
    this.isRunning = false;
    this.isGameOver = false;
  }

  /**
   * 初始化游戏（并发优化版）
   */
  async init(identityType = 'scholar') {
    // 创建玩家
    this.gameState.player = new Player(identityType);
    
    // 步骤1: 同步生成特质（本地随机，不需要API）
    this.generatePlayerTraits();
    
    // 创建关联NPC（此时NPC还没有特质和执念）
    this.createBondedNPCs();
    
    // 创建精英NPC
    this.createEliteNPCs();
    
    // 步骤2: 并发生成所有角色的执念
    await this.generateAllObsessionsConcurrently();
    
    // 初始化回合管理器
    this.turnManager = new TurnManager(this.gameState, this.narrativeEngine);
    this.turnManager.currentContext = null;
    
    this.isRunning = true;
    
    return {
      player: this.gameState.player,
      bondedNPCs: this.gameState.player.bondedNPCs,
      opening: this.generateOpening()
    };
  }

  /**
   * 并发生成所有角色的执念
   */
  async generateAllObsessionsConcurrently() {
    const { player } = this.gameState;
    
    // 为NPC生成特质
    this.gameState.npcs.forEach(npc => {
      if (npc.isBonded) {
        this.generateNPCTraits(npc);
      }
    });
    
    // 准备所有需要生成执念的角色
    const obsessionTasks = [];
    
    // 玩家执念任务
    const playerObsessionData = player.generateObsession();
    obsessionTasks.push({
      type: 'player',
      target: player,
      data: playerObsessionData
    });
    
    // NPC执念任务
    this.gameState.npcs.forEach(npc => {
      if (npc.isBonded) {
        const npcObsessionData = npc.generateObsession();
        obsessionTasks.push({
          type: 'npc',
          target: npc,
          data: npcObsessionData
        });
      }
    });
    
    console.log(`[Game] 开始并发生成${obsessionTasks.length}个角色的执念...`);
    
    // 并发执行所有执念生成
    const results = await Promise.allSettled(
      obsessionTasks.map(task => this.generateObsessionForCharacter(task))
    );
    
    // 统计结果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[Game] 执念生成完成: ${succeeded}成功, ${failed}失败`);
  }

  /**
   * 为单个角色生成执念
   */
  async generateObsessionForCharacter(task) {
    const { target, data } = task;
    
    if (this.narrativeEngine && this.narrativeEngine.ai) {
      try {
        const obsessionText = await this.narrativeEngine.generateObsession(data);
        target.obsession = obsessionText;
        console.log(`[Game] ${task.type === 'player' ? '玩家' : target.name}执念: ${obsessionText}`);
        return obsessionText;
      } catch (error) {
        console.error(`[Game] 生成${task.type === 'player' ? '玩家' : target.name}执念失败:`, error);
        target.obsession = `在${data.traitsDesc}的驱使下活下去`;
        throw error;
      }
    } else {
      // 无AI时使用简单描述
      target.obsession = `在${data.traitsDesc}的驱使下活下去`;
      return target.obsession;
    }
  }

  /**
   * 生成玩家特质
   * 完全随机抽取性格特质，不限制身份
   */
  generatePlayerTraits() {
    const { player } = this.gameState;
    const identity = player.identity;
    
    // 添加身份特质
    if (identity.trait) {
      player.traits.push({ id: identity.trait, type: 'identity' });
    }
    if (identity.traits) {
      identity.traits.forEach(t => {
        player.traits.push({ id: t, type: 'identity' });
      });
    }
    
    // 从特质库完全随机抽取性格特质
    const { MIN_TRAITS, MAX_TRAITS } = GAME_CONFIG.TRAIT_CONFIG;
    const numTraits = Math.floor(Math.random() * (MAX_TRAITS - MIN_TRAITS + 1)) + MIN_TRAITS;
    
    const allTraits = Object.keys(GAME_CONFIG.PERSONALITY_TRAITS);
    const selectedTraits = [];
    
    for (let i = 0; i < numTraits; i++) {
      // 从所有特质中随机抽取（排除已选的）
      const availableTraits = allTraits.filter(t => !selectedTraits.includes(t));
      
      if (availableTraits.length > 0) {
        const randomTrait = availableTraits[Math.floor(Math.random() * availableTraits.length)];
        selectedTraits.push(randomTrait);
        player.traits.push({ id: randomTrait, type: 'personality' });
      }
    }
    
    console.log(`[Game] 玩家特质生成完成: ${selectedTraits.join(', ')}`);
  }

  /**
   * 生成NPC特质
   */
  generateNPCTraits(npc) {
    // NPC也从特质库随机抽取2-3个特质
    const { MIN_TRAITS, MAX_TRAITS } = GAME_CONFIG.TRAIT_CONFIG;
    const numTraits = Math.floor(Math.random() * (MAX_TRAITS - MIN_TRAITS + 1)) + MIN_TRAITS;
    
    const allTraits = Object.keys(GAME_CONFIG.PERSONALITY_TRAITS);
    const selectedTraits = [];
    
    for (let i = 0; i < numTraits; i++) {
      const availableTraits = allTraits.filter(t => !selectedTraits.includes(t));
      if (availableTraits.length > 0) {
        const randomTrait = availableTraits[Math.floor(Math.random() * availableTraits.length)];
        selectedTraits.push(randomTrait);
        npc.traits.push({ id: randomTrait, type: 'personality' });
      }
    }
    
    console.log(`[Game] NPC ${npc.name} 特质生成完成: ${selectedTraits.join(', ')}`);
  }

  /**
   * 创建关联NPC
   */
  createBondedNPCs() {
    const { player } = this.gameState;
    const identityType = player.identityType;
    
    const bondedNPCData = {
      scholar: [
        { name: '母亲', baseMass: 4, traits: ['family_oriented', 'compassionate'], initialKnot: 5 },
        { name: '教书先生', baseMass: 3, traits: ['scholar', 'cautious'], initialKnot: 2 }
      ],
      landlord: [
        { name: '老管家', baseMass: 4, traits: ['loyal', 'worldly'], initialKnot: 4 },
        { name: '佃户老张', baseMass: 2, traits: ['hardworking', 'resentful'], initialKnot: 1 }
      ],
      soldier: [
        { name: '父亲', baseMass: 4, traits: ['brave', 'loyal'], initialKnot: 3 },
        { name: '同袍小李', baseMass: 3, traits: ['brave', 'greedy'], initialKnot: 2 }
      ],
      cultist: [
        { name: '引路人王叔', baseMass: 4, traits: ['pious', 'zealous'], initialKnot: 4 },
        { name: '兄长', baseMass: 3, traits: ['family_oriented', 'fearful'], initialKnot: 3 }
      ]
    };
    
    const npcData = bondedNPCData[identityType] || [];
    
    npcData.forEach(data => {
      const npc = new NPC({
        ...data,
        isBonded: true,
        isUnlocked: true,
        position: Utils.randomChoice([
          { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
        ])
      });
      
      player.addBondedNPC(npc);
      this.gameState.npcs.push(npc);
    });
  }

  /**
   * 创建精英NPC
   */
  createEliteNPCs() {
    const eliteNPCs = [
      {
        id: 'hong_xiuquan',
        name: '洪秀全',
        baseMass: 10,
        traits: ['zealous', 'ambitious', 'arrogant'],
        isElite: true,
        isUnlocked: false,
        unlockCondition: { minTurn: 60, minPressure: 75 }
      },
      {
        id: 'yang_xiuqing',
        name: '杨秀清',
        baseMass: 9,
        traits: ['deceitful', 'ambitious', 'calm', 'leader'],
        isElite: true,
        isUnlocked: false,
        unlockCondition: { minTurn: 50 }
      },
      {
        id: 'feng_yunshan',
        name: '冯云山',
        baseMass: 7,
        traits: ['pious', 'diligent', 'sociable'],
        isElite: true,
        isUnlocked: false,
        unlockCondition: { minTurn: 40 }
      },
      {
        id: 'wei_changhui',
        name: '韦昌辉',
        baseMass: 8,
        traits: ['greedy', 'vengeful', 'deceitful'],
        isElite: true,
        isUnlocked: false,
        unlockCondition: { minTurn: 45, playerItem: 'valuable' }
      },
      {
        id: 'shi_dakai',
        name: '石达开',
        baseMass: 8,
        traits: ['brave', 'generous', 'just'],
        isElite: true,
        isUnlocked: false,
        unlockCondition: { minTurn: 55 }
      }
    ];
    
    eliteNPCs.forEach(data => {
      const npc = new NPC({
        ...data,
        position: { x: 10, y: 10 } // 初始在远处
      });
      this.gameState.npcs.push(npc);
    });
  }

  /**
   * 生成开场叙事
   */
  generateOpening() {
    const { player } = this.gameState;
    const traits = player.getPersonalityTraits();
    const traitsDesc = traits.length > 0 ? `（${traits.join(' · ')}）` : '';
    
    const openings = {
      scholar: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> 这是金田村，1851年1月8日，凌晨。
> 你是一个读书人${traitsDesc}，不知道历史已经开始了。`,
      
      landlord: `> 玉扳指在指节上转了三圈，这是你紧张时的习惯。
> 窗外有火光，不是灯笼，是火把。
> 你想起韦昌辉——那个被你排挤过的小地主，现在据说在会众里很有地位。
> 你是金田村的地主${traitsDesc}，这一夜注定无眠。`,
      
      soldier: `> 刀鞘上的血还没擦干净，是上一个村子的。
> 上峰说金田有会匪，格杀勿论。
> 你舔了舔嘴唇，有点干。
> 你是官府的士兵${traitsDesc}，不知道这一战能否活着回去。`,
      
      cultist: `> 十字架贴在胸口，已经温热了。
> 密信上的字你背得出来："十一日，万寿起义。"
> 还有三天。上帝会保护他的子民，但你也握紧了刀。
> 你是教会的受众${traitsDesc}，等待天国的降临。`
    };
    
    return openings[player.identityType] || openings.scholar;
  }

  /**
   * 执行回合
   */
  async executeTurn(choice = null) {
    if (!this.isRunning || this.isGameOver) {
      return { error: '游戏未运行或已结束' };
    }
    
    // 如果是新回合，生成叙事
    if (!choice) {
      const turnResult = await this.turnManager.executeTurn();
      this.turnManager.currentContext = turnResult.context;
      return turnResult;
    }
    
    // 处理玩家选择
    const result = await this.turnManager.processChoice(choice, this.turnManager.currentContext);
    
    // 检查游戏结束
    if (result.gameOver) {
      this.isGameOver = true;
      result.epilogue = await this.generateEpilogue(result.gameOver);
    }
    
    return result;
  }

  /**
   * 生成结局后记
   */
  async generateEpilogue(gameOver) {
    const { player } = this.gameState;
    
    if (gameOver.type === 'death') {
      return await this.narrativeEngine.generateDeathEpilogue(player);
    }
    
    if (gameOver.type === 'escape') {
      return `你逃离了金田。72小时后，太平天国起义爆发，你不在那里。`;
    }
    
    if (gameOver.type === 'completed') {
      return await this.narrativeEngine.generateEndingEpilogue(player);
    }
    
    return '游戏结束。';
  }

  /**
   * 获取游戏状态
   */
  getState() {
    return {
      ...this.gameState,
      isRunning: this.isRunning,
      isGameOver: this.isGameOver
    };
  }

  /**
   * 获取玩家小传（死亡后）
   */
  getPlayerBiography() {
    const { player, history } = this.gameState;
    
    // TODO: 生成2000字人物小传
    return `
# ${player.name}的生平

## 身份
${player.getIdentityDescription()}

## 执念
${player.obsession}

## 经历
${history.map(h => `- 第${h.turn}回合：${h.event}`).join('\n')}

## 结局
游戏结束于第${this.gameState.turn}回合。
`;
  }

  /**
   * 执行选择（供API调用）
   */
  async executeChoice(choiceId) {
    if (!this.isRunning || this.isGameOver) {
      return { error: '游戏未运行或已结束' };
    }
    
    const currentContext = this.turnManager.currentContext;
    if (!currentContext || !currentContext.choices) {
      return { error: '当前没有可执行的选择' };
    }
    
    // 找到对应的选择
    const choice = currentContext.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { error: '无效的选择ID' };
    }
    
    // 处理选择
    const result = await this.turnManager.processChoice(choice, currentContext);
    
    // 生成后续叙事（如果有AI接口）
    let followUpNarrative = null;
    if (this.aiInterface && result.success) {
      try {
        const followUpContext = {
          ...currentContext,
          previousResult: result
        };
        followUpNarrative = await this.narrativeEngine.generateFollowUp(followUpContext);
      } catch (e) {
        console.error('生成后续叙事失败:', e);
      }
    }
    
    return {
      success: true,
      result: {
        text: result.result?.text || result.result?.narrative || '选择已执行'
      },
      followUpNarrative: followUpNarrative,
      stateChanges: result.result?.stateDelta,
      player: this.gameState.player
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game72Hours };
}
