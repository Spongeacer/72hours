/**
 * NPC 相关类型
 */

import type { Trait, Position } from './base';
import type { PlayerStates } from './player';

// NPC 状态
export interface NPCStates {
  fear: number;
  aggression: number;
  hunger: number;
  injury: number;
}

// NPC
export interface NPC {
  id: string;
  name: string;
  baseMass: number;
  traits: Trait[];
  obsession: string;
  states: NPCStates;
  position: Position;
  isBonded: boolean;
  isElite: boolean;
  isUnlocked: boolean;
  initialKnot?: number;
}
