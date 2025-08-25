import React, { useRef, useState, useEffect } from 'react';
import { TowerApp } from '../tower';
import Game from './Game';

const App: React.FC = () => {
  const towerRef = useRef<any>(null);
  const [showingTower, setShowingTower] = useState(false);

  // Handler per quando una tile viene fusa
  const handleTileMerged = (value: number, isSpeedBonus?: boolean) => {
    console.log(`🔔 handleTileMerged chiamato con valore: ${value}, speedBonus: ${isSpeedBonus}`);
    console.log(`🔍 Controllo disponibilità addMilestone:`, (window as any).addMilestone ? 'DISPONIBILE' : 'NON DISPONIBILE');
    
    // Aggiungi milestone alla torre SOLO se è >= 32 (milestone tiles)
    if (value >= 32 && (window as any).addMilestone) {
      // Per i milestone 64 e 256, NON fare nulla qui - gestiti dal gioco principale
      if ([64, 256].includes(value)) {
        console.log(`🚫 Milestone ${value} (64/256) gestito dal gioco principale, non qui`);
        return; // NON fare nulla
      } else {
        // Per tutti gli altri milestone, aggiungi normalmente
        console.log(`🏰 Aggiungo milestone ${value} alla torre (gestito da App.tsx)`);
        try {
          (window as any).addMilestone(value, isSpeedBonus);
          console.log(`✅ Milestone ${value} aggiunto con successo alla torre!`);
        } catch (error) {
          console.error(`❌ ERRORE durante l'aggiunta del milestone ${value}:`, error);
        }
      }
    } else if (value < 32) {
      // Per le tile di valore basso (< 32), non fare nulla - sono normali merge
      console.log(`ℹ️ Tile ${value} (valore basso) - non è un milestone, ignoro`);
    } else {
      // Per milestone >= 32 ma senza addMilestone disponibile
      console.log(`❌ Milestone ${value} NON aggiunto: addMilestone non disponibile`);
      console.log(`🔍 Stato window.addMilestone:`, (window as any).addMilestone);
    }
  };

  // Handler per game over
  const handleGameOver = (finalScore: number, maxTile: number) => {
    console.log(`Game Over! Score: ${finalScore}, Max Tile: ${maxTile}`);
  };

  // Esponi globalmente la funzione per controllare la vista torre
  useEffect(() => {
    (window as any).setTowerView = setShowingTower;
    return () => {
      delete (window as any).setTowerView;
    };
  }, []);

  // TEST: Aggiungi un log per verificare che il componente si renderizzi
  console.log('🚀 App component rendering...');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Tower layer - sempre presente */}
      <TowerApp 
        onTileMerged={handleTileMerged}
        onGameOver={handleGameOver}
      />
      
      {/* Game layer - nascosto quando si mostra la torre */}
      <div className={`transition-opacity duration-500 ${showingTower ? 'opacity-0' : 'opacity-100'}`}>
        <Game 
          onTileMerged={handleTileMerged}
          onGameOver={handleGameOver}
        />
      </div>
      
      {/* Pulsante "Torna al Gioco" sempre visibile quando si è nella vista torre */}
      {showingTower && (
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => setShowingTower(false)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg shadow-lg font-bold transition-all duration-200 transform hover:scale-105"
          >
            🎮 Torna al Gioco
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
