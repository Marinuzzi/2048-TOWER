export interface GameEvents {
  onTileMerged?: (value: number, isSpeedBonus?: boolean) => void;
  onGameOver?: (finalScore: number, maxTile: number) => void;
  onScoreChange?: (score: number) => void;
}

export interface GameState {
  grid: number[][];
  score: number;
  gameWon: boolean;
  gameOver: boolean;
  gridSize: number; // Dimensione dinamica della griglia
}

export interface MoveResult {
  grid: number[][];
  scoreIncrease: number;
  moved: boolean;
  mergedValues: number[];
}

export class Game2048Engine {
  private events: GameEvents;
  private gridSize: number;
  private milestoneStartTimes: Map<number, number> = new Map();
  private lastMaxTile: number = 0;
  
  constructor(events: GameEvents = {}, initialGridSize: number = 4) {
    this.events = events;
    this.gridSize = initialGridSize;
  }

  // Aggiungi un numero casuale in una posizione vuota
  addRandomNumber(grid: number[][]): number[][] {
    // Controllo di sicurezza per la dimensione della griglia
    if (!grid || grid.length !== this.gridSize) {
      console.error(`🚨 ERRORE: Dimensione griglia non corrisponde! Grid: ${grid?.length}, Engine: ${this.gridSize}`);
      return grid;
    }
    
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (grid[i] && grid[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      grid[row][col] = value;
      console.log(`🎲 Aggiunta tile ${value} in posizione [${row}, ${col}]`);
    } else {
      console.log(`⚠️ Nessuna cella vuota trovata per aggiungere tile casuale`);
    }
    
    return grid;
  }

  // Inizializza la griglia vuota
  initializeGrid(): number[][] {
    const grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    // Aggiungi due numeri casuali all'inizio
    this.addRandomNumber(grid);
    this.addRandomNumber(grid);
    return grid;
  }

  // Funzione per muovere e fondere le tile
  moveLeft(grid: number[][]): MoveResult {
    const newGrid = grid.map(row => [...row]);
    let scoreIncrease = 0;
    let moved = false;
    const mergedValues: number[] = [];

    for (let i = 0; i < this.gridSize; i++) {
      let row = newGrid[i].filter(val => val !== 0);
      
      // Fusione
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          const oldValue = row[j];
          row[j] *= 2;
          scoreIncrease += row[j];
          mergedValues.push(row[j]);
          row[j + 1] = 0;
          
          console.log(`🔄 MERGE: ${oldValue} + ${oldValue} = ${row[j]} (score: +${row[j]})`);
          
          // Calcola se merita bonus velocità
          const isNewMilestone = row[j] > this.lastMaxTile && this.isMilestone(row[j]);
          let isSpeedBonus = false;
          
          console.log(`🔍 Controllo milestone ${row[j]}: isNewMilestone=${isNewMilestone}, lastMaxTile=${this.lastMaxTile}, isMilestone=${this.isMilestone(row[j])}`);
          
          if (isNewMilestone) {
            const now = Date.now();
            const timeTarget = this.getSpeedTarget(row[j]); // secondi per questo milestone
            const previousMilestone = this.getPreviousMilestone(row[j]);
            
            // Controlla se abbiamo un timer attivo per il milestone precedente
            if (this.milestoneStartTimes.has(previousMilestone)) {
              const startTime = this.milestoneStartTimes.get(previousMilestone)!;
              const elapsedSeconds = (now - startTime) / 1000;
              
              console.log(`⏱️  Da ${previousMilestone} a ${row[j]}: ${elapsedSeconds.toFixed(1)}s (target: ${timeTarget}s)`);
              
              if (elapsedSeconds <= timeTarget) {
                isSpeedBonus = true;
                console.log(`⚡ BONUS VELOCITÀ! ${row[j]} raggiunto in ${elapsedSeconds.toFixed(1)}s!`);
                console.log(`🏆 BRAVO! Sei premiato per la velocità! La tua torre avrà un'aura speciale! ⚡✨`);
              } else {
                console.log(`⏰ Troppo lento: ${elapsedSeconds.toFixed(1)}s > ${timeTarget}s`);
                console.log(`💪 Continua a giocare! Prova a essere più veloce la prossima volta!`);
              }
              
              // NON rimuovere il timer del milestone precedente - il gioco principale lo farà dopo
              // this.milestoneStartTimes.delete(previousMilestone); // RIMOSSO!
            }
            
            // Avvia il timer per il prossimo milestone
            this.milestoneStartTimes.set(row[j], now);
            this.lastMaxTile = Math.max(this.lastMaxTile, row[j]);
            
            // BONUS SPECIALE: se è 64 o 256, controlla se merita bonus per espansione
            if ((row[j] === 64 || row[j] === 256) && isSpeedBonus) {
              console.log(`🏆 BONUS ESPANSIONE! ${row[j]} raggiunto velocemente - griglia pulita!`);
            }
          }
          
          // Emetti evento per il merge con info bonus velocità
          // NOTA: Per i milestone 64 e 256, il gioco principale decide se aggiungere alla torre
          if (this.events.onTileMerged) {
            // Per i milestone 64 e 256, NON emettere automaticamente - il gioco principale decide
            if ([64, 256].includes(row[j])) {
              console.log(`🚫 Milestone ${row[j]} (64/256) - evento NON emesso automaticamente`);
              // NON emettere evento per questi milestone
            } else {
              // Per tutti gli altri milestone, emetti normalmente
              console.log(`📡 Emetto evento milestone ${row[j]} (speedBonus: ${isSpeedBonus}) - AGGIUNGO ALLA TORRE!`);
              this.events.onTileMerged(row[j], isSpeedBonus);
            }
          } else {
            console.log(`❌ onTileMerged non disponibile per milestone ${row[j]}`);
          }
        }
      }
      
      row = row.filter(val => val !== 0);
      while (row.length < this.gridSize) {
        row.push(0);
      }
      
      // Verifica se c'è stato movimento
      for (let j = 0; j < this.gridSize; j++) {
        if (newGrid[i][j] !== row[j]) {
          moved = true;
        }
      }
      
      newGrid[i] = row;
    }

    return { grid: newGrid, scoreIncrease, moved, mergedValues };
  }

  moveRight(grid: number[][]): MoveResult {
    const reversed = grid.map(row => [...row].reverse());
    const result = this.moveLeft(reversed);
    return {
      ...result,
      grid: result.grid.map(row => [...row].reverse())
    };
  }

  moveUp(grid: number[][]): MoveResult {
    const transposed = this.transpose(grid);
    const result = this.moveLeft(transposed);
    return {
      ...result,
      grid: this.transpose(result.grid)
    };
  }

  moveDown(grid: number[][]): MoveResult {
    const transposed = this.transpose(grid);
    const result = this.moveRight(transposed);
    return {
      ...result,
      grid: this.transpose(result.grid)
    };
  }

  transpose(grid: number[][]): number[][] {
    return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
  }

  isGameOver(grid: number[][]): boolean {
    console.log(`🔍 Controllo Game Over per griglia ${grid?.length}x${grid?.length}, engine size: ${this.gridSize}`);
    
    // Controllo di sicurezza per la dimensione della griglia
    if (!grid || grid.length !== this.gridSize) {
      console.error(`🚨 ERRORE: Dimensione griglia non corrisponde in isGameOver! Grid: ${grid?.length}, Engine: ${this.gridSize}`);
      return true; // Game over se c'è un errore di dimensione
    }
    
    // Controlla se ci sono celle vuote
    let hasEmptyCells = false;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (grid[i] && grid[i][j] === 0) {
          hasEmptyCells = true;
          break;
        }
      }
      if (hasEmptyCells) break;
    }
    
    if (hasEmptyCells) {
      console.log(`✅ Celle vuote trovate - gioco continua`);
      return false;
    }
    
    console.log(`🔍 Griglia piena - controllo mosse possibili...`);
    
    // Controlla se ci sono mosse possibili
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (!grid[i]) continue; // Salta righe non valide
        
        const current = grid[i][j];
        if ((i < this.gridSize - 1 && grid[i + 1] && grid[i + 1][j] === current) || 
            (j < this.gridSize - 1 && grid[i][j + 1] === current)) {
          console.log(`✅ Mossa possibile trovata: ${current} può fondersi`);
          return false;
        }
      }
    }
    
    console.log(`🚨 GAME OVER! Nessuna mossa possibile in griglia ${this.gridSize}x${this.gridSize}`);
    return true;
  }

  getMaxTile(grid: number[][]): number {
    // Controllo di sicurezza per la dimensione della griglia
    if (!grid || grid.length !== this.gridSize) {
      console.error(`🚨 ERRORE: Dimensione griglia non corrisponde in getMaxTile! Grid: ${grid?.length}, Engine: ${this.gridSize}`);
      return 0;
    }
    
    let max = 0;
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (grid[i] && grid[i][j] > max) {
          max = grid[i][j];
        }
      }
    }
    return max;
  }

  hasWon(grid: number[][]): boolean {
    return this.getMaxTile(grid) >= 2048;
  }

  // Espande la griglia aggiungendo una riga e una colonna
  expandGrid(grid: number[][]): number[][] {
    const oldSize = this.gridSize;
    const newSize = oldSize + 1;
    
    console.log(`🔧 Espansione griglia: ${oldSize}x${oldSize} → ${newSize}x${newSize}`);
    
    // Crea nuova griglia più grande
    const newGrid: number[][] = [];
    for (let i = 0; i < newSize; i++) {
      newGrid[i] = [];
      for (let j = 0; j < newSize; j++) {
        if (i < oldSize && j < oldSize) {
          newGrid[i][j] = grid[i][j]; // Copia valori esistenti
        } else {
          newGrid[i][j] = 0; // Nuove celle vuote
        }
      }
    }
    
    // Aggiorna la dimensione interna
    this.gridSize = newSize;
    
    console.log(`✅ Griglia espansa con successo! Nuova dimensione: ${this.gridSize}x${this.gridSize}`);
    
    return newGrid;
  }

  // Rimuove tutte le tessere sotto un certo valore
  cleanupLowTiles(grid: number[][], minValue: number): number[][] {
    // Controllo di sicurezza per la dimensione della griglia
    if (!grid || grid.length !== this.gridSize) {
      console.error(`🚨 ERRORE: Dimensione griglia non corrisponde in cleanupLowTiles! Grid: ${grid?.length}, Engine: ${this.gridSize}`);
      return grid;
    }
    
    const newGrid = grid.map(row => [...row]);
    
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (newGrid[i] && newGrid[i][j] > 0 && newGrid[i][j] < minValue) {
          newGrid[i][j] = 0;
        }
      }
    }
    
    console.log(`🧹 Pulizia completata! Rimosse tile sotto ${minValue}`);
    return newGrid;
  }

  // Funzione combo: Espansione + Pulizia per i milestone
  expandAndCleanup(grid: number[][], milestone: number): number[][] {
    let newGrid = grid;
    
    // Logica di espansione e pulizia basata sul milestone
    switch (milestone) {
      case 64:
        newGrid = this.expandGrid(newGrid); // 4x4 → 5x5
        newGrid = this.cleanupLowTiles(newGrid, 4); // Rimuove i 2
        break;
      case 256:
        newGrid = this.expandGrid(newGrid); // 5x5 → 6x6
        newGrid = this.cleanupLowTiles(newGrid, 8); // Rimuove 2 e 4
        break;
      case 1024:
        newGrid = this.expandGrid(newGrid); // 6x6 → 7x7
        newGrid = this.cleanupLowTiles(newGrid, 16); // Rimuove sotto 16
        break;
    }
    
    return newGrid;
  }

  // Getter per la dimensione corrente
  getGridSize(): number {
    return this.gridSize;
  }

  // Verifica se un valore è un milestone della torre
  private isMilestone(value: number): boolean {
    return [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192].includes(value);
  }

  // Trova il milestone precedente
  private getPreviousMilestone(value: number): number {
    const milestones = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
    const currentIndex = milestones.indexOf(value);
    return currentIndex > 0 ? milestones[currentIndex - 1] : 0; // 0 per il primo milestone
  }

  // Tempo target in secondi per ottenere il bonus velocità
  private getSpeedTarget(milestone: number): number {
    const targets: Record<number, number> = {
      32: 12,    // 12 secondi dall'inizio del gioco al 32 (PIÙ DIFFICILE!)
      64: 25,    // 25 secondi dal 32 al 64 (PIÙ DIFFICILE!)
      128: 35,   // 35 secondi dal 64 al 128 (PIÙ DIFFICILE!)
      256: 70,   // 70 secondi dal 128 al 256 (PIÙ DIFFICILE!)
      512: 90,   // 1.5 minuti dal 256 al 512 (PIÙ DIFFICILE!)
      1024: 150, // 2.5 minuti dal 512 al 1024 (PIÙ DIFFICILE!)
      2048: 200, // 3.3 minuti dal 1024 al 2048 (PIÙ DIFFICILE!)
      4096: 250, // 4.2 minuti dal 2048 al 4096 (PIÙ DIFFICILE!)
      8192: 300, // 5 minuti dal 4096 al 8192 (PIÙ DIFFICILE!)
    };
    return targets[milestone] || 200; // Default più difficile
  }

  // Avvia il timer del gioco (per il primo milestone)
  startGameTimer(): void {
    if (!this.milestoneStartTimes.has(0)) {
      this.milestoneStartTimes.set(0, Date.now());
      console.log('🎮 Timer del gioco avviato!');
    }
  }

  // Reset dei timer (per nuovo gioco)
  resetSpeedTimers(): void {
    this.milestoneStartTimes.clear();
    this.lastMaxTile = 0;
  }

  // Controlla se un milestone merita il bonus velocità
  checkSpeedBonus(milestone: number): boolean {
    console.log(`🔍 CHECK SPEED BONUS per milestone ${milestone}`);
    console.log(`📊 Timer disponibili:`, Array.from(this.milestoneStartTimes.keys()));
    
    // CASO SPECIALE: Per il primo milestone (32), usa il timer del gioco
    if (milestone === 32) {
      console.log(`🎯 Milestone 32 - controllo timer 0`);
      if (this.milestoneStartTimes.has(0)) {
        const startTime = this.milestoneStartTimes.get(0)!;
        const now = Date.now();
        const elapsedSeconds = (now - startTime) / 1000;
        const timeTarget = this.getSpeedTarget(milestone);
        
        console.log(`⏱️ Controllo bonus ${milestone} (PRIMO): ${elapsedSeconds.toFixed(1)}s vs ${timeTarget}s`);
        console.log(`⏱️ Start time: ${new Date(startTime).toLocaleTimeString()}, Now: ${new Date(now).toLocaleTimeString()}`);
        
        // PENALITÀ SE TROPPO LENTO! 🚨
        if (elapsedSeconds > timeTarget * 1.5) {
          console.log(`🚨 PENALITÀ GRAVE! ${milestone} raggiunto troppo tardi! Il gioco diventerà molto difficile!`);
        }
        
        const result = elapsedSeconds <= timeTarget;
        console.log(`✅ Risultato bonus 32: ${result}`);
        return result;
      }
      console.log(`❌ Timer 0 non trovato per milestone 32`);
      return false; // Timer non ancora avviato
    }
    
    // Per tutti gli altri milestone, usa il milestone precedente
    const previousMilestone = this.getPreviousMilestone(milestone);
    console.log(`🔍 Milestone ${milestone} - controllo timer ${previousMilestone}`);
    
    if (this.milestoneStartTimes.has(previousMilestone)) {
      const startTime = this.milestoneStartTimes.get(previousMilestone)!;
      const now = Date.now();
      const elapsedSeconds = (now - startTime) / 1000;
      const timeTarget = this.getSpeedTarget(milestone);
      
      console.log(`⏱️ Controllo bonus ${milestone}: ${elapsedSeconds.toFixed(1)}s vs ${timeTarget}s`);
      console.log(`⏱️ Start time: ${new Date(startTime).toLocaleTimeString()}, Now: ${new Date(now).toLocaleTimeString()}`);
      
      // PENALITÀ SE TROPPO LENTO! 🚨
      if (elapsedSeconds > timeTarget * 1.5) { // 50% più lento del target
        console.log(`🚨 PENALITÀ GRAVE! ${milestone} raggiunto troppo tardi! Il gioco diventerà molto difficile!`);
      }
      
      const result = elapsedSeconds <= timeTarget;
      console.log(`✅ Risultato bonus ${milestone}: ${result}`);
      return result;
    }
    
    console.log(`❌ Timer ${previousMilestone} non trovato per milestone ${milestone}`);
    return false;
  }

  // Metodo principale per processare una mossa
  processMove(grid: number[][], direction: string, currentScore: number): {
    newGrid: number[][];
    newScore: number;
    gameOver: boolean;
    gameWon: boolean;
    moved: boolean;
  } {
    // Controllo di sicurezza per la griglia
    if (!grid || grid.length !== this.gridSize) {
      console.error(`🚨 ERRORE CRITICO: Griglia non valida in processMove! Grid: ${grid?.length}, Engine: ${this.gridSize}`);
      return {
        newGrid: grid || [],
        newScore: currentScore,
        gameOver: true, // Forza game over se la griglia è corrotta
        gameWon: false,
        moved: false
      };
    }
    
    let result: MoveResult;
    
    try {
      switch (direction) {
        case 'ArrowLeft':
          result = this.moveLeft(grid);
          break;
        case 'ArrowRight':
          result = this.moveRight(grid);
          break;
        case 'ArrowUp':
          result = this.moveUp(grid);
          break;
        case 'ArrowDown':
          result = this.moveDown(grid);
          break;
        default:
          return {
            newGrid: grid,
            newScore: currentScore,
            gameOver: false,
            gameWon: false,
            moved: false
          };
      }
    } catch (error) {
      console.error(`🚨 ERRORE durante la mossa ${direction}:`, error);
      return {
        newGrid: grid,
        newScore: currentScore,
        gameOver: true, // Forza game over se c'è un errore
        gameWon: false,
        moved: false
      };
    }

    if (result.moved) {
      try {
        this.addRandomNumber(result.grid);
        const newScore = currentScore + result.scoreIncrease;
        
        // Emetti evento per il cambio di score
        if (this.events.onScoreChange) {
          this.events.onScoreChange(newScore);
        }
        
        const gameOver = this.isGameOver(result.grid);
        const gameWon = this.hasWon(result.grid);
        
        console.log(`🎮 ProcessMove completato: gameOver=${gameOver}, gameWon=${gameWon}, score=${newScore}`);
        
        // Emetti evento per game over
        if (gameOver && this.events.onGameOver) {
          this.events.onGameOver(newScore, this.getMaxTile(result.grid));
        }
        
        return {
          newGrid: result.grid,
          newScore,
          gameOver,
          gameWon,
          moved: true
        };
      } catch (error) {
        console.error(`🚨 ERRORE durante l'aggiunta di tile casuali:`, error);
        return {
          newGrid: result.grid,
          newScore: currentScore + result.scoreIncrease,
          gameOver: true, // Forza game over se c'è un errore
          gameWon: false,
          moved: true
        };
      }
    }

    return {
      newGrid: grid,
      newScore: currentScore,
      gameOver: false,
      gameWon: false,
      moved: false
    };
  }
}
