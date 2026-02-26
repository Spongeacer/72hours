/**
 * TurnManager - 回合管理器
 */

import { GameState, TurnResult, Choice, NPC } from '../../shared/types';
import { NarrativeEngine } from '../narrative/NarrativeEngine';
import { Player } from './Player';

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
  currentContext: TurnContext | null = null;

  constructor(gameState: GameState, narrativeEngine: NarrativeEngine) {
    this.gameState = gameState;
    this.narrativeEngine = narrativeEngine;
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
    
    // 更新压强
    this.updatePressure();
    
    // 更新Ω
    this.updateOmega();
    
    // 解锁NPC
    this.unlockNPCs();
    
    // 移动NPC
    this.moveNPCs();
    
    // 生成叙事
    const narrative = await this.narrativeEngine.generateNarrative(gameState);
    
    // 生成选择
    const choices = await this.narrativeEngine.generateChoices(gameState);
    
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
    current.setMinutes(current.getMinutes() + 60); // 每回合1小时
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
   * 更新压强
   */
  private updatePressure(): void {
    const { config } = this.gameState;
    this.gameState.pressure += config.PRESSURE.BASE_GROWTH;
  }

  /**
   * 更新Ω
   */
  private updateOmega(): void {
    const { config } = this.gameState;
    const { pressure, omega } = this.gameState;
    
    if (pressure >= config.OMEGA.EXPONENTIAL_THRESHOLD) {
      this.gameState.omega = Math.min(
        config.OMEGA.MAX,
        omega * config.OMEGA.EXPONENTIAL_BASE
      );
    } else {
      this.gameState.omega += config.OMEGA.LINEAR_GROWTH;
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
   * 移动NPC
   */
  private moveNPCs(): void {
    const { player, npcs, config } = this.gameState;
    
    npcs.forEach(npc => {
      if (!npc.isUnlocked) return;
      
      const fear = npc.states.fear;
      const knot = npc.getKnotWith(player.id);
      
      // 恐惧逃跑
      if (fear >= config.MOVEMENT.FEAR_ESCAPE_THRESHOLD) {
        // 远离玩家
        const dx = npc.position.x - player.position.x;
        const dy = npc.position.y - player.position.y;
        npc.position.x += Math.sign(dx) * config.MOVEMENT.FEAR_BIAS_FACTOR;
        npc.position.y += Math.sign(dy) * config.MOVEMENT.FEAR_BIAS_FACTOR;
      } else if (knot > 0) {
        // 靠近玩家
        const dx = player.position.x - npc.position.x;
        const dy = player.position.y - npc.position.y;
        npc.position.x += Math.sign(dx) * 0.3;
        npc.position.y += Math.sign(dy) * 0.3;
      }
      
      // 随机移动
      npc.position.x += (Math.random() - 0.5) * config.MOVEMENT.RANDOM_WALK_RANGE;
      npc.position.y += (Math.random() - 0.5) * config.MOVEMENT.RANDOM_WALK_RANGE;
    });
  }

  /**
   * 检查游戏结束
   */
  private checkGameOver(): { type: 'death' | 'escape' | 'completed'; reason: string } | null {
    const { player, turn, config } = this.gameState;
    
    // 死亡
    if (player.checkDeath()) {
      return { type: 'death', reason: player.states.injury >= 100 ? '伤势过重' : '饥饿致死' };
    }
    
    // 逃离
    if (player.checkEscape()) {
      return { type: 'escape', reason: '成功逃离金田' };
    }
    
    // 完成72回合
    if (turn >= config.MAX_TURNS) {
      return { type: 'completed', reason: '金田起义爆发' };
    }
    
    return null;
  }
}
