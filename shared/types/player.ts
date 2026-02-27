/**
 * 玩家相关类型
 */

import type { Trait, Position, IdentityType } from './base';

// 玩家状态
export interface PlayerStates {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}

// 身份
export interface Identity {
  id: string;
  name: string;
  baseMass: number;
  pressureModifier: number;
  initialStates: PlayerStates;
  suitableTraits?: string[];
}

// 玩家
export interface Player {
  id: string;
  name: string;
  identityType: IdentityType;
  identity: Identity;
  traits: Trait[];
  obsession: string;
  states: PlayerStates;
  position: Position;
  bondedNPCs: string[];
  inventory: Item[];
  memories: Memory[];
}

// 物品
export interface Item {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

// 记忆
export interface Memory {
  id: string;
  turn: number;
  npcId: string;
  type: 'betrayal' | 'gift' | 'rescue' | 'conflict';
  description: string;
  intensity: number;
}
