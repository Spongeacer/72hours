import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ScriptPanel } from './ScriptPanel';
import { TurnInfoPanel } from './TurnInfoPanel';
import { NarrativePanel } from './NarrativePanel';
import { LogPanel } from './LogPanel';
import { SaveMenu } from './SaveMenu';

export const GamePanel: React.FC = () => {
  const { 
    gameState, 
    player, 
    npcs, 
    currentNarrative, 
    currentChoices,
    currentResult,
    makeChoice
  } = useGameStore();

  const [showSaveMenu, setShowSaveMenu] = React.useState(false);

  if (!gameState || !player) return null;

  return (
    <div className="h-[calc(100vh-120px)] grid grid-cols-[70%_30%] grid-rows-[20%_80%] gap-4">
      {/* 左上：剧本信息 */}
      <ScriptPanel />

      {/* 左下：剧情和选择 */}
      <NarrativePanel 
        narrative={currentNarrative}
        choices={currentChoices}
        onSelect={makeChoice}
        result={currentResult}
      />

      {/* 右上：回合信息 */}
      <TurnInfoPanel 
        gameState={gameState}
        player={player}
        _npcs={npcs}
      />

      {/* 右下：叙事日志 */}
      <LogPanel 
        narrative={currentNarrative}
        _choices={currentChoices}
      />

      {/* 存档菜单 */}
      {showSaveMenu && (
        <SaveMenu 
          onClose={() => setShowSaveMenu(false)}
        />
      )}
    </div>
  );
};
