/**
 * TurnManager - 回合管理器（集成物理引擎）
 */

import { GameState, TurnResult, Choice, NPC } from '../../shared/types';
import { NarrativeEngine } from '../narrative/NarrativeEngine';
import { Player } from '../game/Player';
import { GravityEngine, MassObject } from '../core/GravityEngine';

export interface TurnContext {
  turn: number;
  narrative: string;
  choices: Choice[];
  npcs: NPC[];
  player: Player;
}

export class TurnManager {
  gameState: GameState;
  narrativeEngine: NarrativeEngine;
  gravityEngine: GravityEngine;
  currentContext: TurnContext | null = null;

  constructor(gameState: GameState, narrativeEngine: NarrativeEngine) {
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
    
    // 生成叙事
    const narrative = await this.narrativeEngine.generateNarrative(gameState);
    
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
    
    // 执行选择结果
    const result = await this.narrativeEngine.executeChoice(
      choice,
      context,
      gameState
    );
    
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
