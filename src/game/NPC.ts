/**
 * NPC 非玩家角色类
 */

import { Agent, AgentStates } from './Agent';
import { GameState, Trait, Item } from '../../shared/types';
import { GAME_CONFIG } from '../config/GameConfig';

export interface NPCData {
  id?: string;
  name: string;
  baseMass: number;
  traits?: Trait[];
  states?: Partial<AgentStates>;
  position?: { x: number; y: number };
  isBonded?: boolean;
  isElite?: boolean;
  isUnlocked?: boolean;
  unlockCondition?: UnlockCondition;
  initialKnot?: number;
  behaviors?: string[];
  ttl?: number | null;
}

export interface UnlockCondition {
  minTurn?: number;
  minPressure?: number;
  playerTrait?: string;
  playerItem?: string;
  requireNPC?: string;
}

// 执念数据类型
interface ObsessionData {
  type: string;
  identity: string;
  identityName: string;
  traits: string[];
  traitsDesc: string;
  prompt: string;
}

// 行为权重类型
interface BehaviorWeights {
  [key: string]: number;
}

export class NPC extends Agent {
  isNPC: boolean = true;
  isElite: boolean;
  isBonded: boolean;
  isUnlocked: boolean;

  // 解锁条件
  unlockCondition: UnlockCondition | null;

  // 行为库
  behaviors: string[];

  // 存在时间（普通NPC）
  ttl: number | null;

  // 初始K值
  initialKnot: number;

  // 执念
  obsession: string = '';

  constructor(data: NPCData) {
    super({
      id: data.id,
      name: data.name,
      baseMass: data.baseMass,
      traits: data.traits || [],
      states: data.states,
      position: data.position
    });

    this.isElite = data.isElite || false;
    this.isBonded = data.isBonded || false;
    this.isUnlocked = data.isUnlocked || false;
    this.unlockCondition = data.unlockCondition || null;
    this.behaviors = data.behaviors || [];
    this.ttl = data.ttl ?? null;
    this.initialKnot = data.initialKnot || 0;
  }

  /**
   * 生成执念数据
   */
  generateObsession(): ObsessionData {
    const personalityTraits = this.traits
      .filter((t: Trait) => t.type === 'personality')
      .map((t: Trait) => t.id);

    if (personalityTraits.length === 0) {
      personalityTraits.push('calm');
    }

    const traitsDesc = personalityTraits
      .map(t => {
        const traitInfo = GAME_CONFIG.PERSONALITY_TRAITS[t as keyof typeof GAME_CONFIG.PERSONALITY_TRAITS];
        return traitInfo ? `${t}(${traitInfo.name})` : t;
      })
      .join('、');

    return {
      type: 'npc',
      identity: this.name,
      identityName: this.name,
      traits: personalityTraits,
      traitsDesc: traitsDesc,
      prompt: `生成一个NPC「${this.name}」的执念，该角色具有以下特质：${traitsDesc}。身份是${this.isBonded ? '玩家的关联NPC' : '普通村民'}，时代背景是1851年金田村。执念应该简洁有力（15字以内），体现角色特点。`
    };
  }

  /**
   * 设置执念
   */
  setObsession(text: string): void {
    this.obsession = text;
  }

  /**
   * 检查解锁条件
   */
  checkUnlock(_gameState: GameState): boolean {
    if (this.isUnlocked) return true;
    if (!this.unlockCondition) {
      this.isUnlocked = true;
      return true;
    }

    const condition = this.unlockCondition;

    // 回合条件
    if (condition.minTurn && _gameState.turn < condition.minTurn) return false;

    // 压强条件
    if (condition.minPressure && _gameState.pressure < condition.minPressure) return false;

    // 玩家特质条件
    if (condition.playerTrait && !_gameState.player.traits.some((t: Trait) => t.id === condition.playerTrait)) {
      return false;
    }

    // 玩家道具条件
    if (condition.playerItem) {
      const itemName = condition.playerItem;
      const hasItem = _gameState.player.inventory.some((i: Item) =>
        i.tags?.includes(itemName)
      );
      if (!hasItem) return false;
    }

    // 其他NPC解锁条件
    if (condition.requireNPC) {
      const requiredNPCId = condition.requireNPC;
      const requiredNPC = _gameState.npcs.find(n => n.id === requiredNPCId);
      if (!requiredNPC?.isUnlocked) return false;
    }

    this.isUnlocked = true;
    return true;
  }

  /**
   * 计算行为倾向
   */
  calculateBehaviorTendency(behaviorType: string, player: Agent): number {
    const weights: Record<string, BehaviorWeights> = {
      seizure: {
        greed: 0.4,
        fear: 0.2,
        hasValuableItem: 0.3,
        highPressure: 0.2,
        massAdvantage: 0.2,
        base: 0.1
      },
      conflict: {
        hostility: 0.5,
        bloodlust: 0.3,
        highAggression: 0.3,
        extremePressure: 0.2,
        betrayalMemory: 0.4,
        base: 0.05
      },
      eavesdrop: {
        curious: 0.3,
        deceitful: 0.3,
        obsessionTreasure: 0.2,
        highMassTarget: 0.2,
        coverCondition: 0.2,
        base: 0.15
      },
      conversation: {
        base: 0.3,
        existingKnot: 0.3,
        highFear: 0.2,
        lowPressure: 0.2,
        traitMatch: 0.3
      },
      request: {
        highFear: 0.3,
        highHunger: 0.3,
        targetCompassion: 0.3,
        deepKnot: 0.3,
        base: 0.1
      },
      give: {
        compassion: 0.3,
        deepKnot: 0.4,
        protectObsession: 0.4,
        gratitudeMemory: 0.5,
        base: 0.05
      }
    };

    const behaviorWeights = weights[behaviorType];
    if (!behaviorWeights) return 0;

    let tendency = 0;

    // 特质权重
    for (const [trait, weight] of Object.entries(behaviorWeights)) {
      if (this.hasTrait(trait)) {
        tendency += weight;
      }
    }

    // 状态权重
    if (behaviorWeights.highFear && this.states.fear > 60) {
      tendency += behaviorWeights.highFear;
    }
    if (behaviorWeights.highHunger && this.states.hunger > 70) {
      tendency += behaviorWeights.highHunger;
    }
    if (behaviorWeights.highAggression && this.states.aggression > 70) {
      tendency += behaviorWeights.highAggression;
    }

    // 关系权重
    if (behaviorWeights.existingKnot) {
      const knot = this.getKnotWith(player.id);
      if (knot > 0) tendency += behaviorWeights.existingKnot * (knot / 10);
    }

    if (behaviorWeights.deepKnot) {
      const knot = this.getKnotWith(player.id);
      if (knot >= 5) tendency += behaviorWeights.deepKnot;
    }

    return tendency;
  }

  /**
   * 获取状态描述
   */
  getAura(): string {
    if (this.states.fear > 70) return '恐惧的颤抖';
    if (this.states.aggression > 70) return '压抑的愤怒';
    if (this.states.hunger > 70) return '饥饿的虚弱';
    if (this.states.injury > 50) return '带伤的疲惫';

    return '沉默的警惕';
  }

  /**
   * 序列化
   */
  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      baseMass: this.baseMass,
      traits: this.traits,
      obsession: this.obsession,
      states: this.states,
      position: this.position,
      isBonded: this.isBonded,
      isElite: this.isElite,
      isUnlocked: this.isUnlocked,
      isNPC: this.isNPC,
      unlockCondition: this.unlockCondition,
      behaviors: this.behaviors,
      ttl: this.ttl
    };
  }

  /**
   * 创建NPC
   */
  static create(data: NPCData): NPC {
    return new NPC(data);
  }
}
