import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game2048Engine, GameEvents } from '../core';

interface GameProps {
  onTileMerged?: (value: number, isSpeedBonus?: boolean) => void;
  onGameOver?: (finalScore: number, maxTile: number) => void;
}

const Game: React.FC<GameProps> = ({ onTileMerged, onGameOver }) => {
  const gameEngineRef = useRef<Game2048Engine>();
  

  
  // Inizializza il motore di gioco con gli eventi
  const initializeEngine = useCallback(() => {
    const events: GameEvents = {
      onTileMerged,
      onGameOver,
    };
    gameEngineRef.current = new Game2048Engine(events, 4); // FORZA 4x4 all'inizio
    // Avvia il timer per il primo milestone
    gameEngineRef.current.startGameTimer();
    const initialGrid = gameEngineRef.current.initializeGrid();
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
  const [lastMilestoneTime, setLastMilestoneTime] = useState(0); // Tempo dall'ultimo milestone
  const [lastMilestoneReached, setLastMilestoneReached] = useState(0); // Timestamp dell'ultimo milestone raggiunto

  
  // Sistema anti-spam per prevenire l'hacking
  const [moveTimestamps, setMoveTimestamps] = useState<number[]>([]); // Timestamp delle ultime mosse
  const [spamWarning, setSpamWarning] = useState(''); // Messaggio di avvertimento spam



  // Funzione per controllare lo spam delle frecce
  const checkSpam = useCallback((direction: string): boolean => {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Aggiungi il timestamp della mossa corrente
    const newTimestamps = [...moveTimestamps, now];
    
    // Mantieni solo i timestamp dell'ultimo secondo
    const recentMoves = newTimestamps.filter(timestamp => timestamp > oneSecondAgo);
    
    // Aggiorna lo state
    setMoveTimestamps(recentMoves);
    
    const movesPerSecond = recentMoves.length;
    
    // Se da 6 a 14 mosse/secondo, penalizza (spam)
    if (movesPerSecond >= 6 && movesPerSecond <= 14) {
      setSpamWarning(`🚨 Spam detected! ${movesPerSecond} moves/second - Penalty applied!`);
      setTimeout(() => setSpamWarning(''), 3000);
      return true; // Penalità applicata
    }
    
    // Se più di 14 mosse/secondo, giocatore esperto - nessuna penalità
    if (movesPerSecond > 14) {
      setSpamWarning('⚡'); // Solo icona fulmine
      setTimeout(() => setSpamWarning(''), 1500);
      return false; // Nessuna penalità
    }
    
    // Reset del messaggio se tutto ok
    if (spamWarning) setSpamWarning('');
    return false; // Nessuna penalità
  }, [moveTimestamps, spamWarning]);

  const handleMove = useCallback((direction: string) => {
    if (gameOver || gameWon || !gameEngineRef.current) return;

    // Controlla lo spam prima di processare la mossa
    const isSpamPenalty = checkSpam(direction);

    try {
      const result = gameEngineRef.current.processMove(grid, direction, score);
      
      if (result.moved) {
        let finalGrid = result.newGrid;
        
        // Controlla se abbiamo raggiunto un milestone di espansione
        const maxTile = gameEngineRef.current!.getMaxTile(finalGrid);
        
        // Traccia quando viene raggiunto un nuovo milestone per il timer
        if (maxTile >= 32 && maxTile > gameEngineRef.current!.getMaxTile(grid)) {
          setLastMilestoneReached(Date.now());
          setLastMilestoneTime(0); // Reset del timer milestone quando si raggiunge un nuovo milestone
        }
        
        // SOLO per i milestone di espansione (64 e 256) controlla la velocità! 🚨
        if ([64, 256].includes(maxTile) && gameEngineRef.current) {
          const currentSize = gameEngineRef.current.getGridSize();
          
          // ESPANSIONE CONDIZIONALE: SOLO SE VELOCE! 🚨
          if ((maxTile === 64 && currentSize === 4) || 
              (maxTile === 256 && currentSize === 5)) {
            
                          try {
                // Controlla se merita il bonus velocità
                const isSpeedBonus = gameEngineRef.current.checkSpeedBonus(maxTile);
                
                if (isSpeedBonus) {
                  // BONUS VELOCITÀ: Espansione + Pulizia! ⚡
                  try {
                    finalGrid = gameEngineRef.current.expandGrid(finalGrid);
                    finalGrid = gameEngineRef.current.cleanupLowTiles(finalGrid, maxTile === 64 ? 2 : 4);
                    
                    // Messaggio di congratulazioni per la velocità! 🐰
                    // SOLO per milestone di espansione (64 e 256)
                    if ([64, 256].includes(maxTile)) {
                      setSpeedMessage(`🌙🌀🗿 Nuar a rí-han na skà-hna, lah-nee-un an clawr fayn. ⚡✨`);
                      setTimeout(() => setSpeedMessage(''), 5000);
                    }
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
                  }
                } else {
                  // PENALITÀ VELOCITÀ: NO ESPANSIONE E NO TORRE! 🐢
                  // Aggiungi più tile casuali per rendere il gioco più difficile
                  const penaltyTiles = maxTile === 64 ? 4 : 6; // Ancora più tile per chi va lento
                  for (let i = 0; i < penaltyTiles; i++) {
                    finalGrid = gameEngineRef.current.addRandomNumber(finalGrid);
                  }
                  
                  // Messaggio divertente per giocatori lenti
                  // SOLO per milestone di espansione (64 e 256)
                  if ([64, 256].includes(maxTile)) {
                    setSpeedMessage(`🌴☀️🌊 Dan lan-druà seré, i trov letán san-fèn 🐢`);
                    setTimeout(() => setSpeedMessage(''), 5000);
                  }
                  
                  // AGGIUNGI MILESTONE ALLA TORRE SENZA AURA DORATA (lento)! 🏰🐢
                  if ((window as any).addMilestone) {
                    (window as any).addMilestone(maxTile, false); // false = NO speedBonus (NO aura dorata)
                  }
                }
                
                // RIMUOVI il timer del milestone precedente DOPO aver controllato la velocità
                const previousMilestone = maxTile === 64 ? 32 : 128;
                if (gameEngineRef.current && (gameEngineRef.current as any).milestoneStartTimes) {
                  (gameEngineRef.current as any).milestoneStartTimes.delete(previousMilestone);
                }
              } catch (error) {
                console.error(`🚨 ERRORE durante l'espansione/pulizia:`, error);
                setSpeedMessage(`🚨 ERRORE! Il gioco si è bloccato! Ricarica la pagina!`);
                setTimeout(() => setSpeedMessage(''), 10000);
              }
          }
        }
        
        // Applica penalità per spam se necessario
        if (isSpamPenalty && result.moved) {
          // Penalità più severa: 4 tile extra per rendere lo spam controproducente
          for (let i = 0; i < 4; i++) {
            finalGrid = gameEngineRef.current.addRandomNumber(finalGrid);
          }
        }
        
        // Dopo aver applicato eventuali penalità, controlla se il gioco è finito
        const finalGameOver = gameEngineRef.current.isGameOver(finalGrid);
        const finalGameWon = gameEngineRef.current.hasWon(finalGrid);
        
        setGrid(finalGrid);
        setScore(result.newScore);
        setGameWon(finalGameWon);
        setGameOver(finalGameOver);
        
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

  const containerRef = useRef<HTMLDivElement>(null);

  // Rileva i gesti di swipe con configurazione migliorata
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0, startY = 0, touching = false;
    const threshold = 30;

    const onStart = (e: TouchEvent) => {
      touching = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (!touching) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!touching) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      touching = false;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      handleMove(dir);
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [handleMove]);



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



  // Timer che si aggiorna ogni secondo per mostrare i tempi in tempo reale
  useEffect(() => {
    if (gameOver || gameWon) return; // Non aggiornare se il gioco è finito
    
    const interval = setInterval(() => {
      const now = Date.now();
      const gameStartTime = gameEngineRef.current?.getGameStartTime();
      
      if (gameStartTime) {
        // Tempo totale dall'inizio del gioco
        const totalTime = Math.floor((now - gameStartTime) / 1000);
        setGameTime(totalTime);
        
        // Tempo dall'ultimo milestone raggiunto (tempo reale)
        const maxTile = gameEngineRef.current?.getMaxTile(grid);
        if (maxTile && maxTile >= 32) {
          // Se abbiamo un timestamp dell'ultimo milestone, calcola il tempo trascorso
          if (lastMilestoneReached > 0) {
            const timeSinceLastMilestone = Math.floor((now - lastMilestoneReached) / 1000);
            setLastMilestoneTime(timeSinceLastMilestone);
          }
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [grid, gameOver, gameWon]);

  // Reset del timer dall'ultimo milestone quando si raggiunge un nuovo milestone
  useEffect(() => {
    if (gameEngineRef.current) {
      const maxTile = gameEngineRef.current.getMaxTile(grid);
      if (maxTile >= 32) {
        // NON resettare più il timer milestone - deve continuare a contare
        // setLastMilestoneTime(0); // RIMOSSO!
      }
    }
  }, [grid]);

  // Inizializza il timer del primo milestone quando il gioco inizia
  useEffect(() => {
    if (gameEngineRef.current && gameEngineRef.current.getGameStartTime()) {
      setLastMilestoneReached(gameEngineRef.current.getGameStartTime()!);
    }
  }, []);

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
    setGameTime(0); // Reset del timer totale
    setLastMilestoneTime(0); // Reset del timer dall'ultimo milestone
    setLastMilestoneReached(0); // Reset del timestamp dell'ultimo milestone
    setMoveTimestamps([]); // Reset del sistema anti-spam
    setSpamWarning(''); // Reset del messaggio spam
    
    // Reset della torre! 🏰
    if ((window as any).resetTower) {
      (window as any).resetTower();
    }
  };

  // Funzione per ottenere i colori basati sul valore (zen ed eleganti)
  const getTileStyle = (value: number) => {
    const styles: Record<number, string> = {
      0: 'bg-white/40 backdrop-blur-none text-transparent border border-gray-200/50 shadow-lg',
      2: 'bg-yellow-100 text-yellow-800 tile-elegant',
      4: 'bg-yellow-200 text-yellow-900 tile-elegant',
      8: 'bg-orange-200 text-orange-900 tile-elegant',
      16: 'bg-orange-300 text-orange-900 tile-elegant',
      32: 'bg-red-300 text-red-900 tile-elegant',
      64: 'bg-red-400 text-red-900 tile-elegant',
      128: 'bg-red-500 text-white tile-elegant tile-shadow-elegant',
      256: 'bg-red-600 text-white tile-elegant tile-shadow-elegant-lg',
      512: 'bg-red-700 text-white tile-elegant tile-shadow-elegant-lg',
      1024: 'bg-red-800 text-white tile-elegant tile-shadow-elegant-xl',
      2048: 'bg-yellow-400 text-yellow-900 tile-elegant tile-shadow-elegant-xl animate-pulse'
    };
    return styles[value] || 'bg-red-900 text-white tile-elegant tile-shadow-elegant-xl';
  };

  const getFontSize = (value: number) => {
    if (value >= 1024) return 'text-4xl';      // Molto più grande per numeri alti
    if (value >= 128) return 'text-5xl';       // Enorme per milestone
    if (value >= 16) return 'text-6xl';        // Gigante per valori medi
    return 'text-7xl';                          // Colossale per 2 e 4
  };

  return (
    <div className="game-container">
      <div ref={containerRef} className="board">
        <div className="relative z-20 w-screen h-screen flex items-center justify-center p-8">
          <div className="bg-white/40 backdrop-blur-none rounded-3xl shadow-lg p-8 max-w-md w-full border border-red-100/50 transition-all duration-500">
            {/* Header */}
            <div className="mb-6">
              <div className="mb-6">
                <h1 className="text-7xl font-black text-red-600 mb-2 tracking-tight text-center">2048-T</h1>
                <h2 className="text-xl font-semibold text-red-500 text-center mb-2">Climb the Tower</h2>
                <p className="text-sm text-gray-400 italic font-light text-center mb-4">Ver. Tower by F. Marinuzzi, Ph.D.</p>
              </div>
              
              {/* Score, Best e New Game centrati con la scacchiera */}
              <div className="flex justify-center items-center mb-6">
                <div className="flex space-x-3">
                  <div className="bg-white/40 backdrop-blur-none text-orange-800 px-4 py-2 rounded-lg text-center min-w-[80px] border border-orange-200/50 shadow-lg">
                    <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Score</div>
                    <div className="text-xl font-black text-orange-900">{score}</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-none text-red-800 px-4 py-2 rounded-lg text-center min-w-[80px] border border-red-200/50 shadow-lg">
                    <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Best</div>
                    <div className="text-xl font-black text-red-900">{highScore}</div>
                  </div>
                  
                  {/* Bottone View Tower quadrato con sfondo chiaro */}
                  <button
                    onClick={() => {
                      // Controlla se la funzione è disponibile e prova a mostrare la torre
                      if ((window as any).setTowerView) {
                        try {
                          (window as any).setTowerView(true);
                        } catch (error) {
                          console.error('Errore nel mostrare la torre:', error);
                        }
                      } else {
                        // Se non è disponibile, aspetta un momento e riprova
                        setTimeout(() => {
                          if ((window as any).setTowerView) {
                            (window as any).setTowerView(true);
                          }
                        }, 100);
                      }
                    }}
                    className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 p-4 rounded-lg shadow-md transition-all duration-200 font-bold border border-gray-300"
                    title="View Tower"
                    style={{ aspectRatio: '1' }}
                  >
                    ♖
                  </button>
                  
                  <button
                    onClick={resetGame}
                    className="bg-white/40 backdrop-blur-none hover:bg-white/60 text-green-800 px-6 py-2 rounded-lg shadow-lg transition-all duration-200 font-bold border border-green-200/50"
                  >
                    New
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="p-6 rounded-2xl mb-6">
              <div 
                className="grid gap-3 transition-all duration-300"
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
                        aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105
                        ${getTileStyle(cell)}
                        ${getFontSize(cell)}
                        min-h-[60px] min-w-[60px]
                      `}
                      style={{
                        fontSize: grid.length > 4 ? '1rem' : '1.25rem' // Font più grande anche per griglie grandi
                      }}
                    >
                      {cell !== 0 && cell}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controlli */}
            <div className="text-center text-gray-600 mb-4">
              {/* Pulsanti delle frecce direzionali */}
              <div className="flex flex-col items-center gap-1 mt-4 mb-4">
                <button onClick={() => handleMove('ArrowUp')} className="w-12 h-12 bg-white/40 backdrop-blur-none hover:bg-white/60 text-2xl rounded-lg shadow-lg transition-all duration-200 border border-gray-200/50">⬆️</button>
                <div className="flex gap-16">
                  <button onClick={() => handleMove('ArrowLeft')} className="w-12 h-12 bg-white/40 backdrop-blur-none hover:bg-white/60 text-2xl rounded-lg shadow-lg transition-all duration-200 border border-gray-200/50">⬅️</button>
                  <button onClick={() => handleMove('ArrowRight')} className="w-12 h-12 bg-white/40 backdrop-blur-none hover:bg-white/60 text-2xl rounded-lg shadow-lg transition-all duration-200 border border-gray-200/50">➡️</button>
                </div>
                <button onClick={() => handleMove('ArrowDown')} className="w-12 h-12 bg-white/40 backdrop-blur-none hover:bg-white/60 text-2xl rounded-lg shadow-lg transition-all duration-200 border border-gray-200/50">⬇️</button>
              </div>

              {/* Messaggio di velocità (bonus o penalità) */}
              {speedMessage && (
                <div className={`text-sm font-bold mb-2 p-2 rounded-lg ${
                  speedMessage.includes('Nuar a rí-han') 
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  {speedMessage}
                </div>
              )}
              
              {/* Messaggio spam o icona fulmine per giocatore esperto */}
              {spamWarning && (
                <div className="text-center mb-2">
                  {spamWarning.includes('Spam detected') ? (
                    // Messaggio spam con stile rosso
                    <div className="text-sm font-bold p-2 rounded-lg bg-red-100 text-red-800 border border-red-300">
                      {spamWarning}
                    </div>
                  ) : (
                    // Solo icona fulmine per giocatore esperto
                    <div className="text-2xl font-bold text-yellow-600 animate-pulse">
                      {spamWarning}
                    </div>
                  )}
                </div>
              )}
              
              {/* Controlli direzionali zen */}
              <div className="text-center mb-6">
                <p className="text-sm text-orange-600 font-medium">
                  Use arrows or WASD • Tip: ⌘/Ctrl + R to restart
                </p>
              </div>
              
              {/* Spazio per futuri controlli se necessario */}
              <div className="h-4"></div>
            </div>

            {/* Game Over/Win Overlay */}
            {(gameOver || gameWon) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-100 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
                  <h2 className={`text-4xl font-bold mb-4 ${gameWon ? 'text-amber-800' : 'text-red-500'}`}>
                    {gameWon ? 'YOU WIN! 🎉' : 'GAME OVER! 😔'}
                  </h2>
                  <p className="text-gray-600 mb-6 text-lg">
                    Final Score: <span className="font-bold text-orange-600">{score}</span>
                  </p>
                  
                  {gameWon && (
                    <div className="mb-6">
                      <p className="text-lg text-amber-800 font-bold mb-4">
                        🏰 Your tower is complete! Admire its beauty! ✨
                      </p>
                      <button
                        onClick={() => {
                          // Controlla se la funzione è disponibile e prova a mostrare la torre
                          if ((window as any).setTowerView) {
                            try {
                              (window as any).setTowerView(true);
                            } catch (error) {
                              console.error('Errore nel mostrare la torre:', error);
                            }
                          } else {
                            // Se non è disponibile, aspetta un momento e riprova
                            setTimeout(() => {
                              if ((window as any).setTowerView) {
                                (window as any).setTowerView(true);
                              }
                            }, 100);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-bold text-lg mb-3 w-full"
                      >
                        🏰 View Your Tower
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 font-bold text-lg"
                  >
                    TRY AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Game;
