/**
 * Game72Hours - 游戏主类
 */

import { Player } from './Player';
import { NPC } from './NPC';
import { TurnManager } from './TurnManager';
import { EmergentNarrativeEngine } from '../narrative/EmergentNarrativeEngine';
import { GAME_CONFIG } from '../config/GameConfig';
import { 
  GameState, 
  GameInitResult, 
  TurnResult,
  IdentityType,
  WeatherType
} from '../../shared/types';

export interface GameOptions {
  config?: Partial<typeof GAME_CONFIG>;
  aiInterface?: any;
  model?: string;
}

export class Game72Hours {
  id: string;
  config: typeof GAME_CONFIG;
  aiInterface: any;
  model: string;
  apiKey?: string;
  
  gameState: GameState;
  narrativeEngine: EmergentNarrativeEngine;
  turnManager: TurnManager | null = null;
  
  isRunning: boolean = false;
  isGameOver: boolean = false;

  constructor(options: GameOptions & { id?: string; apiKey?: string } = {}) {
    this.id = options.id || '';
    this.config = { ...GAME_CONFIG, ...options.config };
    this.aiInterface = options.aiInterface || null;
    this.model = options.model || 'Pro/MiniFlowAPI/MiniMax-M2.5';
    this.apiKey = options.apiKey;
    this.gameState = {
      turn: 0,
      datetime: new Date(this.config.START_DATE).toISOString(),
      pressure: this.config.PRESSURE.INITIAL,
      omega: this.config.OMEGA.INITIAL,
      weather: 'night' as WeatherType,
      player: null as any,
      npcs: [],
      history: [],
      config: this.config,
      isGameOver: false
    };
    
    this.narrativeEngine = new EmergentNarrativeEngine(this.aiInterface, this.model);
  }

  /**
   * 获取游戏状态（兼容路由中的 state 访问）
   */
  get state(): GameState {
    return this.gameState;
  }

  /**
   * 初始化游戏
   */
  async init(identityType: IdentityType = 'scholar'): Promise<GameInitResult> {
    // 创建玩家
    this.gameState.player = new Player(identityType);
    
    // 生成玩家特质
    this.generatePlayerTraits();
    
    // 生成玩家执念
    this.gameState.player.generateObsession();
    
    // 创建关联NPC
    this.createBondedNPCs();
    
    // 创建精英NPC
    this.createEliteNPCs();
    
    // 初始化回合管理器
    this.turnManager = new TurnManager(this.gameState, this.narrativeEngine);
    
    this.isRunning = true;
    
    // 并发生成所有角色执念
    await this.generateAllObsessionsConcurrently();
    
    return {
      gameId: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      player: this.gameState.player.serialize(),
      bondedNPCs: this.gameState.player.bondedNPCs.map(npc => npc.serialize()),
      opening: this.generateOpening(),
      state: this.gameState
    };
  }

  /**
   * 生成玩家特质
   */
  private generatePlayerTraits(): void {
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
    
    // 从特质库随机抽取性格特质
    const { MIN_TRAITS, MAX_TRAITS } = this.config.TRAIT_CONFIG;
    const numTraits = Math.floor(Math.random() * (MAX_TRAITS - MIN_TRAITS + 1)) + MIN_TRAITS;
    
    const allTraits = Object.keys(this.config.PERSONALITY_TRAITS);
    const selectedTraits: string[] = [];
    
    for (let i = 0; i < numTraits; i++) {
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
   * 创建关联NPC
   */
  private createBondedNPCs(): void {
    const { player } = this.gameState;
    const identityType = player.identityType;
    
    const bondedNPCData: Record<string, any[]> = {
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
        position: this.randomPosition()
      });
      
      player.addBondedNPC(npc);
      this.gameState.npcs.push(npc);
    });
  }

  /**
   * 创建精英NPC
   */
  private createEliteNPCs(): void {
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
        unlockCondition: { minTurn: 45 }
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
   * 并发生成所有角色的执念
   */
  private async generateAllObsessionsConcurrently(): Promise<void> {
    const { player } = this.gameState;
    
    // 为NPC生成特质
    this.gameState.npcs.forEach(npc => {
      if (npc.isBonded) {
        this.generateNPCTraits(npc);
      }
    });
    
    // 准备所有需要生成执念的角色
    const obsessionTasks: any[] = [];
    
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
    
    // 并发执行
    await Promise.allSettled(
      obsessionTasks.map(task => this.generateObsessionForCharacter(task))
    );
  }

  /**
   * 为单个角色生成执念
   */
  private async generateObsessionForCharacter(task: any): Promise<void> {
    const { target, data } = task;
    
    if (this.narrativeEngine?.ai) {
      try {
        const obsessionText = await this.narrativeEngine.generateObsession(data);
        target.setObsession(obsessionText);
      } catch (error) {
        console.error(`[Game] 生成${task.type === 'player' ? '玩家' : target.name}执念失败:`, error);
        target.setObsession(`在${data.traitsDesc}的驱使下活下去`);
      }
    } else {
      target.setObsession(`在${data.traitsDesc}的驱使下活下去`);
    }
  }

  /**
   * 生成NPC特质
   */
  private generateNPCTraits(npc: NPC): void {
    const { MIN_TRAITS, MAX_TRAITS } = this.config.TRAIT_CONFIG;
    const numTraits = Math.floor(Math.random() * (MAX_TRAITS - MIN_TRAITS + 1)) + MIN_TRAITS;
    
    const allTraits = Object.keys(this.config.PERSONALITY_TRAITS);
    const selectedTraits: string[] = [];
    
    for (let i = 0; i < numTraits; i++) {
      const availableTraits = allTraits.filter(t => !selectedTraits.includes(t));
      if (availableTraits.length > 0) {
        const randomTrait = availableTraits[Math.floor(Math.random() * availableTraits.length)];
        selectedTraits.push(randomTrait);
        npc.traits.push({ id: randomTrait, type: 'personality' });
      }
    }
  }

  /**
   * 生成开场白
   */
  private generateOpening(): string {
    const { player } = this.gameState;
    const traits = player.getPersonalityTraits();
    const traitsDesc = traits.length > 0 ? `（${traits.join(' · ')}）` : '';
    
    const openings: Record<IdentityType, string> = {
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
   * 随机位置
   */
  private randomPosition(): { x: number; y: number } {
    const positions = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, 
      { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    return positions[Math.floor(Math.random() * positions.length)];
  }

  /**
   * 执行回合
   */
  async executeTurn(choice?: any): Promise<TurnResult> {
    if (!this.isRunning || this.isGameOver) {
      throw new Error('游戏未运行或已结束');
    }
    
    if (!this.turnManager) {
      throw new Error('回合管理器未初始化');
    }
    
    if (!choice) {
      // 生成新回合
      const result = await this.turnManager.executeTurn();
      this.turnManager.currentContext = result.context;
      return result;
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
   * 生成结局
   */
  private async generateEpilogue(gameOver: { type: string }): Promise<string> {
    if (gameOver.type === 'death') {
      return '你死了。历史继续，太平天国将在36个时辰后爆发。';
    }
    
    if (gameOver.type === 'escape') {
      return '你逃离了金田。36个时辰后，太平天国起义爆发，你不在那里。';
    }
    
    if (gameOver.type === 'completed') {
      return '第36回合，金田起义爆发。你的故事结束了。';
    }
    
    return '游戏结束。';
  }

  /**
   * 获取游戏状态
   */
  getState(): GameState {
    return {
      ...this.gameState,
      isRunning: this.isRunning,
      isGameOver: this.isGameOver
    };
  }
}
