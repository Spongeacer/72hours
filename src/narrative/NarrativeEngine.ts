/**
 * NarrativeEngine - 叙事引擎
 */

import { GameState, Choice, TurnContext } from '../../shared/types';
import { Player } from '../game/Player';
import { NPC } from '../game/NPC';
import { GAME_CONFIG } from '../config/GameConfig';

export class NarrativeEngine {
  ai: any;
  model: string;

  constructor(ai: any, model: string) {
    this.ai = ai;
    this.model = model;
  }

  /**
   * 生成执念
   */
  async generateObsession(data: any): Promise<string> {
    if (!this.ai) {
      return `在${data.traitsDesc}的驱使下活下去`;
    }

    try {
      const prompt = data.prompt;
      const response = await this.ai.generate(prompt, this.model);
      return response.trim() || `在${data.traitsDesc}的驱使下活下去`;
    } catch (error) {
      console.error('[NarrativeEngine] 生成执念失败:', error);
      return `在${data.traitsDesc}的驱使下活下去`;
    }
  }

  /**
   * 生成叙事
   */
  async generateNarrative(gameState: GameState): Promise<string> {
    const { turn, player, npcs, pressure, omega, weather } = gameState;
    
    // 构建上下文
    const context = this.buildContext(gameState);
    
    if (!this.ai) {
      // 离线模式：返回简化叙事
      return this.generateOfflineNarrative(gameState);
    }

    try {
      const prompt = this.buildNarrativePrompt(context);
      const response = await this.ai.generate(prompt, this.model);
      return response.trim() || this.generateOfflineNarrative(gameState);
    } catch (error) {
      console.error('[NarrativeEngine] 生成叙事失败:', error);
      return this.generateOfflineNarrative(gameState);
    }
  }

  /**
   * 生成选择
   */
  async generateChoices(gameState: GameState): Promise<Choice[]> {
    const { player, npcs, pressure } = gameState;
    
    // 基础选择
    const choices: Choice[] = [
      { id: 'explore', text: '探索周围环境' },
      { id: 'rest', text: '找个地方休息' },
      { id: 'observe', text: '观察附近的人' }
    ];

    // 根据NPC添加互动选择
    const nearbyNPCs = npcs.filter(n => n.isUnlocked);
    nearbyNPCs.forEach(npc => {
      const knot = player.getKnotWith(npc.id);
      if (knot > 0) {
        choices.push({
          id: `talk_${npc.id}`,
          text: `与${npc.name}交谈`
        });
      }
    });

    // 高恐惧时的逃跑选择
    if (player.states.fear > 60) {
      choices.push({
        id: 'flee',
        text: '逃离这个危险的地方',
        isHidden: player.states.fear < 80
      });
    }

    // 高饥饿时的觅食选择
    if (player.states.hunger > 60) {
      choices.push({
        id: 'forage',
        text: '寻找食物'
      });
    }

    // 高攻击性的暴力选择
    if (player.states.aggression > 70) {
      choices.push({
        id: 'violence',
        text: '采取暴力行动',
        isHidden: true
      });
    }

    return choices.slice(0, 4); // 最多4个选择
  }

  /**
   * 执行选择
   */
  async executeChoice(
    choice: Choice,
    context: TurnContext,
    gameState: GameState
  ): Promise<{ narrative?: string; result?: string; stateChanges?: any }> {
    const { player } = gameState;

    // 根据选择类型处理
    switch (choice.id) {
      case 'explore':
        player.updateState('hunger', 5);
        return {
          result: '你在村子里走了一圈，发现了一些有趣的东西。',
          stateChanges: { player }
        };

      case 'rest':
        player.updateState('fear', -10);
        player.updateState('hunger', 10);
        return {
          result: '你休息了一会儿，感觉稍微平静了一些。',
          stateChanges: { player }
        };

      case 'observe':
        return {
          result: '你观察着周围的人，试图理解这个混乱的夜晚。',
          stateChanges: { player }
        };

      case 'flee':
        player.position.x += 2;
        player.updateState('fear', -20);
        return {
          result: '你决定离开这个危险的地方。',
          stateChanges: { player }
        };

      case 'forage':
        player.updateState('hunger', -30);
        return {
          result: '你找到了一些食物，缓解了饥饿。',
          stateChanges: { player }
        };

      case 'violence':
        player.updateState('aggression', -10);
        player.updateState('injury', 10);
        gameState.pressure = Math.min(GAME_CONFIG.MAX_PRESSURE, gameState.pressure + 5);
        return {
          result: '你的暴力行为让局势更加紧张。',
          stateChanges: { player, pressure: gameState.pressure }
        };

      default:
        if (choice.id.startsWith('talk_')) {
          const npcId = choice.id.replace('talk_', '');
          const npc = gameState.npcs.find(n => n.id === npcId);
          if (npc) {
            player.updateKnot(npc.id, 1);
            npc.updateKnot(player.id, 1);
            return {
              result: `你与${npc.name}交谈了一会儿，关系有所增进。`,
              stateChanges: { player, npcs: gameState.npcs }
            };
          }
        }
        return { result: '你做出了选择，等待结果...' };
    }
  }

  /**
   * 构建上下文
   */
  private buildContext(gameState: GameState): any {
    const { turn, player, npcs, pressure, omega, weather, datetime } = gameState;
    
    return {
      turn,
      player: {
        name: player.name,
        identity: player.identity.name,
        traits: player.traits.filter(t => t.type === 'personality').map(t => t.id),
        obsession: typeof player.obsession === 'string' ? player.obsession : '',
        states: player.states,
        position: player.position
      },
      npcs: npcs.filter(n => n.isUnlocked).map(n => ({
        name: n.name,
        isBonded: n.isBonded,
        knot: player.getKnotWith(n.id)
      })),
      pressure,
      omega,
      weather,
      datetime
    };
  }

  /**
   * 构建叙事提示词
   */
  private buildNarrativePrompt(context: any): string {
    return `你是一个叙事游戏引擎。根据以下游戏状态，生成一段沉浸式的叙事文本。

游戏状态：
- 回合: ${context.turn}/36
- 时间: ${new Date(context.datetime).toLocaleString('zh-CN')}
- 天气: ${context.weather}
- 压强: ${context.pressure.toFixed(1)}
- Ω: ${context.omega.toFixed(2)}

玩家信息：
- 身份: ${context.player.identity}
- 特质: ${context.player.traits.join('、')}
- 执念: ${context.player.obsession}
- 状态: 恐惧${context.player.states.fear} | 攻击性${context.player.states.aggression} | 饥饿${context.player.states.hunger} | 伤势${context.player.states.injury}

关联NPC: ${context.npcs.map((n: any) => `${n.name}(K=${n.knot})`).join(', ') || '无'}

请生成一段200-400字的叙事，描述当前场景和氛围。使用第二人称"你"。`;
  }

  /**
   * 离线模式叙事
   */
  private generateOfflineNarrative(gameState: GameState): string {
    const { turn, pressure, weather, player } = gameState;
    
    const weatherDesc: Record<string, string> = {
      clear: '阳光透过云层洒下',
      rain: '雨点敲打着屋顶',
      fog: '浓雾笼罩着村子',
      night: '夜色深沉，星光微弱'
    };

    let narrative = `> 第${turn}回合。${weatherDesc[weather] || '空气凝重'}。
> 
> 你感到${player.states.fear > 50 ? '恐惧' : player.states.hunger > 50 ? '饥饿' : '疲惫'}在蔓延。
> 
> 远处传来人声，不知道是谁在说话。这个夜晚似乎永远不会结束。
    `.trim();

    if (pressure > 50) {
      narrative += '\n> \n> 空气中的紧张感越来越强烈，你知道有什么大事要发生了。';
    }

    return narrative;
  }
}
