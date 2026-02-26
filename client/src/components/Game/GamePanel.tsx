import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { StatusBar } from './StatusBar';
import { NarrativePanel } from './NarrativePanel';
import { ChoicePanel } from './ChoicePanel';
import { SaveMenu } from './SaveMenu';

export const GamePanel: React.FC = () => {
  const { 
    gameState, 
    player, 
    npcs, 
    currentNarrative, 
    currentChoices,
    currentResult,
    makeChoice,
    reset
  } = useGameStore();

  const [showSaveMenu, setShowSaveMenu] = React.useState(false);

  if (!gameState || !player) return null;

  return (
    <div className="space-y-6">
      {/* 状态栏 */}
      <StatusBar 
        gameState={gameState}
        player={player}
        npcs={npcs}
      />

      {/* 叙事面板 */}
      <NarrativePanel 
        narrative={currentNarrative}
        result={currentResult}
      />

      {/* 选择面板 */}
      {currentChoices.length > 0 && (
        <ChoicePanel 
          choices={currentChoices}
          onSelect={makeChoice}
        />
      )}

      {/* 游戏结束 */}
      {gameState.isGameOver && (
        <div className="game-panel text-center">
          <h3 className="text-2xl font-serif text-game-accent mb-4">
            游戏结束
          </h3>
          <button 
            onClick={reset}
            className="game-btn"
          >
            重新开始
          </button>
        </div>
      )}

      {/* 操作按钮 */}
      {!gameState.isGameOver && (
        <div className="flex gap-4">
          <button
            onClick={() => setShowSaveMenu(true)}
            className="game-btn flex-1"
          >
            存档 / 读档
          </button>
          
          <button
            onClick={reset}
            className="game-btn flex-1 bg-game-border"
          >
            退出游戏
          </button>
        </div>
      )}

      {/* 存档菜单 */}
      {showSaveMenu && (
        <SaveMenu 
          onClose={() => setShowSaveMenu(false)}
        />
      )}
    </div>
  );
};
