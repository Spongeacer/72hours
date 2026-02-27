/**
 * Game72Hours - 游戏主类
 * 按照共享类型重新实现
 */

import { Player } from './Player';
import { NPC } from './NPC';
import { TurnManager } from './TurnManager';
import { EmergentNarrativeEngine } from '../narrative/EmergentNarrativeEngine';
import { GAME_CONFIG, PLAYER_CONFIG } from '../config/GameConfig';
import { 
  GameState, 
  GameInitResult, 
  TurnResult,
  IdentityType,
  WeatherType,
  GameConfig as IGameConfig,
  HistoryEntry
} from '../../shared/types';

export interface GameOptions {
  id?: string;
  config?: Partial<typeof GAME_CONFIG>;
  aiInterface?: any;
  model?: string;
  apiKey?: string;
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

  constructor(options: GameOptions = {}) {
    this.id = options.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = { ...GAME_CONFIG, ...options.config };
    this.aiInterface = options.aiInterface || null;
    this.model = options.model || 'Pro/MiniMaxAI/MiniMax-M2.5';
    this.apiKey = options.apiKey;
    
    // 初始化游戏状态
    const gameConfig: IGameConfig = {
      MAX_TURNS: this.config.MAX_TURNS,
      GRID_SIZE: this.config.GRID_SIZE || 10,
      START_DATE: this.config.START_DATE
    };
    
    this.gameState = {
      turn: 0,
      datetime: new Date(this.config.START_DATE).toISOString(),
      pressure: this.config.PRESSURE.INITIAL,
      omega: this.config.OMEGA.INITIAL,
      weather: 'night' as WeatherType,
      player: null as any, // 将在 init 中设置
      npcs: [],
      history: [],
      config: gameConfig,
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
    this.gameState.player = new Player(identityType) as unknown as typeof this.gameState.player;
    
    // 生成玩家特质
    this.generatePlayerTraits();
    
    // 设置玩家执念
    this.gameState.player.obsession = this.generateDefaultObsession(this.gameState.player);
    
    // 创建关联NPC
    this.createBondedNPCs();
    
    // 创建精英NPC
    this.createEliteNPCs();
    
    // 初始化回合管理器
    this.turnManager = new TurnManager(this.gameState, this.narrativeEngine);
    
    this.isRunning = true;
    
    // 生成开场白
    const opening = this.generateOpening();
    
    // 添加开场到历史
    const historyEntry: HistoryEntry = {
      turn: 0,
      narrative: opening,
      result: '游戏开始'
    };
    this.gameState.history.push(historyEntry);
    
    return {
      gameId: this.id,
      player: this.gameState.player,
      bondedNPCs: this.gameState.npcs.filter(npc => npc.isBonded),
      opening,
      state: this.gameState
    };
  }

  /**
   * 生成默认执念
   */
  private generateDefaultObsession(player: typeof this.gameState.player): string {
    const identity = PLAYER_CONFIG.IDENTITIES[player.identityType];
    const suitableTraits = identity.suitableTraits || [];
    const traitDesc = suitableTraits.slice(0, 2).join('、') || '求生';
    return `在${traitDesc}的驱使下活下去`;
  }

  /**
   * 生成玩家特质
   */
  private generatePlayerTraits(): void {
    const { player } = this.gameState;
    const identityConfig = PLAYER_CONFIG.IDENTITIES[player.identityType];
    
    // 添加身份特质
    if (identityConfig.suitableTraits) {
      identityConfig.suitableTraits.slice(0, 2).forEach(traitId => {
        player.traits.push({ id: traitId, type: 'identity' });
      });
    }
    
    // 从特质库随机抽取性格特质
    const minTraits = this.config.TRAIT_CONFIG?.MIN_TRAITS || 2;
    const maxTraits = this.config.TRAIT_CONFIG?.MAX_TRAITS || 4;
    const numTraits = Math.floor(Math.random() * (maxTraits - minTraits + 1)) + minTraits;
    
    const allTraits = Object.keys(this.config.PERSONALITY_TRAITS || {});
    const selectedTraits: string[] = [];
    
    for (let i = 0; i < numTraits && allTraits.length > 0; i++) {
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
        { name: '母亲', baseMass: 4, traits: [{ id: 'family_oriented', type: 'personality' }, { id: 'compassionate', type: 'personality' }], initialKnot: 5 },
        { name: '教书先生', baseMass: 3, traits: [{ id: 'scholar', type: 'personality' }, { id: 'cautious', type: 'personality' }], initialKnot: 2 }
      ],
      landlord: [
        { name: '老管家', baseMass: 4, traits: [{ id: 'loyal', type: 'personality' }, { id: 'worldly', type: 'personality' }], initialKnot: 4 },
        { name: '佃户老张', baseMass: 2, traits: [{ id: 'hardworking', type: 'personality' }, { id: 'resentful', type: 'personality' }], initialKnot: 1 }
      ],
      soldier: [
        { name: '父亲', baseMass: 4, traits: [{ id: 'brave', type: 'personality' }, { id: 'loyal', type: 'personality' }], initialKnot: 3 },
        { name: '同袍小李', baseMass: 3, traits: [{ id: 'brave', type: 'personality' }, { id: 'greedy', type: 'personality' }], initialKnot: 2 }
      ],
      cultist: [
        { name: '引路人王叔', baseMass: 4, traits: [{ id: 'pious', type: 'personality' }, { id: 'zealous', type: 'personality' }], initialKnot: 4 },
        { name: '兄长', baseMass: 3, traits: [{ id: 'family_oriented', type: 'personality' }, { id: 'fearful', type: 'personality' }], initialKnot: 3 }
      ]
    };
    
    const npcData = bondedNPCData[identityType] || [];
    
    npcData.forEach(data => {
      const npc = NPC.create({
        id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: data.name,
        baseMass: data.baseMass,
        traits: data.traits,
        states: { fear: 5, aggression: 5, hunger: 5, injury: 1 },
        position: this.randomPosition(),
        isBonded: true,
        isUnlocked: true
      });
      
      // 添加到玩家的 bondedNPCs（存储ID）
      player.bondedNPCs.push(npc.id);
      // 添加到游戏NPC列表
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
        traits: [{ id: 'zealous', type: 'personality' as const }, { id: 'ambitious', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      },
      {
        id: 'yang_xiuqing',
        name: '杨秀清',
        baseMass: 9,
        traits: [{ id: 'deceitful', type: 'personality' as const }, { id: 'ambitious', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      },
      {
        id: 'feng_yunshan',
        name: '冯云山',
        baseMass: 7,
        traits: [{ id: 'pious', type: 'personality' as const }, { id: 'diligent', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      },
      {
        id: 'wei_changhui',
        name: '韦昌辉',
        baseMass: 8,
        traits: [{ id: 'greedy', type: 'personality' as const }, { id: 'vengeful', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      },
      {
        id: 'shi_dakai',
        name: '石达开',
        baseMass: 8,
        traits: [{ id: 'brave', type: 'personality' as const }, { id: 'generous', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      }
    ];
    
    eliteNPCs.forEach(data => {
      const npc = NPC.create({
        id: data.id,
        name: data.name,
        baseMass: data.baseMass,
        traits: data.traits,
        states: { fear: 5, aggression: 5, hunger: 5, injury: 1 },
        position: { x: 10, y: 10 }
      });
      this.gameState.npcs.push(npc);
    });
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
   * 生成开场白
   */
  private generateOpening(): string {
    const { player } = this.gameState;
    const personalityTraits = player.traits
      .filter(t => t.type === 'personality')
      .map(t => t.id);
    const traitsDesc = personalityTraits.slice(0, 2).join(' · ') || '普通人';
    
    const openings: Record<IdentityType, string> = {
      scholar: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> 这是金田村，1851年1月8日，凌晨。
> 你是一个读书人（${traitsDesc}），不知道历史已经开始了。`,
      
      landlord: `> 玉扳指在指节上转了三圈，这是你紧张时的习惯。
> 窗外有火光，不是灯笼，是火把。
> 你想起韦昌辉——那个被你排挤过的小地主，现在据说在会众里很有地位。
> 你是金田村的地主（${traitsDesc}），这一夜注定无眠。`,
      
      soldier: `> 刀鞘上的血还没擦干净，是上一个村子的。
> 上峰说金田有会匪，格杀勿论。
> 你舔了舔嘴唇，有点干。
> 你是官府的士兵（${traitsDesc}），不知道这一战能否活着回去。`,
      
      cultist: `> 十字架贴在胸口，已经温热了。
> 密信上的字你背得出来："十一日，万寿起义。"
> 还有三天。上帝会保护他的子民，但你也握紧了刀。
> 你是教会的受众（${traitsDesc}），等待天国的降临。`
    };
    
    return openings[player.identityType] || openings.scholar;
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
    
    // 增加回合数
    this.gameState.turn++;
    
    // 更新时间（每回合2小时）
    const current = new Date(this.gameState.datetime);
    current.setHours(current.getHours() + 2);
    this.gameState.datetime = current.toISOString();
    
    // 更新压强和Ω
    this.updatePhysics();
    
    if (!choice) {
      // 生成新回合
      const result = await this.turnManager.executeTurn();
      
      // 添加历史记录
      this.gameState.history.push({
        turn: this.gameState.turn,
        narrative: result.narrative,
        choice: result.choices[0]
      });
      
      return result;
    }
    
    // 处理玩家选择
    const result = await this.turnManager.processChoice(choice, this.turnManager.currentContext);
    
    // 添加历史记录
    this.gameState.history.push({
      turn: this.gameState.turn,
      narrative: result.narrative,
      choice: choice,
      result: '选择已执行'
    });
    
    // 检查游戏结束
    if (this.gameState.turn >= this.config.MAX_TURNS) {
      this.isGameOver = true;
      this.gameState.isGameOver = true;
    }
    
    return result;
  }

  /**
   * 更新物理场
   */
  private updatePhysics(): void {
    // 压强增长
    this.gameState.pressure += this.config.PRESSURE.BASE_GROWTH;
    this.gameState.pressure = Math.min(this.gameState.pressure, this.config.PRESSURE.MAX);
    
    // Ω增长
    if (this.gameState.pressure >= this.config.OMEGA.EXPONENTIAL_THRESHOLD) {
      this.gameState.omega = Math.min(
        this.config.OMEGA.MAX,
        this.gameState.omega * this.config.OMEGA.EXPONENTIAL_BASE
      );
    } else {
      this.gameState.omega += this.config.OMEGA.LINEAR_GROWTH;
      this.gameState.omega = Math.min(this.gameState.omega, this.config.OMEGA.MAX);
    }
  }

  /**
   * 获取游戏状态
   */
  getState(): GameState {
    return this.gameState;
  }
}
