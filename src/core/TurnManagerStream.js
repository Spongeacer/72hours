/**
 * 流式回合管理器 - 支持 SSE 流式输出
 */

const { TurnManager } = require('./TurnManager');

class TurnManagerStream extends TurnManager {
  constructor(gameState, narrativeEngine) {
    super(gameState, narrativeEngine);
  }

  /**
   * 流式执行回合
   * @param {Function} onChunk - 流式回调 (chunk, fullText, stage)
   */
  async executeTurnStream(onChunk) {
    this.turn++;
    
    // 1. 更新世界状态
    this.updateWorldState();
    
    // 2. 检查事件触发
    const triggeredEvent = this.checkEventTrigger();
    
    // 3. NPC移动
    this.moveAllNPCs();
    
    // 4. 计算引力，选择聚光灯
    const { npc: spotlightNPC, gravity } = this.selectSpotlight();
    
    // 5. 流式生成叙事和选择
    const narrativeContext = this.assembleContext(spotlightNPC, triggeredEvent);
    
    // 调用流式生成
    const { narrative, choices } = await this.narrativeEngine.generateSceneStream(
      narrativeContext,
      onChunk
    );
    
    // 将 choices 添加到 context
    narrativeContext.choices = choices;
    narrativeContext.narrative = narrative;
    
    // 6. 返回结果
    return {
      turn: this.turn,
      narrative,
      choices,
      context: narrativeContext
    };
  }

  /**
   * 流式处理玩家选择
   * @param {Object} choice - 玩家选择
   * @param {Object} context - 当前上下文
   * @param {Function} onChunk - 流式回调
   */
  async processChoiceStream(choice, context, onChunk) {
    const player = context.playerRef || this.gameState.player;
    const spotlightNPC = context.spotlightNPC;
    
    // 7. 流式生成结果
    const { result, followUpNarrative } = await this.narrativeEngine.generateResultStream(
      context,
      choice,
      onChunk
    );
    
    // 8. 更新状态
    this.updatePlayerStates(player, result);
    this.updateNPCStates(spotlightNPC, result);
    this.updateRelationships(player, spotlightNPC, result);
    
    // 9. 检查游戏结束
    const gameOver = this.checkGameOver();
    
    return {
      success: true,
      result,
      followUpNarrative,
      gameOver,
      context,
      nextTurn: gameOver ? null : this.turn + 1
    };
  }
}

module.exports = { TurnManagerStream };
