import React from 'react';
import { GameState, Player, NPC } from '../../../../shared/types';

interface TurnInfoPanelProps {
  gameState: GameState;
  player: Player;
  _npcs?: NPC[];
}

export const TurnInfoPanel: React.FC<TurnInfoPanelProps> = ({ 
  gameState, 
  player
}) => {
  // 计算压强显示
  const pressure = Math.min(20, 10 + (gameState.turn - 1) * 1.5);
  const pressureStr = `${Math.floor(pressure)}/20`;
  
  // 格式化日期
  const gameDate = new Date(gameState.datetime);
  const formattedDate = `${gameDate.getFullYear()}年${gameDate.getMonth() + 1}月${gameDate.getDate()}日 ${gameDate.getHours().toString().padStart(2, '0')}:${gameDate.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="game-panel h-full overflow-hidden">
      <div className="module-title">📊 回合信息</div>
      <div className="p-3 text-sm h-[calc(100%-40px)]">
        <div className="info-row">
          <span className="info-label">回合</span>
          <span className="info-value">第 {gameState.turn} 回合</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">日期</span>
          <span className="info-value text-xs">{formattedDate}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">环境压强</span>
          <span className="info-value">{pressureStr}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">AI模型</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="info-value text-xs">MiniMax-M2.1</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-game-border">
          <p className="text-game-dim text-xs mb-2">玩家状态</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>恐惧: {player.states.fear}/20</div>
            <div>攻击: {player.states.aggression}/20</div>
            <div>饥饿: {player.states.hunger}/20</div>
            <div>伤势: {player.states.injury}/20</div>
          </div>
        </div>
      </div>
    </div>
  );
};
