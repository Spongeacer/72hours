import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-game-muted border-t-game-accent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-game-accent font-serif">正在生成叙事...</p>
      </div>
    </div>
  );
};
