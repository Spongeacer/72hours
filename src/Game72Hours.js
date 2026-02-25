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
   * 初始化游戏
   */
  init(identityType = 'scholar') {
    // 创建玩家
    this.gameState.player = new Player(identityType);
    
    // 生成玩家特质
    this.generatePlayerTraits();
    
    // 生成玩家执念
    this.gameState.player.generateObsession();
    
    // 创建关联NPC
    this.createBondedNPCs();
    
    // 创建精英NPC（未解锁）
    this.createEliteNPCs();
    
    // 初始化回合管理器
    this.turnManager = new TurnManager(this.gameState, this.narrativeEngine);
    this.turnManager.currentContext = null; // 初始化上下文
    
    this.isRunning = true;
    
    return {
      player: this.gameState.player,
      bondedNPCs: this.gameState.player.bondedNPCs,
      opening: this.generateOpening()
    };
  }

  /**
   * 生成玩家特质
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
    
    // TODO: 从特质库随机抽取2-3个性格特质
    // 暂时使用默认特质
    const defaultTraits = ['calm', 'curious'];
    defaultTraits.forEach(t => {
      player.traits.push({ id: t, type: 'personality' });
    });
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
        text: result.narrative || result.text || '选择已执行'
      },
      followUpNarrative: followUpNarrative,
      stateChanges: result.stateChanges,
      player: this.gameState.player
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game72Hours };
}
