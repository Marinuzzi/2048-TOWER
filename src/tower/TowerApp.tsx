import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TowerAppProps {
  onTileMerged?: (value: number, isSpeedBonus?: boolean) => void;
  onGameOver?: (finalScore: number, maxTile: number) => void;
  showTowerView?: boolean;
}

interface Segment {
  label: string;
  value: number;
  height: number;
  palette: [string, string];
  decoration: string;
  isLatest: boolean;
  speedBonus?: boolean;
}

const TowerApp: React.FC<TowerAppProps> = ({ showTowerView: propShowTowerView = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [cameraOffset, setCameraOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTowerView, setShowTowerView] = useState(propShowTowerView);

  const animationFrameRef = useRef<number>();

  // Configurazione
  const TOWER_TOP_TARGET_RATIO = 0.22;
  const SEGMENT_HEIGHT_BASE = 60;
  const CAMERA_SCROLL_RATIO = -0.18;

  // Palette ELEGANTE: dal marrone scuro alla base al giallo dorato in cima
  const pickPalette = (label: string): [string, string] => {
    const palettes: Record<string, [string, string]> = {
      '32': ['#3C2414', '#5D341A'],     // Base: Marrone molto scuro (terra)
      '64': ['#5D341A', '#7A4722'],     // Marrone scuro (legno antico)
      '128': ['#7A4722', '#965928'],    // Marrone medio-scuro (corteccia)
      '256': ['#965928', '#B26B2E'],    // Marrone medio (legno chiaro)
      '512': ['#B26B2E', '#CE7D34'],    // Marrone-arancio (rame)
      '1024': ['#CE7D34', '#E98F3A'],   // Arancio-bronzo (metallo)
      '2048': ['#F4A460', '#F7DC6F'],   // Oro-giallo (corona dorata)
      '4096': ['#F7DC6F', '#F9E79F'],   // Giallo chiaro (luce dorata)
      '8192': ['#F9E79F', '#FFFACD'],   // Giallo crema (luce celestiale)
    };
    return palettes[label] || ['#5D341A', '#7A4722']; // Marrone di default
  };

  // Decorazioni per i diversi milestone
  const getDecoration = (label: string): string => {
    const decorations: Record<string, string> = {
      '32': 'base-porta',      // Base con porta d'ingresso
      '64': 'finestra-arco',   // Finestra ad arco
      '128': 'balcone',        // Balcone medievale
      '256': 'torretta',       // Piccola torretta
      '512': 'finestra-gotica', // Finestra gotica
      '1024': 'merli',         // Merlature
      '2048': 'corona-regale', // Corona con bandiere
      '4096': 'torre-interna', // Torre interna più piccola
      '8192': 'guglia',        // Guglia finale
    };
    return decorations[label] || 'semplice';
  };

  // Calcola la larghezza del segmento in base alla posizione nella torre
  const getSegmentWidth = (value: number, baseWidth: number): number => {
    if (value === 2048) {
      return baseWidth * 1.2; // Corona più grande
    }
    
    // Larghezza decrescente per effetto torre medievale - ULTRA VISIBILE!
    const levels: Record<number, number> = {
      32: 1.0,    // Base: 100%
      64: 0.95,   // 95% (quasi base)
      128: 0.9,   // 90% (molto visibile)
      256: 0.9,   // 90% (molto visibile)
      512: 0.85,  // 85% (ULTRA VISIBILE!)
      1024: 0.8,  // 80% (ULTRA VISIBILE!)
      2048: 1.2,  // Corona: 120%
      4096: 0.75, // Torre interna: 75% (ULTRA VISIBILE!)
      8192: 0.7,  // Guglia: 70% (ULTRA VISIBILE!)
    };
    
    return baseWidth * (levels[value] || 0.8); // Default ultra visibile
  };

  // Crea un nuovo segmento
  const makeSegment = (value: number): Segment => {
    const label = value.toString();
    
    // Altezza variabile in base al tipo di segmento
    let height = SEGMENT_HEIGHT_BASE;
    if (value === 32) height = 80;        // Base più alta
    else if (value === 2048) height = 100; // Corona alta
    else if (value >= 4096) height = 60;   // Torre interna più bassa
    else height = 70;                      // Altezza standard
    
    return {
      label,
      value,
      height,
      palette: pickPalette(label),
      decoration: getDecoration(label),
      isLatest: true,
    };
  };

  // Aggiunge un milestone alla torre
  const addMilestone = useCallback((value: number, isSpeedBonus: boolean = false) => {
    
    if (value < 32) {
      return; // Inizia da 32
    }
    
    setSegments(prev => {
      
      // Controlla se questo milestone esiste già
      const existingSegment = prev.find(seg => seg.value === value);
      if (existingSegment) {
        return prev; // Non aggiungere duplicati
      }
      
      // Segna tutti i segmenti esistenti come non più latest
      const updatedSegments = prev.map(seg => ({ ...seg, isLatest: false }));
      
      // Aggiungi il nuovo segmento con info bonus
      const newSegment = { ...makeSegment(value), speedBonus: isSpeedBonus };
      const newSegments = [...updatedSegments, newSegment];
      
      // Anima la camera verso l'alto
      setCameraOffset(current => current + CAMERA_SCROLL_RATIO * newSegment.height);
      
      // Effetto gratificante per il nuovo milestone
      setTimeout(() => {
        if (isSpeedBonus) {
          
          // MESSAGGIO "BRAVO" PER IL BONUS VELOCITÀ! 🏆 (NO ALERT!)
        } else {
        }
      }, 100);
      
      return newSegments;
    });
  }, []);

  // Reset della torre
  const resetTower = useCallback(() => {
    setSegments([]);
    setCameraOffset(0);
    setShowTowerView(false);
  }, []);

  // Effetto per esporre le funzioni globalmente
  useEffect(() => {
    (window as any).addMilestone = addMilestone;
    (window as any).resetTower = resetTower;
    
    // Cleanup
    return () => {
      delete (window as any).addMilestone;
      delete (window as any).resetTower;
    };
  }, [addMilestone, resetTower]);

  // Disegna un segmento
  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    segment: Segment,
    x: number,
    y: number,
    width: number,
    canvasWidth: number,
    height?: number
  ) => {
    const segmentHeight = height || segment.height;
    // Usa la larghezza calcolata per l'effetto torre medievale
    const segmentWidth = getSegmentWidth(segment.value, width);
    const segmentX = x + (width - segmentWidth) / 2;

    // Gradiente
    const gradient = ctx.createLinearGradient(segmentX, y, segmentX + segmentWidth, y + segmentHeight);
    gradient.addColorStop(0, segment.palette[0]);
    gradient.addColorStop(1, segment.palette[1]);

    // Disegna il segmento principale
    ctx.fillStyle = gradient;
    ctx.fillRect(segmentX, y, segmentWidth, segmentHeight);

    // Decorazioni medievali specifiche
    ctx.strokeStyle = '#8B4513';
    ctx.fillStyle = '#654321';
    ctx.lineWidth = 2;

    switch (segment.decoration) {
      case 'base-porta':
        // Porta d'ingresso GOTICA MICROSCOPICA! 🏰
        const portaW = segmentWidth * 0.125; // UN OTTAVO della larghezza!
        const portaH = segmentHeight * 0.3; // Molto più bassa
        const portaX = segmentX + (segmentWidth - portaW) / 2;
        const portaY = y + segmentHeight * 0.35; // Centrata verticalmente
        
        // Cornice porta gotica elegante
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(portaX - 2, portaY - 2, portaW + 4, portaH + 4);
        
        // Porta principale RECTANGOLARE
        ctx.fillStyle = '#654321';
        ctx.fillRect(portaX, portaY, portaW, portaH);
        
        // ARCO GOTICO SOPRA LA PORTA (COMPLETO!) 🏛️
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(portaX + portaW/2, portaY, portaW/2, 0, Math.PI, true);
        ctx.fill();
        
        // Bordo dorato dell'arco gotico
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(portaX + portaW/2, portaY, portaW/2, 0, Math.PI, true);
        ctx.stroke();
        
        // Dettagli gotici sulla porta
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        // Linea centrale verticale
        ctx.beginPath();
        ctx.moveTo(portaX + portaW/2, portaY);
        ctx.lineTo(portaX + portaW/2, portaY + portaH);
        ctx.stroke();
        
        // Maniglia dorata elegante
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(portaX + portaW - 3, portaY + portaH/2, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Chiave nella serratura
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(portaX + portaW/2 - 1, portaY + portaH - 6, 2, 6);
        
        // Scritta elegante sopra la porta
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 8px serif';
        ctx.textAlign = 'center';
        ctx.fillText('32', portaX + portaW/2, portaY - 8);
        break;
      
      case 'finestra-arco':
        // DUE FINESTRE PICCOLINE: sinistra con grata, destra gialla! 🪟
        const finW = segmentWidth * 0.2; // PIÙ PICCOLE!
        const finH = segmentHeight * 0.3; // PIÙ BASSE!
        
        // FINESTRA SINISTRA con grata metallica
        const finSX = segmentX + segmentWidth * 0.2;
        const finSY = y + segmentHeight * 0.35;
        
        // Cornice finestra sinistra
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finSX - 2, finSY - 2, finW + 4, finH + 4);
        
        // Vetro con grata metallica
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(finSX, finSY, finW, finH);
        
        // Grata metallica SOTTILE
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1; // PIÙ SOTTILE!
        // Linee orizzontali
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(finSX, finSY + (finH * i) / 3);
          ctx.lineTo(finSX + finW, finSY + (finH * i) / 3);
          ctx.stroke();
        }
        // Linee verticali
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(finSX + (finW * i) / 3, finSY);
          ctx.lineTo(finSX + (finW * i) / 3, finSY + finH);
          ctx.stroke();
        }
        
        // FINESTRA DESTRA con sfondo giallo
        const finDX = segmentX + segmentWidth * 0.65;
        const finDY = y + segmentHeight * 0.35;
        
        // Cornice finestra destra
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(finDX - 2, finDY - 2, finW + 4, finH + 4);
        
        // Vetro giallo
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(finDX, finDY, finW, finH);
        
        // Dettagli decorativi sulla finestra gialla
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(finDX + finW/2, finDY + finH/2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Scritta "64" tra le finestre
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.fillText('64', segmentX + segmentWidth/2, y + segmentHeight * 0.8);
        break;
        
      case 'balcone':
        // Balcone medievale con 6 PERSONE IN FESTA! 🎉
        const balcX = segmentX + segmentWidth * 0.1;
        const balcW = segmentWidth * 0.8;
        const balcY = y + segmentHeight * 0.6;
        
        // Piattaforma del balcone
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(balcX, balcY, balcW, 10);
        
        // Ringhiera decorata
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(balcX, balcY);
        ctx.lineTo(balcX + balcW, balcY);
        ctx.stroke();
        
        // Sostegni decorativi
        for (let i = 0; i <= 6; i++) {
          const sosX = balcX + (i * balcW) / 6;
          ctx.beginPath();
          ctx.moveTo(sosX, balcY);
          ctx.lineTo(sosX, balcY + 12);
          ctx.stroke();
          
          // Decorazioni sulla ringhiera
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(sosX, balcY - 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // 6 PERSONE IN FESTA! 🎭
        const people = [
          { x: 0.1, gender: 'F', color: '#FF1493' }, // Donna rosa
          { x: 0.25, gender: 'M', color: '#4169E1' }, // Uomo blu
          { x: 0.4, gender: 'F', color: '#FF69B4' },  // Donna rosa chiaro
          { x: 0.55, gender: 'M', color: '#32CD32' }, // Uomo verde
          { x: 0.7, gender: 'F', color: '#FFD700' },  // Donna gialla
          { x: 0.85, gender: 'M', color: '#FF4500' }  // Uomo arancione
        ];
        
        people.forEach((person, index) => {
          const personX = balcX + (person.x * balcW);
          const personY = balcY - 20;
          
          // Corpo
          ctx.fillStyle = person.color;
          ctx.fillRect(personX - 3, personY, 6, 10);
          
          // Testa
          ctx.fillStyle = person.gender === 'F' ? '#FDBCB4' : '#DEB887';
          ctx.beginPath();
          ctx.arc(personX, personY - 4, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Capelli
          ctx.fillStyle = person.gender === 'F' ? '#DAA520' : '#8B4513';
          ctx.fillRect(personX - 4, personY - 7, 8, 4);
          
          // Braccia che festeggiano
          ctx.strokeStyle = person.gender === 'F' ? '#FDBCB4' : '#DEB887';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(personX - 3, personY + 3);
          ctx.lineTo(personX - 6, personY - 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(personX + 3, personY + 3);
          ctx.lineTo(personX + 6, personY - 2);
          ctx.stroke();
        });
        
        // CORIANDOLI che cadono! 🎊
        for (let i = 0; i < 12; i++) {
          const confX = balcX + Math.random() * balcW;
          const confY = y + Math.random() * 50;
          const confColor = ['#FF1493', '#00FF00', '#FFD700', '#FF0000', '#0000FF'][Math.floor(Math.random() * 5)];
          
          ctx.fillStyle = confColor;
          ctx.fillRect(confX, confY, 3, 2);
        }
        
        // Scritta "128" sotto il balcone
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('128', segmentX + segmentWidth/2, y + segmentHeight * 0.9);
        break;
        
      case 'torretta':
        // 🏰 LIVELLO 256: STEMMI E DRAGHI! 🐉
        const torrW = segmentWidth * 0.6;
        const torrH = segmentHeight * 0.8;
        const torrX = segmentX + (segmentWidth - torrW) / 2;
        const torrY = y + segmentHeight * 0.1;
        
        // Torre base elegante
        ctx.fillStyle = segment.palette[1];
        ctx.fillRect(torrX, torrY, torrW, torrH);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(torrX, torrY, torrW, torrH);
        
        // STEMMI ARALDICI! 🛡️
        const stemmi = [
          { x: 0.2, color: '#8B0000', symbol: '⚔️' }, // Rosso scuro con spada
          { x: 0.5, color: '#006400', symbol: '🛡️' }, // Verde scuro con scudo
          { x: 0.8, color: '#4B0082', symbol: '⚜️' }  // Viola scuro con giglio
        ];
        
        stemmi.forEach(stemma => {
          const stemX = torrX + (stemma.x * torrW);
          const stemY = torrY + torrH * 0.3;
          
          // Scudo araldico
          ctx.fillStyle = stemma.color;
          ctx.beginPath();
          ctx.arc(stemX, stemY, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Bordo dorato
          ctx.strokeStyle = '#DAA520';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Simbolo araldico
          ctx.fillStyle = '#FFD700';
          ctx.font = '10px serif';
          ctx.textAlign = 'center';
          ctx.fillText(stemma.symbol, stemX, stemY + 3);
        });
        
        // DRAGHI DECORATIVI! 🐉
        const draghi = [
          { x: 0.15, y: 0.6, color: '#8B4513' }, // Drago marrone
          { x: 0.85, y: 0.6, color: '#654321' }  // Drago scuro
        ];
        
        draghi.forEach(drago => {
          const dragX = torrX + (drago.x * torrW);
          const dragY = torrY + (drago.y * torrH);
          
          // Corpo del drago
          ctx.fillStyle = drago.color;
          ctx.beginPath();
          ctx.arc(dragX, dragY, 6, 0, Math.PI * 2);
          ctx.fill();
          
          // Ali del drago
          ctx.fillStyle = '#D2691E';
          ctx.beginPath();
          ctx.ellipse(dragX - 8, dragY - 3, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(dragX + 8, dragY - 3, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Occhi del drago
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(dragX - 2, dragY - 1, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(dragX + 2, dragY - 1, 1, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // DETTAGLI DECORATIVI ELEGANTI
        // Bandiere che sventolano
        for (let i = 0; i < 3; i++) {
          const flagX = torrX + (i * torrW) / 2;
          const flagY = torrY - 15;
          
          ctx.fillStyle = ['#8B0000', '#006400', '#4B0082'][i];
          ctx.fillRect(flagX, flagY, 3, 8);
          ctx.fillStyle = '#DAA520';
          ctx.fillRect(flagX - 1, flagY, 1, 8);
        }
        
        // Scritta "256" sotto la torre
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('256', segmentX + segmentWidth/2, y + segmentHeight * 0.95);
        ctx.stroke();
        
        break;
        
      case 'finestra-gotica':
        // LIVELLO 512: FINESTRE MICROSCOPICHE E DETTAGLI ICONICI! 🏰
        const finGW = segmentWidth * 0.08; // MICROSCOPICHE!
        const finGH = segmentHeight * 0.15; // MICROSCOPICHE!
        
        // TRE FINESTRE MICROSCOPICHE ELEGANTI
        const finestre = [
          { x: 0.2, color: '#F4A460', symbol: '🌙' }, // Finestra sinistra con luna
          { x: 0.5, color: '#FFD700', symbol: '☀️' },  // Finestra centrale con sole
          { x: 0.8, color: '#DDA0DD', symbol: '⭐' }  // Finestra destra con stella
        ];
        
        finestre.forEach((finestra, index) => {
          const finX = segmentX + (finestra.x * segmentWidth);
          const finY = y + segmentHeight * 0.4; // Centrate verticalmente
          
          // Cornice elegante SOTTILISSIMA
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(finX - 1, finY - 1, finGW + 2, finGH + 2);
          
          // Vetro colorato
          ctx.fillStyle = finestra.color;
          ctx.fillRect(finX, finY, finGW, finGH);
          
          // Simbolo iconico MICROSCOPICO
          ctx.fillStyle = '#8B4513';
          ctx.font = '6px serif';
          ctx.textAlign = 'center';
          ctx.fillText(finestra.symbol, finX + finGW/2, finY + finGH/2 + 1);
        });
        
        // DETTAGLI ICONICI MICROSCOPICI E SIMBOLICI
        const dettagli = [
          { x: 0.15, y: 0.75, symbol: '⚜️', color: '#DAA520' },   // Giglio dorato
          { x: 0.35, y: 0.75, symbol: '🛡️', color: '#8B4513' },   // Scudo
          { x: 0.55, y: 0.75, symbol: '⚔️', color: '#C0C0C0' },   // Spada
          { x: 0.75, y: 0.75, symbol: '🏰', color: '#D2691E' },   // Castello
          { x: 0.95, y: 0.75, symbol: '👑', color: '#FFD700' }    // Corona
        ];
        
        dettagli.forEach(dettaglio => {
          const detX = segmentX + (dettaglio.x * segmentWidth);
          const detY = y + (dettaglio.y * segmentHeight);
          
          // Sfondo circolare MICROSCOPICO
          ctx.fillStyle = dettaglio.color;
          ctx.beginPath();
          ctx.arc(detX, detY, 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Simbolo MICROSCOPICO
          ctx.fillStyle = '#8B4513';
          ctx.font = '4px serif';
          ctx.textAlign = 'center';
          ctx.fillText(dettaglio.symbol, detX, detY);
        });
        
        // Scritta "512" sotto le finestre
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 10px serif';
        ctx.textAlign = 'center';
        ctx.fillText('512', segmentX + segmentWidth/2, y + segmentHeight * 0.95);
        
        break;
        
      case 'merli':
        // 🏰 MERLATURE CON GUARDIE E BANDIERE! 
        const merloW = segmentWidth / 7;
        const merliCount = 7;
        
        for (let i = 0; i < merliCount; i++) {
          const merloX = segmentX + (i * merloW);
          
          if (i % 2 === 0) {
            // Merlatura alta
            ctx.fillStyle = segment.palette[0];
            ctx.fillRect(merloX, y - 15, merloW, 20);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(merloX, y - 15, merloW, 20);
            
            // GUARDIA sui merli! 💂‍♂️
            if (i === 2 || i === 4) {
              const guardX = merloX + merloW/2;
              const guardY = y - 12;
              
              // Corpo guardia
              ctx.fillStyle = '#8B0000'; // Rosso uniforme
              ctx.fillRect(guardX - 2, guardY, 4, 8);
              
              // Testa con elmo
              ctx.fillStyle = '#C0C0C0';
              ctx.beginPath();
              ctx.arc(guardX, guardY - 2, 2.5, 0, Math.PI * 2);
              ctx.fill();
              
              // Lancia della guardia
              ctx.strokeStyle = '#8B4513';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(guardX + 3, guardY);
              ctx.lineTo(guardX + 3, guardY - 12);
              ctx.stroke();
              
              // Punta lancia
              ctx.fillStyle = '#C0C0C0';
              ctx.beginPath();
              ctx.moveTo(guardX + 3, guardY - 12);
              ctx.lineTo(guardX + 1, guardY - 15);
              ctx.lineTo(guardX + 5, guardY - 15);
              ctx.closePath();
              ctx.fill();
            }
            
            // BANDIERINE sui merli! 🚩
            if (i === 0 || i === 6) {
              ctx.fillStyle = '#D4A574'; // Oro antico elegante
              ctx.fillRect(merloX + merloW/2, y - 18, 6, 4);
              
              // Asta bandiera
              ctx.strokeStyle = '#8B4513';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(merloX + merloW/2, y - 18);
              ctx.lineTo(merloX + merloW/2, y - 8);
              ctx.stroke();
            }
          } else {
            // Merlatura bassa (spazio)
            ctx.fillStyle = segment.palette[1];
            ctx.fillRect(merloX, y - 8, merloW, 13);
          }
        }
        
        // FRECCE che volano! 🏹
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const arrowX = segmentX + segmentWidth * (0.2 + i * 0.3);
          const arrowY = y - 25 - i * 3;
          
          // Freccia
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX + 8, arrowY + 2);
          ctx.stroke();
          
          // Punta
          ctx.beginPath();
          ctx.moveTo(arrowX + 8, arrowY + 2);
          ctx.lineTo(arrowX + 6, arrowY);
          ctx.lineTo(arrowX + 6, arrowY + 4);
          ctx.closePath();
          ctx.fill();
        }
        break;
        
      case 'corona-regale':
        // 🎉 FESTA TOTALE! CORONA REGALE CON TUTTO! 👑🎊
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        
        // CORONA GIGANTE al centro! 👑
        const coronaX = segmentX + segmentWidth/2;
        const coronaY = y - 30;
        
        // Base corona dorata
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(coronaX - 20, coronaY + 15, 40, 10);
        
        // Punte della corona
        for (let i = 0; i < 5; i++) {
          const puntagX = coronaX - 20 + (i * 10);
          const altezza = (i === 2) ? 25 : (i % 2 === 0) ? 20 : 15; // Centro più alto
          
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(puntagX, coronaY + 15 - altezza, 8, altezza);
          
          // Gemme sulla corona! 💎
          if (i % 2 === 0) {
            ctx.fillStyle = '#D2691E'; // Ambra elegante
            ctx.beginPath();
            ctx.arc(puntagX + 4, coronaY + 15 - altezza/2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // BANDIERE GIGANTI che sventolano! 🚩
        for (let i = 0; i < 6; i++) {
          const flagX = segmentX + (i * segmentWidth) / 5;
          const flagY = y - 35 - Math.sin(Date.now() * 0.01 + i) * 3; // Sventolano!
          
          // Asta bandiera
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(flagX, flagY);
          ctx.lineTo(flagX, y + segmentHeight);
          ctx.stroke();
          
          // Bandiera colorata elegante
          const colors = ['#D2691E', '#CD853F', '#DAA520', '#F4A460', '#DEB887', '#D4A574'];
          ctx.fillStyle = colors[i];
          ctx.fillRect(flagX + 3, flagY, 12, 8);
          
          // Bordo bandiera
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(flagX + 3, flagY, 12, 8);
        }
        
        // CORIANDOLI che cadono! 🎊
        ctx.shadowBlur = 0;
        for (let i = 0; i < 20; i++) {
          const confX = segmentX + Math.random() * segmentWidth;
          const confY = y - 40 + Math.random() * 20;
          const confColor = ['#F4A460', '#DAA520', '#D2691E', '#CD853F', '#DEB887'][Math.floor(Math.random() * 5)];
          
          ctx.fillStyle = confColor;
          ctx.save();
          ctx.translate(confX, confY);
          ctx.rotate(Math.random() * Math.PI);
          ctx.fillRect(-2, -1, 4, 2);
          ctx.restore();
        }
        
        // FUOCHI D'ARTIFICIO! 🎆
        for (let i = 0; i < 3; i++) {
          const fireworkX = segmentX + segmentWidth * (0.2 + i * 0.3);
          const fireworkY = y - 50 - i * 5;
          
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          
          // Raggiera di scintille
          for (let j = 0; j < 8; j++) {
            const angle = (j * Math.PI * 2) / 8;
            const sparkLen = 8 + Math.random() * 4;
            
            ctx.beginPath();
            ctx.moveTo(fireworkX, fireworkY);
            ctx.lineTo(
              fireworkX + Math.cos(angle) * sparkLen, 
              fireworkY + Math.sin(angle) * sparkLen
            );
            ctx.stroke();
          }
        }
        
        // SCRITTA SUPER EPICA! ✨
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        
        // Testo che brilla
        ctx.fillText('🏆 2048 🏆', segmentX + segmentWidth/2, y + segmentHeight/2 - 5);
        ctx.strokeText('🏆 2048 🏆', segmentX + segmentWidth/2, y + segmentHeight/2 - 5);
        
        ctx.font = 'bold 12px serif';
        ctx.fillStyle = '#D2691E';
        ctx.fillText('VICTORY!', segmentX + segmentWidth/2, y + segmentHeight/2 + 10);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        break;
        
      case 'torre-interna':
        // Torre più piccola all'interno della corona
        const intW = segmentWidth * 0.8;
        const intX = segmentX + (segmentWidth - intW) / 2;
        
        ctx.fillStyle = segment.palette[0];
        ctx.fillRect(intX, y, intW, segment.height);
        ctx.strokeRect(intX, y, intW, segment.height);
        
        // Piccole finestre
        for (let i = 0; i < 2; i++) {
          const finX = intX + (i + 1) * intW / 3;
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(finX - 2, y + segment.height/2, 4, 8);
        }
        break;
        
      case 'guglia':
        // Guglia finale a punta
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(segmentX + segmentWidth/2, y - 15);
        ctx.lineTo(segmentX + segmentWidth*0.3, y + segment.height);
        ctx.lineTo(segmentX + segmentWidth*0.7, y + segment.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // Label del milestone
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(segment.label, segmentX + segmentWidth / 2, y + segmentHeight / 2);
  };

  // Funzione di render principale
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Clear canvas
    ctx.fillStyle = '#f8f3ea'; // Background color dalle specifiche
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (segments.length === 0) return;

    // Calcola posizioni relative alla griglia di gioco
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    // Calcola la posizione della griglia di gioco (simula il layout di Game.tsx)
    const gameCardMaxWidth = 448; // max-w-md = 28rem = 448px
    const gameCardWidth = Math.min(canvasWidth * 0.9, gameCardMaxWidth);
    const gameCardX = (canvasWidth - gameCardWidth) / 2;
    
    // Se siamo in vista torre, usa tutto lo schermo, altrimenti ancorala alla griglia
    if (showTowerView) {
      // Vista torre: centra su tutto lo schermo
      var baselineY = canvasHeight * 0.85;
      var towerWidth = Math.min(canvasWidth * 0.6, 300);
      var towerX = (canvasWidth - towerWidth) / 2;
    } else {
      // Vista gioco: torre MOLTO visibile, proprio dietro il centro della griglia
      var baselineY = canvasHeight * 0.65; // Molto più alta, al centro dello schermo
      var towerWidth = Math.min(gameCardWidth * 0.8, 200); // Ancora più larga
      var towerX = gameCardX + (gameCardWidth - towerWidth) / 2; // Centrata sulla griglia
    }

    // Calcola altezza totale della torre
    const totalHeight = segments.reduce((sum, seg) => sum + seg.height, 0);
    
    // Posizione Y di partenza (dal basso)
    let currentY = baselineY;

    // Se siamo in modalità "Vedi Torre", centra tutta la torre
    let finalOffset = 0;
    if (showTowerView) {
      const desiredTop = canvasHeight * TOWER_TOP_TARGET_RATIO;
      finalOffset = desiredTop - baselineY + totalHeight;
    }

    // Disegna i segmenti dal basso verso l'alto
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Scala l'altezza in base alla modalità di visualizzazione
      const scaledHeight = showTowerView ? segment.height : segment.height * 0.8;
      const y = currentY - scaledHeight + finalOffset;
      
      drawSegment(ctx, segment, towerX, y, towerWidth, canvasWidth, scaledHeight);
      
      // Effetto speciale per bonus velocità ⚡
      if (segment.speedBonus) {
        const segmentWidth = getSegmentWidth(segment.value, towerWidth);
        const segmentX = towerX + (towerWidth - segmentWidth) / 2;
        
        // Aura dorata per il bonus velocità
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(segmentX - 5, y - 5, segmentWidth + 10, scaledHeight + 10);
        
        // Corona di velocità ⚡
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px serif';
        ctx.fillText('⚡', segmentX + segmentWidth + 10, y + scaledHeight/2);
        
        ctx.shadowBlur = 0; // Reset shadow
      }
      
      currentY -= scaledHeight;
    }

    // Disegna la base della torre
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(towerX - 10, baselineY + finalOffset, towerWidth + 20, 20);
    
  }, [segments, cameraOffset, showTowerView]);

  // Setup canvas e resize handler
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial render

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Re-render quando cambiano segmenti o camera
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(render);
  }, [render]);

  // Sincronizza lo stato interno con la prop esterna
  useEffect(() => {
    setShowTowerView(propShowTowerView);
  }, [propShowTowerView]);

  // Funzione per generare PNG (Share)
  const generateShareImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataURL = canvas.toDataURL('image/png');
      
      // Crea un link per il download
      const link = document.createElement('a');
      link.download = `2048-tower-${Date.now()}.png`;
      link.href = dataURL;
      
      // Simula click per il download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Errore nella generazione dell\'immagine:', error);
    }
  }, []);



  return (
    <div className="absolute inset-0 w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full transition-all duration-700 ${
          propShowTowerView ? 'z-20 blur-none opacity-100' : 'z-10 blur-none opacity-60'
        }`}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Controlli UI rimossi - ora gestiti dal pannello principale del gioco */}


    </div>
  );
};

export default TowerApp;
