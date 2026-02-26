import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { SaveData } from '../../types';

interface SaveMenuProps {
  onClose: () => void;
}

export const SaveMenu: React.FC<SaveMenuProps> = ({ onClose }) => {
  const {
    gameState,
    saves,
    loadSaves,
    createSave,
    loadSave
  } = useGameStore();
  
  const [saveName, setSaveName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSaves();
  }, [loadSaves]);

  const handleCreateSave = async () => {
    setIsCreating(true);
    await createSave(saveName || undefined);
    setSaveName('');
    setIsCreating(false);
  };

  const handleLoadSave = async (saveId: string) => {
    await loadSave(saveId);
    onClose();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-game-panel border border-game-border w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-game-border flex justify-between items-center">
          <h3 className="text-xl font-serif text-game-accent">存档管理</h3>
          <button 
            onClick={onClose}
            className="text-game-muted hover:text-game-accent"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* 创建存档 */}
          <div className="mb-8">
            <h4 className="text-game-muted mb-3">创建新存档</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="存档名称（可选）"
                className="game-input flex-1"
              />
              <button
                onClick={handleCreateSave}
                disabled={isCreating}
                className="game-btn"
              >
                {isCreating ? '保存中...' : '保存'}
              </button>
            </div>
            
            {gameState && (
              <p className="text-game-dim text-sm mt-2">
                当前进度: 第 {gameState.turn} 回合 | 压强 {gameState.pressure.toFixed(1)}
              </p>
            )}
          </div>

          {/* 存档列表 */}
          <div>
            <h4 className="text-game-muted mb-3">已有存档</h4>
            
            {saves.length === 0 ? (
              <p className="text-game-dim">暂无存档</p>
            ) : (
              <div className="space-y-2">
                {saves.map((save: SaveData) => (
                  <div 
                    key={save.id}
                    className="flex items-center justify-between p-4 bg-game-bg border border-game-border"
                  >
                    <div>
                      <p className="font-serif">{save.name || `存档 ${save.id.slice(0, 8)}`}</p>
                      <p className="text-game-dim text-sm">
                        第 {save.turn} 回合 | {formatTime(save.timestamp)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleLoadSave(save.id)}
                      className="game-btn text-sm px-4 py-2"
                    >
                      读取
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
