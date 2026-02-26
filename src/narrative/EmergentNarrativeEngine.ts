/**
 * EmergentNarrativeEngine - 涌现式叙事引擎
 * 
 * 核心原则：
 * 1. 不是预设公式，而是故事自己长出来
 * 2. 输入：在场者 + 环境 + 信号 + 记忆
 * 3. 共鸣（不是计算，是共振）
 * 4. 故事自然流淌
 */

import { GameState, NPC as INPC, Memory } from '../../shared/types';
import { Player } from '../game/Player';
import { NPC } from '../game/NPC';
import { GravityEngine, MassObject } from '../core/GravityEngine';

export interface ResonanceContext {
  turn: number;
  datetime: string;
  weather: string;
  pressure: number;
  omega: number;
  player: {
    identity: string;
    traits: string[];
    obsession: string;
    states: {
      fear: number;
      aggression: number;
      hunger: number;
      injury: number;
    };
    aura: string;  // 玩家散发的气场
    position: { x: number; y: number };
  };
  spotlightNPC: SpotlightNPC | null;
  environmentalSignals: EnvironmentalSignal[];
  collectiveMood: string;
}

export interface SpotlightNPC {
  id: string;
  name: string;
  obsession: string;
  traits: string[];
  states: {
    fear: number;
    aggression: number;
    hunger: number;
    injury: number;
  };
  memories: Memory[];
  knotWithPlayer: number;
  distance: number;
  force: number;  // 引力大小
  behavior: string;  // 当前涌现的行为
}

export interface EnvironmentalSignal {
  type: 'visual' | 'auditory' | 'olfactory' | 'atmospheric';
  description: string;
  intensity: number;  // 0-100
  emotionalTone: string;
}

export interface EmergentChoice {
  id: string;
  text: string;
  type: 'normal' | 'hidden' | 'resonance';
  resonanceLevel?: number;  // 共鸣强度
  catalystType?: 'presence' | 'food' | 'fear' | 'silence' | 'violence';
}

export class EmergentNarrativeEngine {
  gravityEngine: GravityEngine;
  ai: any;
  model: string;

  constructor(ai: any, model: string) {
    this.ai = ai;
    this.model = model;
    this.gravityEngine = new GravityEngine();
  }

  /**
   * 生成涌现式叙事
   * 
   * 流程：
   * 1. 选择聚光灯NPC（最大引力）
   * 2. 收集环境信号
   * 3. 计算集体情绪
   * 4. 构建共鸣上下文
   * 5. AI生成共振文本
   */
  async generateEmergentNarrative(gameState: GameState): Promise<string> {
    // 1. 选择聚光灯NPC
    const spotlight = this.selectSpotlightNPC(gameState);
    
    // 2. 收集环境信号
    const signals = this.collectEnvironmentalSignals(gameState);
    
    // 3. 计算集体情绪
    const collectiveMood = this.calculateCollectiveMood(gameState);
    
    // 4. 构建共鸣上下文
    const context = this.buildResonanceContext(gameState, spotlight, signals, collectiveMood);
    
    // 5. 生成叙事（AI或离线）
    if (this.ai) {
      return await this.generateAIResonance(context);
    } else {
      return this.generateOfflineResonance(context);
    }
  }

  /**
   * 选择聚光灯NPC
   * 基于引力大小，但加入随机扰动（无因之果）
   */
  private selectSpotlightNPC(gameState: GameState): SpotlightNPC | null {
    const { player, npcs, pressure, omega } = gameState;
    
    const unlockedNPCs = npcs.filter(n => n.isUnlocked);
    if (unlockedNPCs.length === 0) return null;

    // 构建质量对象
    const playerMass: MassObject = {
      id: player.id,
      mass: this.calculateTotalMass(player),
      effectiveMass: this.calculateEffectiveMass(player),
      position: player.position
    };

    // 计算每个NPC的引力
    const npcForces = unlockedNPCs.map(npc => {
      const npcMass: MassObject = {
        id: npc.id,
        mass: this.calculateTotalMass(npc),
        effectiveMass: this.calculateEffectiveMass(npc),
        position: npc.position
      };

      const force = this.gravityEngine.calculateForce(npcMass, playerMass);
      const distance = this.calculateDistance(player.position, npc.position);
      const knot = this.getKnotWithPlayer(npc, player.id);

      return {
        npc,
        force: force.magnitude,
        distance,
        knot
      };
    });

    // 加入随机扰动（无因之果）- 20%随机性
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
    npcForces.forEach(nf => {
      nf.force *= randomFactor;
    });

    // 选择最大引力NPC
    npcForces.sort((a, b) => b.force - a.force);
    const selected = npcForces[0];

    // 涌现行为
    const behavior = this.emergeBehavior(selected.npc as any, selected.force, selected.knot);

    return {
      id: selected.npc.id,
      name: selected.npc.name,
      obsession: this.getObsession(selected.npc),
      traits: selected.npc.traits.map(t => t.id),
      states: selected.npc.states,
      memories: (selected.npc as any).memories || [],
      knotWithPlayer: selected.knot,
      distance: selected.distance,
      force: selected.force,
      behavior
    };
  }

  /**
   * 涌现行为选择（整合社会心理学机制）
   * 
   * 理论基础：
   * - 社会交换理论：资源稀缺下的成本-收益计算
   * - 挫折-攻击假说：目标受阻引发攻击
   * - 依恋理论：安全基地寻求
   * - 互惠规范：社会交换的道德基础
   */
  private emergeBehavior(npc: any, force: number, knot: number): string {
    const { fear, aggression, hunger } = npc.states;
    
    // 构建"感觉场"（心理学：认知评价 → 情绪唤醒）
    const feelings: { type: string; intensity: number; theory: string }[] = [];
    
    // 基础生存需求（1-20范围）
    if (fear > 12) feelings.push({ type: 'panic', intensity: fear, theory: '恐惧管理理论' });
    if (aggression > 12) feelings.push({ type: 'hostility', intensity: aggression, theory: '挫折-攻击假说' });
    if (hunger > 12) feelings.push({ type: 'desperation', intensity: hunger, theory: '生存本能' });
    
    // 社会连接需求（1-20范围）
    if (knot > 10) feelings.push({ type: 'attachment', intensity: knot, theory: '依恋理论' });
    if (force > 10) feelings.push({ type: 'attraction', intensity: force, theory: '社会引力' });
    
    // 特质驱动的社会角色行为
    const hasGreedy = npc.traits.some(t => t.id === 'greedy');
    const hasCompassionate = npc.traits.some(t => t.id === 'compassionate');
    const hasCurious = npc.traits.some(t => t.id === 'curious');
    const hasBrave = npc.traits.some(t => t.id === 'brave');
    const hasDeceitful = npc.traits.some(t => t.id === 'deceitful');
    
    // 社会交换理论：贪婪+恐惧 = 资源抢占（1-20范围，8对应原40）
    if (hasGreedy && fear > 8) {
      feelings.push({ type: 'seizure', intensity: 14, theory: '社会交换理论' });
    }
    
    // 互惠规范：慈悲+关系 = 无条件给予（1-20范围，6对应原3*2）
    if (hasCompassionate && knot > 6) {
      feelings.push({ type: 'give', intensity: 12, theory: '互惠规范' });
    }
    
    // 信息缺口理论：好奇+安全 = 探索（1-20范围，10对应原50）
    if (hasCurious && fear < 10) {
      feelings.push({ type: 'eavesdrop', intensity: 10, theory: '信息缺口理论' });
    }
    
    // 社会认同理论：勇敢+高压 = 保护行为（1-20范围，10对应原50）
    if (hasBrave && fear > 10) {
      feelings.push({ type: 'protect', intensity: 13, theory: '社会认同理论' });
    }
    
    // 博弈论：狡诈+距离 = 策略观察（1-20范围，6对应原3*2）
    if (hasDeceitful && force < 6) {
      feelings.push({ type: 'manipulate', intensity: 11, theory: '博弈论' });
    }
    
    // Durkheim失范理论：高压下的规范瓦解（1-20范围，14对应原70，12对应原60）
    if (fear > 14 && hunger > 12) {
      feelings.push({ type: 'anomie', intensity: 16, theory: '失范理论' });
    }
    
    // 选择最强烈的感觉
    feelings.sort((a, b) => b.intensity - a.intensity);
    
    if (feelings.length === 0) return 'idle';
    
    // 再次加入随机性（20%混沌）- 不是最强的一定发生
    const topFeelings = feelings.slice(0, Math.min(3, feelings.length));
    const randomIndex = Math.floor(Math.random() * topFeelings.length);
    
    const selected = topFeelings[randomIndex];
    console.log(`[BehaviorEmerge] ${npc.name} 涌现行为: ${selected.type} (强度:${selected.intensity}, 理论:${selected.theory})`);
    
    return selected.type;
  }

  /**
   * 收集环境信号
   */
  private collectEnvironmentalSignals(gameState: GameState): EnvironmentalSignal[] {
    const signals: EnvironmentalSignal[] = [];
    const { weather, pressure, turn, omega } = gameState;
    
    // 天气信号
    const weatherSignals: Record<string, EnvironmentalSignal> = {
      rain: {
        type: 'auditory',
        description: '雨声掩盖了脚步声',
        intensity: 60,
        emotionalTone: '忧郁'
      },
      fog: {
        type: 'visual',
        description: '浓雾中看不清三丈外',
        intensity: 70,
        emotionalTone: '神秘'
      },
      night: {
        type: 'atmospheric',
        description: '夜色深沉，星光微弱',
        intensity: 50,
        emotionalTone: '压抑'
      },
      clear: {
        type: 'visual',
        description: '阳光刺眼，一切无所遁形',
        intensity: 40,
        emotionalTone: '紧张'
      }
    };
    
    if (weatherSignals[weather]) {
      signals.push(weatherSignals[weather]);
    }
    
    // 压强信号 (1-20范围)
    if (pressure > 10) {
      signals.push({
        type: 'atmospheric',
        description: '空气中弥漫着不安',
        intensity: pressure * 5,  // 映射到0-100用于显示
        emotionalTone: '焦虑'
      });
    }
    
    if (pressure > 14) {
      signals.push({
        type: 'olfactory',
        description: '远处传来烟味和血腥味',
        intensity: (pressure - 4) * 5,
        emotionalTone: '恐惧'
      });
    }
    
    // Ω信号 - 历史必然性 (1-20范围)
    if (omega > 12) {
      signals.push({
        type: 'atmospheric',
        description: '一种无法逃避的命运感笼罩着所有人',
        intensity: omega * 5,
        emotionalTone: '宿命'
      });
    }
    
    // 时间信号
    if (turn > 60) {
      signals.push({
        type: 'atmospheric',
        description: '起义即将爆发，时间所剩无几',
        intensity: 90,
        emotionalTone: '紧迫'
      });
    }
    
    return signals;
  }

  /**
   * 计算集体情绪
   */
  private calculateCollectiveMood(gameState: GameState): string {
    const { npcs, player, pressure } = gameState;
    
    let totalFear = player.states.fear;
    let totalAggression = player.states.aggression;
    let count = 1;
    
    npcs.filter(n => n.isUnlocked).forEach(npc => {
      totalFear += npc.states.fear;
      totalAggression += npc.states.aggression;
      count++;
    });
    
    const avgFear = totalFear / count;
    const avgAggression = totalAggression / count;
    
    if (pressure > 14 && avgFear > 12) return '恐慌蔓延';
    if (avgAggression > 12) return '暴力酝酿';
    if (avgFear > 12) return '恐惧笼罩';
    if (pressure > 10) return '紧张不安';
    return '沉默等待';
  }

  /**
   * 构建共鸣上下文
   */
  private buildResonanceContext(
    gameState: GameState,
    spotlight: SpotlightNPC | null,
    signals: EnvironmentalSignal[],
    collectiveMood: string
  ): ResonanceContext {
    const { player, turn, datetime, weather, pressure, omega } = gameState;
    
    return {
      turn,
      datetime,
      weather,
      pressure,
      omega,
      player: {
        identity: player.identity.name,
        traits: player.traits.filter(t => t.type === 'personality').map(t => t.id),
        obsession: typeof player.obsession === 'string' ? player.obsession : '',
        states: player.states,
        aura: this.calculatePlayerAura(player),
        position: player.position
      },
      spotlightNPC: spotlight,
      environmentalSignals: signals,
      collectiveMood
    };
  }

  /**
   * 计算玩家气场
   */
  private calculatePlayerAura(player: any): string {
    const { fear, aggression, hunger, injury } = player.states;
    
    if (fear > 70) return '恐惧的颤抖';
    if (aggression > 70) return '压抑的愤怒';
    if (hunger > 70) return '饥饿的虚弱';
    if (injury > 50) return '带伤的疲惫';
    
    // 根据特质
    const traits = player.traits.map(t => t.id);
    if (traits.includes('calm')) return '沉默的警惕';
    if (traits.includes('curious')) return '探究的目光';
    if (traits.includes('brave')) return '坚定的姿态';
    
    return '平静的存在';
  }

  /**
   * AI生成共振文本
   */
  private async generateAIResonance(context: ResonanceContext): Promise<string> {
    const prompt = this.buildResonancePrompt(context);
    
    try {
      const response = await this.ai.generate(prompt, this.model);
      return response.trim();
    } catch (error) {
      console.error('[EmergentNarrative] AI生成失败:', error);
      return this.generateOfflineResonance(context);
    }
  }

  /**
   * 构建共振提示词
   */
  private buildResonancePrompt(context: ResonanceContext): string {
    const { spotlightNPC, player } = context;
    
    const prompt = `
【时间】第${context.turn}/72回合，${new Date(context.datetime).toLocaleString('zh-CN')}

【场】
压强：${Math.round(context.pressure)}/20
历史必然感：${Math.round(context.omega)}/20

【你】
恐惧：${player.states.fear}/20
攻击性：${player.states.aggression}/20
饥饿：${player.states.hunger}/20
伤势：${player.states.injury}/20
执念：${player.obsession}

【在场者】${spotlightNPC ? spotlightNPC.name : '无'}
${spotlightNPC ? `恐惧：${spotlightNPC.states.fear}/20
攻击性：${spotlightNPC.states.aggression}/20
与你的关系：${spotlightNPC.knotWithPlayer}/20
执念：${spotlightNPC.obsession}` : ''}

【约束】
- 从视觉、听觉、嗅觉写环境，不解释"压强高"是什么意思
- 让${spotlightNPC ? spotlightNPC.name : '环境'}的执念自然流露，不直接说"他想..."
- 200字，第二人称，暗示而非说明
`;

    return prompt;
  }

  /**
   * 离线模式生成（无AI时）
   */
  private generateOfflineResonance(context: ResonanceContext): string {
    const { spotlightNPC, environmentalSignals, collectiveMood, turn } = context;
    
    let narrative = `> 第${turn}回合。${collectiveMood}。
> `;
    
    // 环境信号
    if (environmentalSignals.length > 0) {
      const strongestSignal = environmentalSignals.sort((a, b) => b.intensity - a.intensity)[0];
      narrative += `${strongestSignal.description}。\n> `;
    }
    
    // 聚光灯NPC（加入社会心理学行为描述）
    if (spotlightNPC) {
      const behaviors: Record<string, { desc: string; theory: string }> = {
        panic: { 
          desc: `${spotlightNPC.name}在发抖，眼神游离。`, 
          theory: '恐惧管理理论' 
        },
        hostility: { 
          desc: `${spotlightNPC.name}握紧了拳头，指节发白。`, 
          theory: '挫折-攻击假说' 
        },
        desperation: { 
          desc: `${spotlightNPC.name}的肚子在叫，但目光却在你的包袱上停留。`, 
          theory: '社会交换理论' 
        },
        attachment: { 
          desc: `${spotlightNPC.name}靠了过来，像是要确认你还在。`, 
          theory: '依恋理论' 
        },
        attraction: { 
          desc: `${spotlightNPC.name}被什么吸引着，目光无法移开。`, 
          theory: '社会引力' 
        },
        seizure: { 
          desc: `${spotlightNPC.name}的手在腰间摸索，呼吸急促。`, 
          theory: '失范理论' 
        },
        give: { 
          desc: `${spotlightNPC.name}递过来 something，眼神温柔。`, 
          theory: '互惠规范' 
        },
        eavesdrop: { 
          desc: `${spotlightNPC.name}假装在看别处，耳朵却朝向你。`, 
          theory: '信息缺口理论' 
        },
        protect: {
          desc: `${spotlightNPC.name}站在你身前，像一堵墙。`,
          theory: '社会认同理论'
        },
        manipulate: {
          desc: `${spotlightNPC.name}嘴角微微上扬，眼里有算计。`,
          theory: '博弈论'
        },
        anomie: {
          desc: `${spotlightNPC.name}的眼神空洞，像失去了所有方向。`,
          theory: '失范状态'
        },
        idle: { 
          desc: `${spotlightNPC.name}沉默地站着，不知道在想什么。`, 
          theory: '认知评价' 
        }
      };
      
      const behavior = behaviors[spotlightNPC.behavior] || behaviors.idle;
      narrative += `${behavior.desc} /* ${behavior.theory} */
> `;
      
      // 执念暗示（心理学：图式激活）
      if (Math.random() > 0.5) {
        narrative += `你想起${spotlightNPC.name}曾说过："${spotlightNPC.obsession}" /* 图式激活 */
> `;
      }
      
      // 记忆触发（心理学：情绪记忆）
      if (spotlightNPC.memories.length > 0 && Math.random() > 0.7) {
        const memory = spotlightNPC.memories[0];
        narrative += `这一刻让你想起${memory.content} /* 情绪记忆 */
> `;
      }
    }
    
    // 玩家气场
    narrative += `你${context.player.aura}。`;
    
    return narrative.trim();
  }

  // ============ 辅助方法 ============
  
  private calculateTotalMass(entity: any): number {
    const base = entity.baseMass || 3;
    const story = entity.storyMass || 0;
    const object = entity.objectMass || 0;
    let knotSum = 0;
    if (entity.knotMap) {
      const values = Array.from(entity.knotMap.values());
      for (const v of values) {
        knotSum += v as number;
      }
    }
    const knot = knotSum * 0.5;
    return base + story + knot + object;
  }
  
  private calculateEffectiveMass(entity: any): number {
    const total = this.calculateTotalMass(entity);
    const trap = entity.trapConstant || 0;
    return total * (1 + trap);
  }
  
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private getKnotWithPlayer(npc: any, playerId: string): number {
    if (npc.knotMap) {
      return npc.knotMap.get(playerId) || 0;
    }
    return 0;
  }
  
  private getObsession(entity: any): string {
    if (typeof entity.obsession === 'string') {
      return entity.obsession;
    }
    if (entity.obsession && entity.obsession.prompt) {
      return entity.obsession.prompt;
    }
    return '活下去';
  }
}

export default EmergentNarrativeEngine;
