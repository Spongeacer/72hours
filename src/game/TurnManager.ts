/**
 * TurnManager - 回合管理器（集成物理引擎）
 */

import { GameState, TurnResult, Choice, NPC } from '../../shared/types';
import { EmergentNarrativeEngine } from '../narrative/EmergentNarrativeEngine';
import { Player } from '../game/Player';
import { GravityEngine } from '../core/GravityEngine';
import type { MassObject } from '../core/GravityEngine';

export interface TurnContext {
  turn: number;
  narrative: string;
  choices: Choice[];
  npcs: NPC[];
  player: Player;
}

export class TurnManager {
  gameState: GameState;
  narrativeEngine: EmergentNarrativeEngine;
  gravityEngine: GravityEngine;
  currentContext: TurnContext | null = null;

  constructor(gameState: GameState, narrativeEngine: EmergentNarrativeEngine) {
    this.gameState = gameState;
    this.narrativeEngine = narrativeEngine;
    this.gravityEngine = new GravityEngine(gameState.pressure, gameState.omega);
  }

  /**
   * 执行新回合
   */
  async executeTurn(): Promise<TurnResult> {
    const { gameState } = this;
    
    // 增加回合数
    gameState.turn++;
    
    // 更新时间
    this.updateTime();
    
    // 更新天气
    this.updateWeather();
    
    // 更新物理引擎
    this.gravityEngine.updatePhysics(gameState.turn);
    const physicsState = this.gravityEngine.getPhysicsState();
    gameState.pressure = physicsState.pressure;
    gameState.omega = physicsState.omega;
    
    // 解锁NPC
    this.unlockNPCs();
    
    // 物理移动NPC（使用引力引擎）
    this.moveNPCsWithGravity();
    
    // 生成涌现式叙事
    const narrative = await this.narrativeEngine.generateEmergentNarrative(gameState);
    
    // 生成选择（考虑物理距离）
    const choices = await this.generateChoicesWithPhysics();
    
    // 保存上下文
    this.currentContext = {
      turn: gameState.turn,
      narrative,
      choices,
      npcs: gameState.npcs,
      player: gameState.player
    };
    
    return {
      turn: gameState.turn,
      narrative,
      choices,
      state: { ...gameState }
    };
  }

  /**
   * 处理玩家选择
   */
  async processChoice(choice: Choice, context: TurnContext | null): Promise<TurnResult> {
    if (!context) {
      throw new Error('没有可用的回合上下文');
    }

    const { gameState } = this;
    
    // 执行选择结果（涌现式处理）
    const result = await this.processEmergentChoice(choice, context, gameState);
    
    // 更新游戏状态
    if (result.stateChanges) {
      Object.assign(gameState, result.stateChanges);
    }
    
    // 检查游戏结束
    const gameOver = this.checkGameOver();
    
    // 记录历史
    gameState.history.push({
      turn: gameState.turn,
      choice: choice.text,
      result: result.narrative || result.result,
      timestamp: new Date().toISOString()
    });
    
    return {
      turn: gameState.turn,
      narrative: result.narrative || '',
      choices: [],
      result: result.result,
      state: { ...gameState },
      gameOver
    };
  }

  /**
   * 更新时间
   */
  private updateTime(): void {
    const current = new Date(this.gameState.datetime);
    current.setMinutes(current.getMinutes() + 60);
    this.gameState.datetime = current.toISOString();
  }

  /**
   * 更新天气
   */
  private updateWeather(): void {
    const hour = new Date(this.gameState.datetime).getHours();
    
    if (hour >= 6 && hour < 18) {
      this.gameState.weather = 'clear';
    } else if (hour >= 20 || hour < 5) {
      this.gameState.weather = 'night';
    } else {
      this.gameState.weather = 'fog';
    }
  }

  /**
   * 解锁NPC
   */
  private unlockNPCs(): void {
    this.gameState.npcs.forEach(npc => {
      if (!npc.isUnlocked) {
        npc.checkUnlock(this.gameState);
      }
    });
  }

  /**
   * 使用引力引擎移动NPC
   */
  private moveNPCsWithGravity(): void {
    const { player, npcs } = this.gameState;
    
    // 构建玩家质量对象
    const playerMass: MassObject = {
      id: player.id,
      mass: player.getTotalMass(),
      effectiveMass: player.getEffectiveMass(),
      position: player.position,
      trapConstant: player.trapConstant
    };

    // 为每个解锁的NPC计算引力移动
    npcs.forEach(npc => {
      if (!npc.isUnlocked) return;
      
      // 构建NPC质量对象
      const npcMass: MassObject = {
        id: npc.id,
        mass: npc.getTotalMass(),
        effectiveMass: npc.getEffectiveMass(),
        position: npc.position,
        trapConstant: npc.trapConstant
      };

      // 计算玩家对NPC的引力
      const force = this.gravityEngine.calculateForce(npcMass, playerMass);
      
      // 获取K值和恐惧值
      const knot = npc.getKnotWith(player.id);
      const fear = npc.states.fear;
      
      // 计算新位置
      const newPosition = this.gravityEngine.calculateMovement(
        npcMass,
        force,
        fear,
        knot
      );
      
      // 更新NPC位置
      npc.position = newPosition;
      
      // 记录移动日志
      console.log(`[Gravity] ${npc.name} 受到引力 ${force.magnitude.toFixed(2)}，移动到 (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)})`);
    });
  }

  /**
   * 生成选择（考虑物理距离）
   */
  private async generateChoicesWithPhysics(): Promise<Choice[]> {
    const { player, npcs } = this.gameState;
    
    // 基础选择
    const choices: Choice[] = [
      { id: 'explore', text: '探索周围环境' },
      { id: 'rest', text: '找个地方休息' },
      { id: 'observe', text: '观察附近的人' }
    ];

    // 根据物理距离和K值添加NPC互动选择
    npcs.forEach(npc => {
      if (!npc.isUnlocked) return;
      
      const distance = this.calculateDistance(player.position, npc.position);
      const knot = player.getKnotWith(npc.id);
      
      // 距离近且K值高时更可能出现
      const appearanceProbability = this.calculateAppearanceProbability(distance, knot);
      
      if (appearanceProbability > 0.3) {  // 30%阈值
        choices.push({
          id: `talk_${npc.id}`,
          text: `与${npc.name}交谈`,
          type: distance < 2 ? 'normal' : 'hidden'  // 远距离为隐藏选择
        });
      }
    });

    // 高恐惧时的逃跑选择
    if (player.states.fear > 60) {
      choices.push({
        id: 'flee',
        text: '逃离这个危险的地方',
        type: 'hidden'
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
        type: 'hidden'
      });
    }

    return choices.slice(0, 4);
  }

  /**
   * 计算距离
   */
  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算NPC出现概率
   * 基于物理距离和K值
   */
  private calculateAppearanceProbability(distance: number, knot: number): number {
    // 距离因子：越近概率越高
    const distanceFactor = Math.max(0, 1 - distance / 5);
    
    // K值因子：关系越好概率越高
    const knotFactor = (knot + 10) / 20;  // 归一化到0-1
    
    // 综合概率
    return distanceFactor * 0.6 + knotFactor * 0.4;
  }

  /**
   * 处理涌现式选择
   * 不是硬编码，而是基于当前情境自然涌现结果
   */
  private async processEmergentChoice(
    choice: Choice,
    context: TurnContext,
    gameState: GameState
  ): Promise<{ narrative?: string; result?: string; stateChanges?: any }> {
    const { player } = gameState;
    
    // 获取聚光灯NPC
    const spotlightNPC = context.npcs.find(n => 
      choice.id === `talk_${n.id}`
    );
    
    // 基于选择类型和当前情境涌现结果
    switch (choice.id) {
      case 'explore':
        return this.emergeExploreResult(player, gameState);
        
      case 'rest':
        return this.emergeRestResult(player, gameState);
        
      case 'observe':
        return this.emergeObserveResult(player, gameState, context.npcs);
        
      case 'flee':
        return this.emergeFleeResult(player, gameState);
        
      case 'forage':
        return this.emergeForageResult(player, gameState);
        
      default:
        if (choice.id.startsWith('talk_') && spotlightNPC) {
          return this.emergeTalkResult(player, spotlightNPC, gameState);
        }
        return { result: '时间流逝，什么也没发生。' };
    }
  }

  /**
   * 探索的涌现结果
   */
  private emergeExploreResult(player: Player, gameState: GameState) {
    const discoveries: string[] = [];
    const stateChanges: any = { player };
    
    // 基于压强和Ω涌现不同发现
    if (gameState.pressure > 50) {
      discoveries.push('远处有火光');
      player.states.fear += 5;
    }
    
    if (gameState.omega > 2) {
      discoveries.push('空气中弥漫着紧张');
      player.states.fear += 3;
    }
    
    // 随机发现
    const randomFinds = [
      '地上有一把生锈的刀',
      '墙角有新鲜的脚印',
      '风带来陌生的口音',
      '一只乌鸦在屋顶注视着你'
    ];
    
    if (Math.random() > 0.5) {
      discoveries.push(randomFinds[Math.floor(Math.random() * randomFinds.length)]);
    }
    
    player.states.hunger += 5;
    
    return {
      result: discoveries.length > 0 
        ? `你在村子里走了一圈。${discoveries.join('，')}。`
        : '你在村子里走了一圈，什么也没发现。',
      stateChanges
    };
  }

  /**
   * 休息的涌现结果
   */
  private emergeRestResult(player: Player, gameState: GameState) {
    const restQuality = Math.max(0, 100 - gameState.pressure - player.states.fear);
    
    // eslint-disable-next-line no-useless-assignment
    let result = '';
    if (restQuality > 70) {
      result = '你找了个安静的角落，睡得很沉。醒来时精神好了许多。';
      player.states.fear = Math.max(0, player.states.fear - 15);
      player.states.hunger += 5;
    } else if (restQuality > 40) {
      result = '你断断续续地睡了一会儿，总是被远处的声音惊醒。';
      player.states.fear = Math.max(0, player.states.fear - 5);
      player.states.hunger += 10;
    } else {
      result = '你无法入睡，每一声风吹草动都让你紧张。';
      player.states.fear += 5;
      player.states.hunger += 15;
    }
    
    return { result, stateChanges: { player } };
  }

  /**
   * 观察的涌现结果
   */
  private emergeObserveResult(player: Player, gameState: GameState, npcs: NPC[]) {
    const observations: string[] = [];
    
    // 观察NPC
    const unlockedNPCs = npcs.filter(n => n.isUnlocked);
    if (unlockedNPCs.length > 0) {
      const targetNPC = unlockedNPCs[Math.floor(Math.random() * unlockedNPCs.length)];
      
      if (targetNPC.states.fear > 60) {
        observations.push(`${targetNPC.name}在发抖`);
      } else if (targetNPC.states.aggression > 60) {
        observations.push(`${targetNPC.name}眼神凶狠`);
      } else {
        observations.push(`${targetNPC.name}看起来很平静`);
      }
    }
    
    // 环境观察
    if (gameState.pressure > 60) {
      observations.push('人们的脚步都很匆忙');
    }
    
    return {
      result: observations.length > 0
        ? `你观察着周围。${observations.join('，')}。`
        : '你观察着周围，一切似乎都很平常。',
      stateChanges: { player }
    };
  }

  /**
   * 逃跑的涌现结果
   */
  private emergeFleeResult(player: Player, _gameState: GameState) {
    const fleeSuccess = player.states.fear > 80 && Math.random() > 0.3;
    
    if (fleeSuccess) {
      player.position.x += 3;
      player.position.y += Math.random() * 2 - 1;
      player.states.fear = Math.max(0, player.states.fear - 25);
      
      return {
        result: '你趁着夜色逃离了村子，心跳如鼓。回头看时，火光已经很远。',
        stateChanges: { player }
      };
    } else {
      player.position.x += 1;
      player.states.fear = Math.max(0, player.states.fear - 10);
      
      return {
        result: '你试图离开，但每条路都让你犹豫。最后只在村子边缘转了一圈。',
        stateChanges: { player }
      };
    }
  }

  /**
   * 觅食的涌现结果
   */
  private emergeForageResult(player: Player, gameState: GameState) {
    const forageQuality = Math.random() * 100 - gameState.pressure * 0.3;
    
    if (forageQuality > 50) {
      player.states.hunger = Math.max(0, player.states.hunger - 30);
      return {
        result: '你找到了一些干粮，虽然粗糙，但能填饱肚子。',
        stateChanges: { player }
      };
    } else if (forageQuality > 20) {
      player.states.hunger = Math.max(0, player.states.hunger - 15);
      return {
        result: '你只找到一些野果，酸涩难咽。',
        stateChanges: { player }
      };
    } else {
      player.states.hunger += 5;
      return {
        result: '你找了很久，什么也没找到，反而更饿了。',
        stateChanges: { player }
      };
    }
  }

  /**
   * 交谈的涌现结果
   */
  private emergeTalkResult(player: Player, npc: NPC, gameState: GameState) {
    const knot = player.getKnotWith(npc.id);
    
    // 增进关系
    player.updateKnot(npc.id, 1);
    npc.updateKnot(player.id, 1);
    
    // 基于NPC状态涌现对话内容
    // eslint-disable-next-line no-useless-assignment
    let dialogue = '';
    if (npc.states.fear > 60) {
      dialogue = `${npc.name}低声说："我怕。"`;
      player.states.fear += 3;
    } else if (npc.states.hunger > 60) {
      dialogue = `${npc.name}看着你，眼神里有饥饿。`;
    } else if (knot > 5) {
      dialogue = `${npc.name}握住你的手，什么也没说。`;
      player.states.fear = Math.max(0, player.states.fear - 5);
    } else {
      const topics = [
        '天气',
        '远处的火光',
        '太平军的传闻',
        '明天的打算'
      ];
      dialogue = `你们聊起了${topics[Math.floor(Math.random() * topics.length)]}。`;
    }
    
    return {
      result: dialogue,
      stateChanges: { player, npcs: gameState.npcs }
    };
  }

  /**
   * 检查游戏结束
   */
  private checkGameOver(): { type: 'death' | 'escape' | 'completed'; reason: string } | null {
    const { player, turn, config } = this.gameState;
    
    if (player.checkDeath()) {
      return { type: 'death', reason: player.states.injury >= 100 ? '伤势过重' : '饥饿致死' };
    }
    
    if (player.checkEscape()) {
      return { type: 'escape', reason: '成功逃离金田' };
    }
    
    if (turn >= config.MAX_TURNS) {
      return { type: 'completed', reason: '金田起义爆发' };
    }
    
    return null;
  }
}

export default TurnManager;
