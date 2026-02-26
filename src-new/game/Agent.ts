/**
 * Agent 基类 - 玩家和NPC的抽象基类
 */

import { Position, Trait, Memory } from '../../../shared/types';

export interface AgentStates {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}

export abstract class Agent {
  id: string;
  name: string;
  baseMass: number;
  traits: Trait[];
  states: AgentStates;
  position: Position;
  
  // 质量相关
  storyMass: number = 0;
  objectMass: number = 0;
  trapConstant: number = 0;
  
  // 关系网络 (Knot Map)
  knotMap: Map<string, number> = new Map();
  
  // 记忆
  memories: Memory[] = [];
  
  // 物品
  inventory: any[] = [];
  
  constructor(data: {
    id?: string;
    name: string;
    baseMass: number;
    traits?: Trait[];
    states?: Partial<AgentStates>;
    position?: Position;
  }) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.baseMass = data.baseMass;
    this.traits = data.traits || [];
    this.states = {
      fear: 50,
      aggression: 50,
      hunger: 50,
      injury: 0,
      ...data.states
    };
    this.position = data.position || { x: 0, y: 0 };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取总质量
   */
  getTotalMass(): number {
    let knotMass = 0;
    this.knotMap.forEach((value) => {
      knotMass += value * 0.5;
    });
    
    return this.baseMass + this.storyMass + knotMass + this.objectMass;
  }

  /**
   * 获取有效质量（考虑陷阱）
   */
  getEffectiveMass(): number {
    return this.getTotalMass() * (1 + this.trapConstant);
  }

  /**
   * 更新K值（关系强度）
   */
  updateKnot(targetId: string, delta: number): void {
    const current = this.knotMap.get(targetId) || 0;
    const newValue = Math.max(-10, Math.min(10, current + delta));
    
    if (newValue === 0) {
      this.knotMap.delete(targetId);
    } else {
      this.knotMap.set(targetId, newValue);
    }
  }

  /**
   * 获取与某对象的K值
   */
  getKnotWith(targetId: string): number {
    return this.knotMap.get(targetId) || 0;
  }

  /**
   * 检查是否有某特质
   */
  hasTrait(traitId: string): boolean {
    return this.traits.some(t => t.id === traitId);
  }

  /**
   * 添加记忆
   */
  addMemory(memory: Memory): void {
    this.memories.push(memory);
    // 限制记忆数量
    if (this.memories.length > 50) {
      this.memories.shift();
    }
  }

  /**
   * 获取与某对象的记忆
   */
  getMemoriesWith(targetId: string): Memory[] {
    return this.memories.filter(m => m.npcId === targetId);
  }

  /**
   * 检查是否有背叛记忆
   */
  hasBetrayalMemory(targetId: string): boolean {
    return this.memories.some(m => 
      m.npcId === targetId && m.type === 'betrayal'
    );
  }

  /**
   * 更新状态
   */
  updateState(key: keyof AgentStates, delta: number): void {
    const newValue = this.states[key] + delta;
    this.states[key] = Math.max(0, Math.min(100, newValue));
  }

  /**
   * 检查是否死亡
   */
  checkDeath(): boolean {
    return this.states.injury >= 100 || this.states.hunger >= 100;
  }

  /**
   * 获取状态描述
   */
  abstract getAura(): string;

  /**
   * 序列化
   */
  serialize(): any {
    return {
      id: this.id,
      name: this.name,
      baseMass: this.baseMass,
      traits: this.traits,
      states: this.states,
      position: this.position,
      storyMass: this.storyMass,
      objectMass: this.objectMass,
      trapConstant: this.trapConstant,
      knotMap: Array.from(this.knotMap.entries()),
      memories: this.memories,
      inventory: this.inventory
    };
  }

  /**
   * 反序列化
   */
  static deserialize(data: any): Agent {
    throw new Error('子类必须实现反序列化方法');
  }
}
