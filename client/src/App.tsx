import React from 'react';
import { useGameStore } from './stores/gameStore';
import { SetupPanel } from './components/Setup/SetupPanel';
import { GamePanel } from './components/Game/GamePanel';
import { Loading } from './components/UI/Loading';
import { ErrorMessage } from './components/UI/ErrorMessage';

function App() {
  const { gameState, isLoading, error, setError } = useGameStore();

  return (
    <div className="min-h-screen bg-game-bg">
      <header className="text-center py-10 border-b border-game-border mb-8">
        <h1 className="text-4xl font-serif tracking-widest text-game-accent mb-2">
          72Hours
        </h1>
        <p className="text-game-muted">
          金田起义前夜 · 一个读书人的72小时
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-10">
        {isLoading && <Loading />}
        
        {error && (
          <ErrorMessage 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}

        {!gameState ? (
          <SetupPanel />
        ) : (
          <GamePanel />
        )}
      </main>
    </div>
  );
}

export default App;
