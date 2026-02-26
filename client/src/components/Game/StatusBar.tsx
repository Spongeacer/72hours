import React from 'react';
import { GameState, Player, NPC } from '../../types';

interface StatusBarProps {
  gameState: GameState;
  player: Player;
  npcs: NPC[];
}

export const StatusBar: React.FC<StatusBarProps> = ({ gameState, player, npcs }) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    return `${day}日 ${hours}:${minutes}`;
  };

  const getWeatherIcon = (weather: string) => {
    const icons: Record<string, string> = {
      clear: '☀️',
      rain: '🌧️',
      fog: '🌫️',
      night: '🌙'
    };
    return icons[weather] || '☀️';
  };

  const getWeatherName = (weather: string) => {
    const names: Record<string, string> = {
      clear: '晴朗',
      rain: '下雨',
      fog: '起雾',
      night: '夜晚'
    };
    return names[weather] || weather;
  };

  return (
    <div className="status-bar">
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <span className="text-game-muted">回合: </span>
          <span className="text-game-accent">{gameState.turn}/72</span>
        </div>
        
        <div>
          <span className="text-game-muted">时间: </span>
          <span>{formatTime(gameState.datetime)}</span>
        </div>
        
        <div>
          <span className="text-game-muted">天气: </span>
          <span>{getWeatherIcon(gameState.weather)} {getWeatherName(gameState.weather)}</span>
        </div>
        
        <div>
          <span className="text-game-muted">压强: </span>
          <span className={gameState.pressure > 50 ? 'text-game-error' : 'text-game-accent'}>
            {gameState.pressure.toFixed(1)}
          </span>
        </div>
        
        <div>
          <span className="text-game-muted">Ω: </span>
          <span>{gameState.omega.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-game-border">
        <div className="flex items-center gap-4">
          <span className="text-game-muted">身份:</span>
          <span>{player.identity.name}</span>
          
          {player.traits.length > 0 && (
            <>
              <span className="text-game-muted">特质:</span>
              <span className="text-game-dim">
                {player.traits
                  .filter(t => t.type === 'personality')
                  .map(t => t.name || t.id)
                  .join(' · ')}
              </span>
            </>
          )}
        </div>

        {npcs.length > 0 && (
          <div className="mt-2 flex items-center gap-4">
            <span className="text-game-muted">关联NPC:</span>
            <div className="flex gap-2">
              {npcs.map(npc => (
                <span 
                  key={npc.id}
                  className="px-2 py-1 bg-game-bg text-sm"
                >
                  {npc.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
