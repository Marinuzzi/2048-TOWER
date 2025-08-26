import React, { useRef, useState, useEffect } from 'react';
import { TowerApp } from '../tower';
import Game from './Game';

const App: React.FC = () => {
  const towerRef = useRef<any>(null);
  const [showingTower, setShowingTower] = useState(false);

  // Handler per quando una tile viene fusa
  const handleTileMerged = (value: number, isSpeedBonus?: boolean) => {
    // Aggiungi milestone alla torre SOLO se è >= 32 (milestone tiles)
    if (value >= 32 && (window as any).addMilestone) {
      // Per i milestone 64 e 256, NON fare nulla qui - gestiti dal gioco principale
      if ([64, 256].includes(value)) {
        return; // NON fare nulla
      } else {
        // Per tutti gli altri milestone, aggiungi normalmente
        try {
          (window as any).addMilestone(value, isSpeedBonus);
        } catch (error) {
          console.error(`❌ ERRORE durante l'aggiunta del milestone ${value}:`, error);
        }
      }
    }
  };

  // Handler per game over
  const handleGameOver = (finalScore: number, maxTile: number) => {
    // Game over gestito silenziosamente
  };

  // Esponi globalmente la funzione per controllare la vista torre
  useEffect(() => {
    // Aspetta che TowerApp sia pronto prima di esporre la funzione
    const timer = setTimeout(() => {
      (window as any).setTowerView = setShowingTower;
      console.log('setTowerView esposto globalmente');
    }, 100);
    
    return () => {
      clearTimeout(timer);
      delete (window as any).setTowerView;
    };
  }, []);



  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Tower layer - sempre presente */}
      <TowerApp 
        onTileMerged={handleTileMerged}
        onGameOver={handleGameOver}
        showTowerView={showingTower}
      />
      
      {/* Game layer - trasparente quando si mostra la torre */}
      <div className={`transition-all duration-500 ${showingTower ? 'opacity-20 z-5' : 'opacity-100 z-20'}`}>
        <div className={`transition-all duration-500 ${showingTower ? 'bg-transparent' : 'bg-white/90'}`}>
          <Game 
            onTileMerged={handleTileMerged}
            onGameOver={handleGameOver}
          />
        </div>
      </div>
      
      {/* Pulsante "Torna al Gioco" sempre visibile quando si è nella vista torre */}
      {showingTower && (
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => setShowingTower(false)}
            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-4 rounded-lg shadow-lg font-bold transition-all duration-200 transform hover:scale-105 border border-gray-300"
            style={{ aspectRatio: '1' }}
          >
            🎮
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
