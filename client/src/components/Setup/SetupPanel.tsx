import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { api } from '../../services/api';
import { GameConfig, IdentityInfo, ModelInfo } from '../../types';

export const SetupPanel: React.FC = () => {
  const { initGame, isLoading } = useGameStore();
  
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [identity, setIdentity] = useState('scholar');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // 加载配置
  useEffect(() => {
    api.getConfig().then(response => {
      if (response.success && response.data) {
        setConfig(response.data);
        setModel(response.data.defaultModel);
      }
    });
  }, []);

  const handleStart = () => {
    initGame(identity, model, apiKey || undefined);
  };

  if (!config) {
    return (
      <div className="game-panel text-center py-12">
        <p className="text-game-muted">加载配置中...</p>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <h2 className="text-2xl font-serif text-game-accent mb-8 text-center">
        选择你的身份
      </h2>

      {/* 身份选择 */}
      <div className="mb-8">
        <label className="block text-game-muted mb-3">身份</label>
        <select
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          className="game-select"
        >
          {config.availableIdentities.map((id: IdentityInfo) => (
            <option key={id.id} value={id.id}>
              {id.name} - {id.description}
            </option>
          ))}
        </select>
      </div>

      {/* AI模型选择 */}
      <div className="mb-8">
        <label className="block text-game-muted mb-3">AI 模型</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="game-select"
        >
          {config.availableModels.map((m: ModelInfo) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.description})
              {m.recommended && ' ⭐'}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      {!config.hasApiKey && (
        <div className="mb-8">
          <label className="block text-game-muted mb-3">
            API Key <span className="text-game-error">*</span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的 SiliconFlow API Key"
              className="game-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-game-muted hover:text-game-accent"
            >
              {showApiKey ? '隐藏' : '显示'}
            </button>
          </div>
          <p className="text-game-dim text-sm mt-2">
            密钥仅保存在本地，不会发送到服务器
          </p>
        </div>
      )}

      {/* 开始按钮 */}
      <button
        onClick={handleStart}
        disabled={isLoading || (!config.hasApiKey && !apiKey)}
        className="game-btn w-full"
      >
        {isLoading ? '正在初始化...' : '开始游戏'}
      </button>

      <div className="mt-8 text-game-dim text-sm">
        <p>游戏设定：1851年1月8日，金田村</p>
        <p>你有72小时，72回合。历史即将开始。</p>
      </div>
    </div>
  );
};
