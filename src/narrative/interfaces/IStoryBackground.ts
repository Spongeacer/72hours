/**
 * IStoryBackground - 故事背景接口
 * 可拔插的背景模块，定义特定历史/虚构背景的叙事规则
 */

import { GameState, NPC, Player } from '../../../shared/types';

export interface IStoryBackground {
  id: string;
  name: string;
  description: string;
  
  // 时间设定
  startDate: string;  // ISO 8601
  totalTurns: number;
  
  // 环境描述
  getEnvironmentalDescription(time: number, weather: string): string;
  
  // 特定回合的固定事件
  getFixedEvent(turn: number): FixedEvent | null;
  
  // 角色背景生成
  generatePlayerBackstory(identity: string, traits: string[]): string;
  generateNPCBackstory(role: string): string;
  
  // 叙事语料
  getAtmosphericWords(mood: string): string[];
  getImageryPool(): string[];
  
  // 行为语境
  contextualizeBehavior(behavior: string, actor: NPC, target: Player): string;
}

export interface FixedEvent {
  turn: number;
  title: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'pressure' | 'omega' | 'npc_unlock' | 'npc_state' | 'global_signal';
  target?: string;
  value: number | string | boolean;
}

export default IStoryBackground;
