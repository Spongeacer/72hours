/**
 * 物理引擎服务
 * 实现引力模型：F = G × M₁ × M₂ / r² × P × Ω
 * 
 * 核心原则：
 * 1. 质量不是静态的，而是随叙事流动
 * 2. 距离产生美，也产生引力
 * 3. 压强和Ω调制整个场
 */

import { GAME_CONFIG } from '../../config/GameConfig';
import type { Player, NPC, GameState } from '../types/game.types';

// 引力常数
const G = 0.8;

// 质量分量接口
interface MassComponents {
  B: number;  // Base - 基础质量
  S: number;  // Story - 叙事质量
  K: number;  // Knot - 关系质量
  O: number;  // Object - 道具质量
}

/**
 * 计算实体的总质量
 * M = B + S + K + O
 */
export function calculateMass(entity: Player | NPC): number {
  const components = getMassComponents(entity);
  return components.B + components.S + components.K + components.O;
}

/**
 * 获取质量分量
 */
function getMassComponents(entity: Player | NPC): MassComponents {
  if ('identityType' in entity) {
    // 玩家
    return {
      B: entity.identity.baseMass,
      S: calculateStoryMass(entity),
      K: 0, // 玩家与NPC的关系在NPC端计算
      O: 0  // 道具系统待实现
    };
  } else {
    // NPC
    return {
      B: 2, // NPC基础质量
      S: entity.isBonded ? 2 : 0, // 关联NPC有叙事质量
      K: calculateKnotMass(entity),
      O: 0
    };
  }
}

/**
 * 计算叙事质量 S
 * 基于历史交互和事件参与
 */
function calculateStoryMass(entity: Player | NPC): number {
  // 简化为：每个特质增加0.5叙事质量
  return entity.traits.length * 0.5;
}

/**
 * 计算关系质量 K
 * K = 交互次数 × 0.5
 */
function calculateKnotMass(npc: NPC): number {
  // 关联NPC有基础关系质量
  return npc.isBonded ? 3 : 0;
}

/**
 * 计算欧几里得距离
 */
export function calculateDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算引力
 * F = G × M₁ × M₂ / r² × P × Ω
 */
export function calculateForce(
  entity1: Player | NPC,
  entity2: Player | NPC,
  gameState: GameState
): number {
  const m1 = calculateMass(entity1);
  const m2 = calculateMass(entity2);
  const distance = calculateDistance(entity1.position, entity2.position);
  
  // 避免除以0
  const safeDistance = Math.max(distance, 0.1);
  
  // 基础引力
  const baseForce = (G * m1 * m2) / (safeDistance * safeDistance);
  
  // 场调制
  const pressureModulation = 1 + gameState.pressure * 0.05;
  const omegaModulation = 1 + gameState.omega * 0.02;
  
  return baseForce * pressureModulation * omegaModulation;
}

/**
 * 选择聚光灯NPC
 * 基于引力最大，但加入随机扰动（无因之果）
 */
export function selectSpotlightNPC(
  player: Player,
  npcs: NPC[],
  gameState: GameState
): NPC | null {
  const unlockedNPCs = npcs.filter(npc => npc.isUnlocked);
  if (unlockedNPCs.length === 0) return null;
  
  // 计算每个NPC的引力
  const npcForces = unlockedNPCs.map(npc => ({
    npc,
    force: calculateForce(player, npc, gameState)
  }));
  
  // 加入随机扰动（20%混沌）- 无因之果
  npcForces.forEach(nf => {
    nf.force *= 0.8 + Math.random() * 0.4; // 0.8 - 1.2
  });
  
  // 选择最大引力
  npcForces.sort((a, b) => b.force - a.force);
  return npcForces[0].npc;
}

/**
 * 更新物理状态
 * 压强和Ω随时间演化
 */
export function updatePhysics(state: GameState): void {
  // 压强增长 - 历史不可逆
  state.pressure = Math.min(
    GAME_CONFIG.MAX_PRESSURE,
    state.pressure + GAME_CONFIG.PRESSURE_INCREASE
  );
  
  // Ω增长 - 历史必然性
  let omegaIncrease = GAME_CONFIG.OMEGA_BASE_INCREASE;
  
  // 蝴蝶效应 - 随机扰动
  const butterflyEffect = Math.random();
  if (butterflyEffect > 0.7) {
    omegaIncrease += 0.1; // 30%概率轻微加速
  } else if (butterflyEffect > 0.9) {
    omegaIncrease += 0.2; // 10%概率显著加速
  }
  
  // 高压加速Ω增长
  if (state.pressure >= GAME_CONFIG.HIGH_PRESSURE_THRESHOLD) {
    omegaIncrease *= GAME_CONFIG.OMEGA_HIGH_PRESSURE_MULTIPLIER;
  }
  
  state.omega = Math.min(GAME_CONFIG.MAX_OMEGA, state.omega + omegaIncrease);
}

/**
 * 计算玩家气场
 * 基于状态的自然流露
 */
export function calculatePlayerAura(player: Player): string {
  const { fear, aggression, hunger, injury } = player.states;
  
  // 极端状态优先
  if (fear > 14) return '恐惧的颤抖';
  if (aggression > 14) return '压抑的愤怒';
  if (hunger > 14) return '饥饿的虚弱';
  if (injury > 10) return '带伤的疲惫';
  
  // 特质影响
  const traitIds = player.traits.map(t => t.id);
  if (traitIds.includes('calm')) return '沉默的警惕';
  if (traitIds.includes('curious')) return '探究的目光';
  if (traitIds.includes('brave')) return '坚定的姿态';
  
  // 默认
  return '平静的存在';
}

/**
 * 涌现行为选择
 * 基于NPC状态和与玩家的关系
 */
export function emergeBehavior(
  npc: NPC,
  player: Player,
  gameState: GameState
): { type: string; description: string; drive: string } {
  // 获取NPC状态（简化，实际应该从NPC对象获取）
  const fear = 8; // 默认值
  const aggression = 6;
  const hunger = 7;
  
  // 计算引力
  const force = calculateForce(player, npc, gameState);
  const knot = npc.isBonded ? 5 : 0;
  
  // 构建"感觉场"
  const feelings: Array<{ type: string; intensity: number; drive: string }> = [];
  
  // 基础生存需求
  if (fear > 12) feelings.push({ type: 'panic', intensity: fear, drive: '恐惧管理理论' });
  if (aggression > 12) feelings.push({ type: 'hostility', intensity: aggression, drive: '挫折-攻击假说' });
  if (hunger > 12) feelings.push({ type: 'desperation', intensity: hunger, drive: '生存本能' });
  
  // 社会连接
  if (knot > 8) feelings.push({ type: 'attachment', intensity: knot, drive: '依恋理论' });
  if (force > 8) feelings.push({ type: 'attraction', intensity: force, drive: '社会引力' });
  
  // 选择最强烈的感觉（加入随机性）
  if (feelings.length === 0) {
    return { type: 'idle', description: '沉默地站着', drive: '认知评价' };
  }
  
  feelings.sort((a, b) => b.intensity - a.intensity);
  const topFeelings = feelings.slice(0, Math.min(3, feelings.length));
  const selected = topFeelings[Math.floor(Math.random() * topFeelings.length)];
  
  // 映射到行为
  const behaviorMap: Record<string, string> = {
    panic: '发抖，眼神游离',
    hostility: '握紧拳头，指节发白',
    desperation: '肚子在叫，目光在你的包袱上停留',
    attachment: '靠了过来，像是要确认你还在',
    attraction: '被什么吸引着，目光无法移开',
    idle: '沉默地站着，不知道在想什么'
  };
  
  return {
    type: selected.type,
    description: `${npc.name}${behaviorMap[selected.type] || '沉默不语'}`,
    drive: selected.drive
  };
}
