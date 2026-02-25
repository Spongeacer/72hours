/**
 * Game72HoursStream - 重构版
 * 低耦合、高内聚架构
 */

const { Player } = require('./agents/Player');
const { NPC } = require('./agents/NPC');
const { TurnManagerStream } = require('./core/TurnManagerStream');
const { NarrativeEngineStream } = require('./narrative/NarrativeEngineStream');
const { AIProviderFactory } = require('./narrative/AIProviderFactory');
const { CharacterService } = require('./services/CharacterService');
const { EventBus } = require('./core/EventBus');
const { config, getConfig } = require('./config');
const { Utils } = require('./utils/Utils');

class Game72HoursStream {
  constructor(options = {}) {
    // 配置
    this.config = { ...config.game, ...options.config };
    
    // AI 提供商
    this.aiProvider = options.aiProvider || AIProviderFactory.createFromEnv(options);
    
    // 服务层
    this.characterService = new CharacterService(this.aiProvider);
    
    // 叙事引擎
    this.narrativeEngine = new NarrativeEngineStream(this.aiProvider);
    
    // 事件总线
    this.eventBus = new EventBus();
    
    // 游戏状态
    this._initState();
  }

  /**
   * 初始化游戏状态
   * @private
   */
  _initState() {
    this.gameState = {
      turn: 0,
      datetime: new Date(getConfig('game.startDate')),
      pressure: getConfig('game.initialPressure'),
      omega: getConfig('game.initialOmega'),
      weather: 'night',
      player: null,
      npcs: [],
      history: [],
      config: this.config
    };
    
    this.turnManager = null;
    this.isRunning = false;
    this.isGameOver = false;
  }

  /**
   * 初始化游戏
   * @param {string} identityType - 身份类型
   * @param {Array} traits - 特质数组
   * @returns {Promise<Object>} 初始化结果
   */
  async init(identityType = 'scholar', traits = []) {
    // 生成角色
    const characterInfo = await this.characterService.generate(identityType, traits);
    
    // 创建玩家
    this.gameState.player = new Player(identityType);
    this._applyCharacterInfo(characterInfo);
    
    // 生成玩家特质和执念
    this._generatePlayerTraits(traits);
    this.gameState.player.generateObsession();
    
    // 创建 NPC
    this._createBondedNPCs();
    this._createEliteNPCs();
    
    // 初始化回合管理器
    this.turnManager = new TurnManagerStream(this.gameState, this.narrativeEngine);
    this.turnManager.currentContext = null;
    
    this.isRunning = true;
    
    // 触发初始化完成事件
    this.eventBus.emit('game:initialized', {
      player: this.gameState.player,
      characterInfo
    });
    
    return {
      player: this.gameState.player,
      characterInfo,
      bondedNPCs: this.gameState.player.bondedNPCs,
      opening: this._generateOpening()
    };
  }

  /**
   * 应用角色信息到玩家
   * @private
   */
  _applyCharacterInfo(info) {
    const { player } = this.gameState;
    player.name = info.name;
    player.age = info.age;
    player.backstory = info.backstory;
    player.secret = info.secret;
    player.startingLocation = info.startingLocation;
    player.items = info.items || [];
    player.relations = info.relations || [];
  }

  /**
   * 生成玩家特质
   * @private
   */
  _generatePlayerTraits(traits = []) {
    const { player } = this.gameState;
    const identity = player.identity;
    
    // 身份特质
    if (identity.trait) {
      player.traits.push({ id: identity.trait, type: 'identity' });
    }
    if (identity.traits) {
      identity.traits.forEach(t => {
        player.traits.push({ id: t, type: 'identity' });
      });
    }
    
    // 随机特质
    traits.forEach(t => {
      player.traits.push({ id: t.id, name: t.name, type: t.type || 'personality' });
    });
  }

  /**
   * 创建关联 NPC
   * @private
   */
  _createBondedNPCs() {
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
   * 创建精英 NPC
   * @private
   */
  _createEliteNPCs() {
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
        position: { x: 10, y: 10 }
      });
      this.gameState.npcs.push(npc);
    });
  }

  /**
   * 生成开场叙事
   * @private
   */
  _generateOpening() {
    const { player } = this.gameState;
    
    const openings = {
      scholar: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> 这是金田村，1851年1月8日，凌晨。
> 你不知道，但历史已经开始了。`,
      
      landlord: `> 玉扳指在指节上转了三圈，这是你紧张时的习惯。
> 窗外有火光，不是灯笼，是火把。
> 你想起韦昌辉——那个被你排挤过的小地主，现在据说在会众里很有地位。`,
      
      soldier: `> 刀鞘上的血还没擦干净，是上一个村子的。
> 上峰说金田有会匪，格杀勿论。
> 你舔了舔嘴唇，有点干。`,
      
      cultist: `> 十字架贴在胸口，已经温热了。
> 密信上的字你背得出来："十一日，万寿起义。"
> 还有三天。上帝会保护他的子民，但你也握紧了刀。`
    };
    
    return openings[player.identityType] || openings.scholar;
  }

  /**
   * 流式执行回合
   * @param {Function} onChunk - 流式回调
   */
  async executeTurnStream(onChunk) {
    if (!this.isRunning || this.isGameOver) {
      return { error: '游戏未运行或已结束' };
    }
    
    this.eventBus.emit('turn:started', { turn: this.gameState.turn + 1 });
    
    const turnResult = await this.turnManager.executeTurnStream(onChunk);
    this.turnManager.currentContext = turnResult.context;
    
    this.eventBus.emit('turn:completed', { turn: turnResult.turn });
    
    return turnResult;
  }

  /**
   * 非流式执行回合
   */
  async executeTurn() {
    if (!this.isRunning || this.isGameOver) {
      return { error: '游戏未运行或已结束' };
    }
    
    const turnResult = await this.turnManager.executeTurn();
    this.turnManager.currentContext = turnResult.context;
    
    return turnResult;
  }

  /**
   * 流式执行选择
   * @param {number} choiceId - 选择ID
   * @param {Function} onChunk - 流式回调
   */
  async executeChoiceStream(choiceId, onChunk) {
    if (!this.isRunning || this.isGameOver) {
      return { error: '游戏未运行或已结束' };
    }
    
    const currentContext = this.turnManager.currentContext;
    if (!currentContext || !currentContext.choices) {
      return { error: '当前没有可执行的选择' };
    }
    
    const choice = currentContext.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { error: '无效的选择ID' };
    }
    
    this.eventBus.emit('choice:selected', { choiceId, choice });
    
    const result = await this.turnManager.processChoiceStream(choice, currentContext, onChunk);
    
    this.eventBus.emit('choice:executed', { result });
    
    return {
      success: true,
      result: {
        text: result.result?.text || result.result?.narrative || '选择已执行'
      },
      followUpNarrative: result.followUpNarrative,
      stateChanges: result.result?.stateDelta,
      player: this.gameState.player
    };
  }

  /**
   * 非流式执行选择
   * @param {number} choiceId - 选择ID
   */
  async executeChoice(choiceId) {
    if (!this.isRunning || this.isGameOver) {
      return { error: '游戏未运行或已结束' };
    }
    
    const currentContext = this.turnManager.currentContext;
    if (!currentContext || !currentContext.choices) {
      return { error: '当前没有可执行的选择' };
    }
    
    const choice = currentContext.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { error: '无效的选择ID' };
    }
    
    const result = await this.turnManager.processChoice(choice, currentContext);
    
    let followUpNarrative = null;
    if (this.aiProvider && result.success) {
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
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 处理函数
   */
  on(event, handler) {
    return this.eventBus.on(event, handler);
  }

  /**
   * 重置游戏
   */
  reset() {
    this._initState();
    this.eventBus.emit('game:reset');
  }
}

module.exports = { Game72HoursStream };
