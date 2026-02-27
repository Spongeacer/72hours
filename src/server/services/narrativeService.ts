/**
 * 叙事生成服务
 * 实现共振式文本生成
 * 
 * 核心原则：
 * 1. 不是预设公式，而是故事自己长出来
 * 2. 输入：在场者 + 环境 + 信号 + 记忆
 * 3. 共鸣（不是计算，是共振）
 * 4. 故事自然流淌
 */

import type { GameState, Player, NPC } from '../../game';
import { calculatePlayerAura, emergeBehavior } from './physicsService';

// 环境信号接口
interface EnvironmentalSignal {
  type: 'visual' | 'auditory' | 'olfactory' | 'atmospheric';
  description: string;
  intensity: number;
  emotionalTone: string;
}

// 天气信号库
const WEATHER_SIGNALS: Record<string, EnvironmentalSignal> = {
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

/**
 * 收集环境信号
 * 从物理状态提取感官信息
 */
function collectEnvironmentalSignals(gameState: GameState): EnvironmentalSignal[] {
  const signals: EnvironmentalSignal[] = [];
  
  // 天气信号
  if (WEATHER_SIGNALS[gameState.weather]) {
    signals.push(WEATHER_SIGNALS[gameState.weather]);
  }
  
  // 压强信号（1-20范围）
  if (gameState.pressure > 10) {
    signals.push({
      type: 'atmospheric',
      description: '空气中弥漫着不安',
      intensity: gameState.pressure * 5,
      emotionalTone: '焦虑'
    });
  }
  
  if (gameState.pressure > 14) {
    signals.push({
      type: 'olfactory',
      description: '远处传来烟味和血腥味',
      intensity: (gameState.pressure - 4) * 5,
      emotionalTone: '恐惧'
    });
  }
  
  // Ω信号 - 历史必然性
  if (gameState.omega > 12) {
    signals.push({
      type: 'atmospheric',
      description: '一种无法逃避的命运感笼罩着所有人',
      intensity: gameState.omega * 5,
      emotionalTone: '宿命'
    });
  }
  
  return signals;
}

/**
 * 计算集体情绪
 */
function calculateCollectiveMood(gameState: GameState): string {
  const { pressure } = gameState;
  
  if (pressure > 14) return '恐慌蔓延';
  if (pressure > 10) return '紧张不安';
  return '沉默等待';
}

/**
 * 生成共振式叙事
 * 不是模板填充，而是元素共振
 */
export function generateResonanceNarrative(
  gameState: GameState,
  spotlightNPC: NPC | null,
  player: Player
): string {
  const signals = collectEnvironmentalSignals(gameState);
  const collectiveMood = calculateCollectiveMood(gameState);
  const playerAura = calculatePlayerAura(player);
  
  // 叙事片段数组
  const fragments: string[] = [];
  
  // 1. 时间锚点（始终存在）
  fragments.push(`第${gameState.turn}回合。${collectiveMood}。`);
  
  // 2. 环境信号（选择最强的）
  if (signals.length > 0) {
    const strongestSignal = signals.sort((a, b) => b.intensity - a.intensity)[0];
    fragments.push(strongestSignal.description + '。');
  }
  
  // 3. 聚光灯NPC（如果有）
  if (spotlightNPC) {
    const behavior = emergeBehavior(spotlightNPC, player, gameState);
    fragments.push(`${behavior.description} /* ${behavior.drive} */`);
    
    // 执念暗示（50%概率）
    if (Math.random() > 0.5) {
      fragments.push(`你想起${spotlightNPC.name}曾说过："在乱世中活下去" /* 图式激活 */`);
    }
  }
  
  // 4. 玩家气场
  fragments.push(`你${playerAura}。`);
  
  // 组合成完整叙事
  return fragments.map(f => `> ${f}`).join('\n');
}

/**
 * 生成玩家选择
 * 基于玩家状态、NPC行为、情境共同涌现
 */
export function generateEmergentChoices(
  player: Player,
  spotlightNPC: NPC | null,
  gameState: GameState
): Array<{ id: string; text: string; type: string; drive: string }> {
  const choices: Array<{ id: string; text: string; type: string; drive: string }> = [];
  
  // 选择1：基于执念（最深层驱动）
  choices.push({
    id: `choice_obsession_${Date.now()}`,
    text: generateObsessionDrivenChoice(player, spotlightNPC),
    type: 'obsession',
    drive: `执念：${player.obsession}`
  });
  
  // 选择2：基于主导特质
  const dominantTrait = player.traits[0];
  if (dominantTrait) {
    choices.push({
      id: `choice_trait_${Date.now()}`,
      text: generateTraitDrivenChoice(player, dominantTrait.id, spotlightNPC),
      type: 'trait',
      drive: `特质：${dominantTrait.id}`
    });
  }
  
  // 选择3：基于本能/情境
  choices.push({
    id: `choice_instinct_${Date.now()}`,
    text: generateInstinctDrivenChoice(player, gameState, spotlightNPC),
    type: 'instinct',
    drive: '本能反应'
  });
  
  return choices;
}

/**
 * 生成执念驱动的选择
 */
function generateObsessionDrivenChoice(
  player: Player,
  spotlightNPC: NPC | null
): string {
  const obsession = player.obsession;
  
  if (spotlightNPC) {
    return `你想起自己的执念「${obsession}」，这让你看向${spotlightNPC.name}，试图从中找到线索。`;
  }
  
  return `你紧守着「${obsession}」的念头，在这个混乱的夜里寻找方向。`;
}

/**
 * 生成特质驱动的选择
 */
function generateTraitDrivenChoice(
  player: Player,
  traitId: string,
  spotlightNPC: NPC | null
): string {
  const traitChoices: Record<string, string> = {
    calm: '你深吸一口气，强迫自己冷静下来，观察周围的细节',
    curious: '你的好奇心驱使你去探查那处阴影',
    brave: '你握紧拳头，决定直面眼前的危险',
    greedy: '你的目光不自觉地扫向可能藏有财物的地方',
    compassionate: '你注意到某人的痛苦，想要伸出援手',
    deceitful: '你开始盘算如何利用这个局面',
    honest: '你决定坦诚面对，说出真实的想法',
    fearful: '你的身体在颤抖，但仍在努力思考对策'
  };
  
  const baseChoice = traitChoices[traitId] || '你凭着自己的性格做出反应';
  
  if (spotlightNPC) {
    return `${baseChoice}，同时留意着${spotlightNPC.name}的动向。`;
  }
  
  return baseChoice + '。';
}

/**
 * 生成本能驱动的选择
 */
function generateInstinctDrivenChoice(
  player: Player,
  gameState: GameState,
  spotlightNPC: NPC | null
): string {
  const { fear, hunger, aggression } = player.states;
  
  // 找出最强烈的状态
  const states = [
    { name: '恐惧', value: fear, action: '后退一步，寻找退路' },
    { name: '饥饿', value: hunger, action: '寻找食物或补给' },
    { name: '攻击性', value: aggression, action: '握紧武器，准备应对冲突' }
  ];
  
  const dominantState = states.sort((a, b) => b.value - a.value)[0];
  
  if (spotlightNPC) {
    return `${dominantState.action}，因为${spotlightNPC.name}让你感到${dominantState.name}。`;
  }
  
  return `${dominantState.action}，${dominantState.name}驱使着你。`;
}
