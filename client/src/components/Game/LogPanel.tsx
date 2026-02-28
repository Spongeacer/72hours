import React from 'react';
import { Choice } from '../../../../shared/types';

interface LogPanelProps {
  narrative: string | null;
  _choices: Choice[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ narrative }) => {
  // 简单的日志记录（实际应该从 store 获取历史）
  const [logs, setLogs] = React.useState<Array<{ type: string; content: string }>>([]);
  
  React.useEffect(() => {
    if (narrative) {
      setLogs(prev => [...prev, { type: 'narrative', content: narrative.substring(0, 100) + '...' }]);
    }
  }, [narrative]);

  return (
    <div className="game-panel h-full overflow-hidden flex flex-col">
      <div className="module-title">📜 叙事日志</div>
      <div className="flex-1 p-3 overflow-y-auto log-content">
        {logs.length === 0 ? (
          <div className="text-game-muted text-sm text-center mt-10">
            游戏开始，故事即将展开...
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, idx) => (
              <div 
                key={idx} 
                className={`log-entry ${log.type === 'narrative' ? 'turn-start' : 'choice-made'}`}
              >
                <div className="log-turn">{log.type === 'narrative' ? `第 ${idx + 1} 回合` : '选择'}</div>
                <div className="log-text text-sm">{log.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
