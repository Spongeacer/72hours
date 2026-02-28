import React from 'react';
import { getCurrentScript } from '../../../../src/config/ScriptConfig';

export const ScriptPanel: React.FC = () => {
  const script = getCurrentScript();
  
  return (
    <div className="game-panel h-full overflow-hidden">
      <div className="module-title">🎭 剧本信息</div>
      <div className="p-3 text-sm overflow-y-auto h-[calc(100%-40px)]">
        <p className="font-bold text-game-accent mb-2">{script.name}</p>
        <p className="text-game-muted text-xs mb-3">{script.description}</p>
        
        <div className="mb-2">
          <span className="text-game-dim text-xs">地点：</span>
          <span className="text-game-accent ml-1">{script.location}</span>
        </div>
        
        <div className="mb-2">
          <span className="text-game-dim text-xs">时间：</span>
          <span className="text-game-accent ml-1">{script.year}年</span>
        </div>

        <div className="mt-3">
          <p className="text-game-dim text-xs mb-1">关键人物：</p>
          <div className="flex flex-wrap gap-1">
            {script.historicalFigures.slice(0, 4).map((figure, idx) => (
              <span key={idx} className="text-xs bg-game-border px-2 py-0.5 rounded">
                {figure}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
