import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game2048Engine, GameEvents } from '../core';

interface GameProps {
  onTileMerged?: (value: number, isSpeedBonus?: boolean) => void;
  onGameOver?: (finalScore: number, maxTile: number) => void;
}

const Game: React.FC<GameProps> = ({ onTileMerged, onGameOver }) => {
  const gameEngineRef = useRef<Game2048Engine>();
  
  // TEST: Aggiungi un log per verificare che il componente si renderizzi
  console.log('🎮 Game component rendering...');
  console.log('🎮 Props ricevute:', { onTileMerged: !!onTileMerged, onGameOver: !!onGameOver });
  
  // Inizializza il motore di gioco con gli eventi
  const initializeEngine = useCallback(() => {
    console.log('🎮 Inizializzazione motore di gioco...');
    const events: GameEvents = {
      onTileMerged,
      onGameOver,
    };
    gameEngineRef.current = new Game2048Engine(events, 4); // FORZA 4x4 all'inizio
    // Avvia il timer per il primo milestone
    gameEngineRef.current.startGameTimer();
    const initialGrid = gameEngineRef.current.initializeGrid();
    console.log(`🎮 Gioco inizializzato! Griglia: ${initialGrid.length}x${initialGrid.length}`);
    return initialGrid;
  }, [onTileMerged, onGameOver]);

  const [grid, setGrid] = useState(initializeEngine);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('2048-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speedMessage, setSpeedMessage] = useState(''); // Messaggio per bonus/penalità velocità
  const [gameTime, setGameTime] = useState(0); // Timer del gioco
  const [showingTower, setShowingTower] = useState(false); // Stato vista torre

  // TEST: Log dello stato della griglia
  console.log('🎮 Stato griglia:', grid);
  console.log('🎮 Dimensione griglia:', grid?.length);

  const handleMove = useCallback((direction: string) => {
    if (gameOver || gameWon || !gameEngineRef.current) return;

    try {
      const result = gameEngineRef.current.processMove(grid, direction, score);
      
      if (result.moved) {
        let finalGrid = result.newGrid;
        
        // Controlla se abbiamo raggiunto un milestone di espansione
        const maxTile = gameEngineRef.current!.getMaxTile(finalGrid);
        
        // SOLO per i milestone di espansione (64 e 256) controlla la velocità! 🚨
        if ([64, 256].includes(maxTile) && gameEngineRef.current) {
          const currentSize = gameEngineRef.current.getGridSize();
          
          // ESPANSIONE CONDIZIONALE: SOLO SE VELOCE! 🚨
          if ((maxTile === 64 && currentSize === 4) || 
              (maxTile === 256 && currentSize === 5)) {
            
            try {
              // Controlla se merita il bonus velocità
              console.log(`🔍 Controllo velocità per milestone ${maxTile}...`);
              const isSpeedBonus = gameEngineRef.current.checkSpeedBonus(maxTile);
              console.log(`⚡ Risultato controllo velocità: ${isSpeedBonus} per milestone ${maxTile}`);
              
              if (isSpeedBonus) {
                // BONUS VELOCITÀ: Espansione + Pulizia! ⚡
                console.log(`🔧 Inizio espansione griglia da ${gameEngineRef.current.getGridSize()}x${gameEngineRef.current.getGridSize()}`);
                
                try {
                  finalGrid = gameEngineRef.current.expandGrid(finalGrid);
                  console.log(`✅ Griglia espansa con successo! Nuova dimensione: ${gameEngineRef.current.getGridSize()}x${gameEngineRef.current.getGridSize()}`);
                  
                  finalGrid = gameEngineRef.current.cleanupLowTiles(finalGrid, maxTile === 64 ? 2 : 4);
                  console.log(`🧹 Pulizia completata!`);
                  
                  console.log(`⚡ BONUS VELOCITÀ! Griglia espansa a ${gameEngineRef.current.getGridSize()}x${gameEngineRef.current.getGridSize()} e pulita!`);
                  
                  // Messaggio di congratulazioni per la velocità! 🐰
                  setSpeedMessage(`🐰 Che lepre! meriti più spazio! ⚡✨`);
                  setTimeout(() => setSpeedMessage(''), 5000);
                } catch (error) {
                  console.error(`🚨 ERRORE durante espansione/pulizia:`, error);
                  setSpeedMessage(`🚨 ERRORE ESPANSIONE! Il gioco si è bloccato!`);
                  setTimeout(() => setSpeedMessage(''), 10000);
                  return; // Non continuare se c'è un errore
                }
                
                // AGGIUNGI MILESTONE ALLA TORRE CON AURA DORATA (veloce)! 🏰⚡
                if ((window as any).addMilestone) {
                  (window as any).addMilestone(maxTile, true); // true = speedBonus (aura dorata)
                }
                
                // RIMUOVI il timer del milestone precedente DOPO aver controllato la velocità
                const previousMilestone = maxTile === 64 ? 32 : 128;
                if (gameEngineRef.current && (gameEngineRef.current as any).milestoneStartTimes) {
                  (gameEngineRef.current as any).milestoneStartTimes.delete(previousMilestone);
                  console.log(`🗑️ Timer del milestone ${previousMilestone} rimosso dopo controllo velocità (veloce)`);
                }
              } else {
                // PENALITÀ VELOCITÀ: NO ESPANSIONE E NO TORRE! 🐢
                console.log(`🐢 PENALITÀ VELOCITÀ! Troppo lento per espandere la griglia!`);
                
                // Aggiungi più tile casuali per rendere il gioco più difficile
                const penaltyTiles = maxTile === 64 ? 4 : 6; // Ancora più tile per chi va lento
                for (let i = 0; i < penaltyTiles; i++) {
                  finalGrid = gameEngineRef.current.addRandomNumber(finalGrid);
                }
                console.log(`🚨 PENALITÀ VELOCITÀ! Aggiunte ${penaltyTiles} tile casuali per chi va lento!`);
                
                // Messaggio divertente per giocatori lenti
                setSpeedMessage(`🐢 Quante tartarughe vedo... lo spazio così non si espande! 🐢`);
                setTimeout(() => setSpeedMessage(''), 5000);
                
                // AGGIUNGI MILESTONE ALLA TORRE SENZA AURA DORATA (lento)! 🏰🐢
                if ((window as any).addMilestone) {
                  (window as any).addMilestone(maxTile, false); // false = NO speedBonus (NO aura dorata)
                  console.log(`🏰 Milestone ${maxTile} aggiunto alla torre SENZA aura dorata (giocatore lento)`);
                }
              }
              
              // RIMUOVI il timer del milestone precedente DOPO aver controllato la velocità
              const previousMilestone = maxTile === 64 ? 32 : 128;
              if (gameEngineRef.current && (gameEngineRef.current as any).milestoneStartTimes) {
                (gameEngineRef.current as any).milestoneStartTimes.delete(previousMilestone);
                console.log(`🗑️ Timer del milestone ${previousMilestone} rimosso dopo controllo velocità`);
              }
            } catch (error) {
              console.error(`🚨 ERRORE durante l'espansione/pulizia:`, error);
              setSpeedMessage(`🚨 ERRORE! Il gioco si è bloccato! Ricarica la pagina!`);
              setTimeout(() => setSpeedMessage(''), 10000);
            }
          }
        }
        
        console.log(`🎮 Risultato mossa: moved=${result.moved}, gameOver=${result.gameOver}, gameWon=${result.gameWon}, score=${result.newScore}`);
        console.log(`📏 Dimensione griglia finale: ${finalGrid.length}x${finalGrid.length}`);
        
        setGrid(finalGrid);
        setScore(result.newScore);
        setGameWon(result.gameWon);
        setGameOver(result.gameOver);
        
        // Debug: mostra stato del gioco
        if (result.gameOver) {
          console.log(`🚨 GAME OVER RILEVATO! Punteggio: ${result.newScore}`);
        }
        
        // Aggiorna il record se necessario
        if (result.newScore > highScore) {
          setHighScore(result.newScore);
          localStorage.setItem('2048-highscore', result.newScore.toString());
        }
      }
    } catch (error) {
      console.error(`🚨 ERRORE CRITICO durante la mossa:`, error);
      setSpeedMessage(`🚨 ERRORE CRITICO! Il gioco si è bloccato! Ricarica la pagina!`);
      setTimeout(() => setSpeedMessage(''), 10000);
      setGameOver(true); // Forza game over se c'è un errore critico
    }
  }, [grid, gameOver, gameWon, score, highScore]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
        handleMove(event.code);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleMove]);

  // Ascolta i cambiamenti della vista torre
  useEffect(() => {
    if ((window as any).setTowerView) {
      // Sostituisci la funzione globale con la nostra
      const originalSetTowerView = (window as any).setTowerView;
      (window as any).setTowerView = (show: boolean) => {
        setShowingTower(show);
        originalSetTowerView(show);
      };
    }
  }, []);

  // Mostra automaticamente la torre quando si vince
  useEffect(() => {
    if (gameWon && (window as any).setTowerView) {
      // Aspetta un momento per mostrare il messaggio di vittoria, poi mostra la torre
      const timer = setTimeout(() => {
        (window as any).setTowerView(true);
      }, 2000); // 2 secondi di delay per leggere il messaggio
      
      return () => clearTimeout(timer);
    }
  }, [gameWon]);

  const resetGame = () => {
    // Resetta il motore a griglia 4x4 FORZATA
    const events: GameEvents = {
      onTileMerged,
      onGameOver,
    };
    gameEngineRef.current = new Game2048Engine(events, 4); // FORZA 4x4
    // Reset dei timer per il bonus velocità
    gameEngineRef.current.resetSpeedTimers();
    // Avvia il timer per il primo milestone
    gameEngineRef.current.startGameTimer();
    const newGrid = gameEngineRef.current.initializeGrid();
    setGrid(newGrid);
    setScore(0);
    setGameWon(false);
    setGameOver(false);
    setSpeedMessage(''); // Reset del messaggio di velocità
    
    console.log(`🔄 Gioco resettato! Griglia: ${newGrid.length}x${newGrid.length}`);
    
    // Reset della torre! 🏰
    if ((window as any).resetTower) {
      (window as any).resetTower();
    }
  };

  // Funzione per ottenere i colori basati sul valore
  const getTileStyle = (value: number) => {
    const styles: Record<number, string> = {
      0: 'bg-transparent text-transparent border-2 border-orange-300/50',
      2: 'bg-gradient-to-br from-yellow-200 to-yellow-100 text-orange-800',
      4: 'bg-gradient-to-br from-yellow-300 to-yellow-200 text-orange-900',
      8: 'bg-gradient-to-br from-orange-300 to-orange-200 text-red-900',
      16: 'bg-gradient-to-br from-orange-400 to-orange-300 text-red-900',
      32: 'bg-gradient-to-br from-red-300 to-orange-400 text-white',
      64: 'bg-gradient-to-br from-red-400 to-red-300 text-white',
      128: 'bg-gradient-to-br from-red-500 to-red-400 text-white shadow-lg',
      256: 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg',
      512: 'bg-gradient-to-br from-red-700 to-red-600 text-white shadow-xl',
      1024: 'bg-gradient-to-br from-red-800 to-red-700 text-yellow-200 shadow-xl',
      2048: 'bg-gradient-to-br from-yellow-400 via-red-500 to-red-800 text-white shadow-2xl animate-pulse'
    };
    return styles[value] || 'bg-gradient-to-br from-red-900 to-red-800 text-yellow-200 shadow-2xl';
  };

  const getFontSize = (value: number) => {
    if (value >= 1024) return 'text-xl';
    if (value >= 128) return 'text-2xl';
    if (value >= 16) return 'text-3xl';
    return 'text-4xl';
  };

  return (
    <div className="relative z-20 w-screen h-screen flex items-center justify-center p-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
            2048-TOWER
          </h1>
          <p className="text-lg text-gray-600 mb-4">by Francesco Marinuzzi, Ph.D.</p>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-3">
              <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-4 py-3 rounded-xl shadow-lg">
                <div className="text-xs font-medium">PUNTEGGIO</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-3 rounded-xl shadow-lg">
                <div className="text-xs font-medium">RECORD</div>
                <div className="text-xl font-bold">{highScore}</div>
              </div>
            </div>
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-bold"
            >
              NUOVO GIOCO
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 rounded-2xl mb-6">
          <div 
            className="grid gap-2 transition-all duration-300"
            style={{ 
              gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
              width: '100%',
              height: 'auto',
              aspectRatio: '1'
            }}
          >
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    aspect-square rounded-xl flex items-center justify-center font-bold transition-all duration-200 transform hover:scale-105
                    ${getTileStyle(cell)}
                    ${getFontSize(cell)}
                  `}
                  style={{
                    fontSize: grid.length > 4 ? '0.75rem' : '1rem' // Font più piccolo per griglie grandi
                  }}
                >
                  {cell !== 0 && cell}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timer e Controlli */}
        <div className="text-center text-gray-600 mb-4">
          {/* Timer del gioco */}
          <div className="mb-3">
            <div className="text-lg font-bold text-orange-600">
              ⏱️ Tempo di gioco: {Math.floor((Date.now() - (gameEngineRef.current?.milestoneStartTimes?.get(0) || Date.now())) / 1000)}s
            </div>
          </div>
          
          <p className="text-sm mb-2">Usa le frecce della tastiera per muovere le tessere</p>
        
          {/* Messaggio di velocità (bonus o penalità) */}
          {speedMessage && (
            <div className={`text-sm font-bold mb-2 p-2 rounded-lg ${
              speedMessage.includes('Che lepre') 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {speedMessage}
            </div>
          )}
          
          {/* Controlli direzionali */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className="grid grid-cols-3 gap-1 w-32">
              <div></div>
              <button
                onClick={() => handleMove('ArrowUp')}
                className="bg-gradient-to-r from-orange-200 to-yellow-200 hover:from-orange-300 hover:to-yellow-300 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                ↑
              </button>
              <div></div>
              <button
                onClick={() => handleMove('ArrowLeft')}
                className="bg-gradient-to-r from-orange-200 to-yellow-200 hover:from-orange-300 hover:to-yellow-300 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                ←
              </button>
              <div></div>
              <button
                onClick={() => handleMove('ArrowRight')}
                className="bg-gradient-to-r from-orange-200 to-yellow-200 hover:from-orange-300 hover:to-yellow-300 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                →
              </button>
              <div></div>
              <button
                onClick={() => handleMove('ArrowDown')}
                className="bg-gradient-to-r from-orange-200 to-yellow-200 hover:from-orange-300 hover:to-yellow-300 p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
          
          {/* Pulsanti Torre */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                if ((window as any).setTowerView) {
                  (window as any).setTowerView(!showingTower);
                }
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 font-bold"
            >
              {showingTower ? '🎮 Torna al Gioco' : '🏰 Vedi Torre'}
            </button>
            <button
              onClick={() => {
                if ((window as any).shareTower) {
                  (window as any).shareTower();
                }
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 border-2 border-yellow-500 px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 font-bold"
            >
              📤 Share Torre
            </button>
          </div>
        </div>

        {/* Game Over/Win Overlay */}
        {(gameOver || gameWon) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <h2 className={`text-4xl font-bold mb-4 ${gameWon ? 'text-yellow-500' : 'text-red-500'}`}>
                {gameWon ? 'HAI VINTO! 🎉' : 'GAME OVER! 😔'}
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Punteggio finale: <span className="font-bold text-orange-600">{score}</span>
              </p>
              
              {gameWon && (
                <div className="mb-6">
                  <p className="text-lg text-purple-600 font-bold mb-4">
                    🏰 La tua torre è completa! Guardala nella sua bellezza! ✨
                  </p>
                  <button
                    onClick={() => {
                      if ((window as any).setTowerView) {
                        (window as any).setTowerView(true);
                      }
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-bold text-lg mb-3 w-full"
                  >
                    🏰 Vedi la Tua Torre
                  </button>
                </div>
              )}
              
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-bold text-lg"
              >
                RIPROVA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
