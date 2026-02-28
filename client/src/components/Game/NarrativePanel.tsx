import React from 'react';
import { Choice } from '../../../../shared/types';

interface NarrativePanelProps {
  narrative: string | null;
  choices: Choice[];
  onSelect: (choice?: Choice) => Promise<void>;
  result: any;
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({ 
  narrative, 
  choices,
  onSelect,
  result 
}) => {
  return (
    <div className="game-panel h-full overflow-hidden flex flex-col">
      <div className="module-title">📖 当前剧情</div>
      <div className="flex-1 p-4 overflow-y-auto">
        {narrative ? (
          <div className="space-y-4">
            <div className="narrative-text">
              {narrative.split('\n').map((line, idx) => (
                <p key={idx} className="mb-2 text-game-text leading-relaxed">{line}</p>
              ))}
            </div>
            
            {result && (
              <div className="mt-4 p-3 bg-game-border/30 rounded border-l-4 border-game-accent">
                <p className="text-game-accent text-sm">{result}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-game-muted">
            正在加载叙事...
          </div>
        )}
      </div>
      
      {/* 选择区域 */}
      {choices.length > 0 && (
        <div className="p-4 border-t border-game-border max-h-[40%] overflow-y-auto">
          <p className="text-game-dim text-sm mb-3">选择你的行动：</p>
          <div className="space-y-2">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onSelect(choice)}
                className="choice-btn w-full text-left"
              >
                <span className="text-game-accent mr-2">▸</span>
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
