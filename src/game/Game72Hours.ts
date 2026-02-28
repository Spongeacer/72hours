/**
 * Game72Hours - 游戏主类
 * 按照共享类型重新实现
 */

import { Player } from './Player';
import { NPC } from './NPC';
import { TurnManager } from './TurnManager';
import { EmergentNarrativeEngine } from '../narrative/EmergentNarrativeEngine';
import { GAME_CONFIG, NPC_CONFIG } from '../config/GameConfig';
import { getCurrentScript, getCurrentIdentities } from '../config/ScriptConfig';
import { spawn } from 'child_process';
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

    // 创建初始NPC（10个，解锁4个）- 身份预设，特质随机，名字和执念通过API生成
    await this.createInitialNPCs();

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
    const identities = getCurrentIdentities();
    const identity = identities.find(i => i.id === player.identityType);
    const suitableTraits = identity?.traits || [];
    const traitDesc = suitableTraits.slice(0, 2).join('、') || '求生';
    return `在${traitDesc}的驱使下活下去`;
  }

  /**
   * 生成玩家特质
   */
  private generatePlayerTraits(): void {
    const { player } = this.gameState;
    const identities = getCurrentIdentities();
    const identityConfig = identities.find(i => i.id === player.identityType);

    // 添加身份特质
    if (identityConfig?.traits) {
      identityConfig.traits.slice(0, 2).forEach(traitId => {
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
   * 创建初始NPC（10个，解锁4个）
   * 身份预设，特质随机，名字和执念通过API生成
   */
  private async createInitialNPCs(): Promise<void> {
    const templates = [...NPC_CONFIG.NPC_TEMPLATES];
    const shuffledTemplates = templates.sort(() => 0.5 - Math.random());

    // 创建10个NPC
    for (let i = 0; i < 10; i++) {
      const template = shuffledTemplates[i % shuffledTemplates.length];
      
      // 从特质库随机抽取2-4个特质
      const numTraits = Math.floor(Math.random() * 3) + 2; // 2-4个
      const allTraitIds = Object.keys(this.config.PERSONALITY_TRAITS || {});
      const shuffledTraits = [...allTraitIds].sort(() => 0.5 - Math.random());
      const selectedTraits = shuffledTraits.slice(0, numTraits);

      // 生成NPC数据
      const npcData = {
        id: `npc_${Date.now()}_${i + 1}`,
        name: template.role, // 临时使用角色名，后续通过API生成
        baseMass: template.baseMass,
        traits: selectedTraits.map(traitId => ({ id: traitId, type: 'personality' as const })),
        states: { fear: 5, aggression: 5, hunger: 5, injury: 1 },
        position: { x: Math.random() * 10 - 5, y: Math.random() * 10 - 5 },
        isBonded: false,
        isUnlocked: i < NPC_CONFIG.INITIAL_UNLOCKED_COUNT,
        // 存储模板信息用于后续API生成
        template: {
          role: template.role,
          description: template.description
        }
      };

      const npc = NPC.create(npcData);
      this.gameState.npcs.push(npc);
    }

    console.log(`[Game] 初始NPC创建完成: 10个，解锁${NPC_CONFIG.INITIAL_UNLOCKED_COUNT}个`);

    // 如果有AI接口，异步生成名字和执念
    if (this.narrativeEngine?.ai) {
      await this.generateNPCDetailsWithAI();
    }
  }

  /**
   * 使用AI生成NPC名字和执念
   */
  private async generateNPCDetailsWithAI(): Promise<void> {
    console.log('[Game] 开始为NPC生成名字和执念...');

    const unlockedNPCs = this.gameState.npcs.filter(npc => npc.isUnlocked);

    for (const npc of unlockedNPCs) {
      try {
        // 生成名字
        const script = getCurrentScript();
        const namePrompt = `${script.aiPrompts.npcName}\n角色: ${(npc as any).template?.role || '村民'}\n描述: ${(npc as any).template?.description || '普通村民'}`;
        const generatedName = await this.callAIForText(namePrompt);
        if (generatedName) {
          npc.name = generatedName.trim();
        }

        // 生成执念
        const obsessionPrompt = `${script.aiPrompts.npcObsession}\n角色: ${npc.name}\n描述: ${(npc as any).template?.description || '普通村民'}\n特质: ${npc.traits.map(t => t.id).join(', ')}`;
        const generatedObsession = await this.callAIForText(obsessionPrompt);
        if (generatedObsession) {
          (npc as any).obsession = generatedObsession.trim();
        }
      } catch (error) {
        console.error(`[Game] 为NPC ${npc.id} 生成详情失败:`, error);
      }
    }

    console.log('[Game] NPC名字和执念生成完成');
  }

  /**
   * 调用AI生成文本
   */
  private async callAIForText(prompt: string): Promise<string> {
    try {
      const apiKey = this.apiKey || process.env.SILICONFLOW_API_KEY || '';
      
      const requestBody = JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: '你是一个NPC生成器，只返回简洁的文本，不要解释。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 50
      });

      return new Promise((resolve, reject) => {
        const curl = spawn('curl', [
          '-s', '-X', 'POST',
          'https://api.siliconflow.cn/v1/chat/completions',
          '-H', `Authorization: Bearer ${apiKey}`,
          '-H', 'Content-Type: application/json',
          '-d', requestBody,
          '--max-time', '10'
        ]);

        let stdout = '';
        curl.stdout.on('data', (data: Buffer) => {
          stdout += data.toString('utf-8');
        });

        curl.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`curl退出码: ${code}`));
            return;
          }
          try {
            const response = JSON.parse(stdout);
            const text = response.choices?.[0]?.message?.content || '';
            resolve(text.trim());
          } catch (e) {
            reject(e);
          }
        });
      });
    } catch (error) {
      console.error('[Game] AI调用失败:', error);
      return '';
    }
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
    const script = getCurrentScript();
    const historicalFigures = script.historicalFigures;
    
    const eliteNPCs = [
      {
        id: 'historical_figure_1',
        name: historicalFigures[0] || '历史人物1',
        baseMass: 10,
        traits: [{ id: 'zealous', type: 'personality' as const }, { id: 'ambitious', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      },
      {
        id: 'historical_figure_2',
        name: historicalFigures[1] || '历史人物2',
        baseMass: 9,
        traits: [{ id: 'deceitful', type: 'personality' as const }, { id: 'ambitious', type: 'personality' as const }],
        isElite: true,
        isUnlocked: false
      },
      {
        id: 'historical_figure_3',
        name: historicalFigures[2] || '历史人物3',
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
    
    const script = getCurrentScript();
    const openingContext = script.opening;

    const openings: Record<IdentityType, string> = {
      scholar: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> ${openingContext}
> 你是一个读书人（${traitsDesc}），不知道历史已经开始了。`,

      farmer: `> 你被一阵奇怪的声音惊醒。
> 不是鸡鸣，是人在低语，很多声音叠在一起，像潮水。
> 你走到窗边，看到远处有火光，不是灯笼的颜色。
> ${openingContext}
> 你是一个农民（${traitsDesc}），不知道历史已经开始了。`,

      merchant: `> 玉扳指在指节上转了三圈，这是你紧张时的习惯。
> 窗外有火光，不是灯笼，是火把。
> 你想起最近的传闻——据说有人在暗中集结。
> ${openingContext}
> 你是一个商人（${traitsDesc}），这一夜注定无眠。`,

      soldier: `> 刀鞘上的血还没擦干净，是上一个村子的。
> 上峰说这里有会匪，格杀勿论。
> 你舔了舔嘴唇，有点干。
> ${openingContext}
> 你是一个退伍老兵（${traitsDesc}），不知道这一战能否活着回去。`,

      doctor: `> 药香混合着血腥气，从窗外飘进来。
> 你放下手中的草药，望向远处的火光。
> 又有人受伤了，而你知道这意味着什么。
> ${openingContext}
> 你是一个江湖郎中（${traitsDesc}），等待天国的降临。`,

      bandit: `> 你摸了摸腰间的刀，确认它还在。
> 山下的村子有火光，不是普通的灯火。
> 你知道那些人的来历，也知道自己该做何选择。
> ${openingContext}
> 你是一个绿林好汉（${traitsDesc}），等待天国的降临。`
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
