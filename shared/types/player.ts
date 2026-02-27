/**
 * 玩家相关类型
 */

import type { Trait, Position, IdentityType } from './base';

// 执念数据
export interface ObsessionData {
  type: 'dynamic';
  identity: IdentityType;
  identityName: string;
  traits: string[];
  traitsDesc: string;
  prompt: string;
}

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
  // 身份特质（旧版本兼容）
  trait?: string;
  traits?: string[];
}

// 玩家
export interface Player {
  id: string;
  name: string;
  identityType: IdentityType;
  identity: Identity;
  traits: Trait[];
  obsession: string | ObsessionData;
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
