# 2048-TOWER 🏰

Un innovativo gioco 2048 con una torre che cresce con i tuoi progressi! Ogni milestone raggiunto aggiunge un nuovo segmento architettonico alla tua torre personale.

🎮 **[Gioca ora su localhost:5174](http://localhost:5174)** (quando il server dev è attivo)

## 📸 Anteprima del Gioco

```
    🏰 TORRE MEDIEVALE                 🎮 GIOCO 2048
    
        ⭐ 👑 [2048] 👑 ⭐             ┌─────────────────┐
    ════════════════════════════       │  2   4   8  16  │
          🏯 [1024] 🏯                 │ 32  64 128 256  │
      ▢▢▢▢▢ MERLI ▢▢▢▢▢              │512 1024  2  4   │
         📐 [512] 📐                   │  8  16  32  64  │
       ▲▲▲ GOTICA ▲▲▲                 └─────────────────┘
        🏰 [256] 🏰                   
      ◄═══ TORRETTA ═══►              📊 PUNTEGGIO: 15420
         🏛️ [128] 🏛️                   🏆 RECORD: 23890
       ═══ BALCONE ═══                
          🪟 [64] 🪟                   [Vedi Torre] [Share]
       ═══ FINESTRA ═══               
           🚪 [32] 🚪                  Usa ↑↓←→ per muovere
    ▓▓▓▓▓▓▓▓▓ PORTA ▓▓▓▓▓▓▓▓▓         
    ═══════════════════════════        
           BASE TORRE                  
```

## 🎮 Caratteristiche Principali

- **Torre Medievale**: Una torre che cresce dal milestone 32 con forma conica che si restringe verso l'alto
- **Decorazioni Specifiche**: Ogni livello ha decorazioni medievali uniche (porta, finestre, balconi, merlature, corona dorata)
- **Vista Torre**: Controlla la camera per ammirare la tua torre completa
- **Condivisione**: Genera e condividi una PNG della tua torre
- **Design Italiano**: Palette di colori caldi che richiamano i tramonti italiani
- **Controlli Intuitivi**: Usa le frecce della tastiera o i pulsanti sullo schermo
- **Salvataggio Automatico**: Il record viene salvato automaticamente

## 🏗️ Architettura della Torre Medievale

- **32**: **Base con Porta** - Fondamenta con porta d'ingresso ad arco (100% larghezza)
- **64**: **Finestra ad Arco** - Primo piano con finestra romanica (90% larghezza)
- **128**: **Balcone Medievale** - Secondo piano con balcone sporgente (80% larghezza)
- **256**: **Torretta** - Piccola torre difensiva con finestrina (70% larghezza)
- **512**: **Finestra Gotica** - Finestra a punta tipicamente gotica (60% larghezza)
- **1024**: **Merlature** - Piano nobile con merlature defensive (50% larghezza)
- **2048**: **👑 CORONA REGALE** - Corona dorata con bandiere e scritta speciale (120% larghezza)
- **4096+**: **Torre Interna** - Nuova torre più piccola che cresce all'interno della corona

## 🚀 Come Giocare

1. Usa le frecce della tastiera (↑ ↓ ← →) per muovere le tessere
2. Le tessere con lo stesso numero si fondono quando si toccano
3. Ogni volta che raggiungi un nuovo milestone (32+), un nuovo segmento viene aggiunto alla torre
4. Usa "Vedi Torre" per ammirare la tua costruzione
5. Usa "Share Torre" per salvare un'immagine della tua torre
6. Il tuo obiettivo è raggiungere la tessera 2048 e oltre!

## 🛠️ Installazione e Sviluppo

### Prerequisiti
- Node.js (v18 o superiore)
- npm o yarn

### Installazione
```bash
# Clona il repository
git clone https://github.com/tuonome/2048-tower.git
cd 2048-tower

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

### Build per Produzione
```bash
npm run build
```

## 🎨 Tecnologie Utilizzate

- **React 18**: Framework JavaScript moderno
- **TypeScript**: Type safety e migliore esperienza di sviluppo
- **Vite**: Build tool velocissimo
- **Tailwind CSS**: Framework CSS utility-first
- **HTML5 Canvas**: Rendering della torre in tempo reale

## 🏗️ Struttura del Progetto

```
src/
  tower/
    TowerApp.tsx          # Componente principale della torre
    index.ts              # Export del modulo tower
  core/
    game.ts               # Motore di gioco 2048 con eventi
    index.ts              # Export del modulo core
  app/
    App.tsx               # Componente principale che integra gioco e torre
    Game.tsx              # Componente del gioco 2048
    index.ts              # Export del modulo app
```

## 🏛️ Architettura del Sistema

```
                    ┌─────────────────┐
                    │    App.tsx      │
                    │ (Componente     │
                    │  principale)    │
                    └─────────┬───────┘
                              │
                    ┌─────────┴───────┐
                    │                 │
            ┌───────▼─────────┐   ┌───▼─────────────┐
            │ TowerApp.tsx    │   │   Game.tsx      │
            │ (Background)    │   │ (Foreground)    │
            └─────────────────┘   └─────────┬───────┘
                    │                       │
                    │               ┌───────▼─────────┐
                    │               │ Game2048Engine  │
                    │               │ (Motore gioco)  │
                    │               └─────────┬───────┘
                    │                         │
                    │               ┌─────────▼─────────┐
                    │               │     Eventi:       │
                    │               │  • onTileMerged   │
                    │               │  • onGameOver     │
                    │               └─────────┬─────────┘
                    │                         │
                    └─────────────────────────┘
                    │
        ┌───────────▼─────────┐       ┌─────────────────┐
        │  Canvas Rendering   │       │  Controlli UI   │
        │ • Segmenti torre    │       │ • Vedi Torre    │
        │ • Animazioni camera │       │ • Share Torre   │
        │ • Decorazioni       │       │                 │
        └─────────────────────┘       └─────────────────┘

    ┌─────────────────┐              ┌──────────────────┐
    │ Milestone (64+) │─────────────▶│ Nuovo Segmento   │
    │                 │              │ • Stile archi.   │
    │                 │              │ • Palette colori │
    │                 │              │ • Animazione     │
    └─────────────────┘              └──────────────────┘
```

## 🎮 Controlli

### Tastiera
- **Frecce**: Muovi le tessere
- **Spacebar**: Nuovo gioco (quando il gioco è finito)

### Interfaccia
- **Vedi Torre**: Sposta la camera per vedere tutta la torre
- **Torna al gioco**: Riporta la camera al gioco
- **Share Torre**: Genera un'immagine PNG della torre
- **Nuovo Gioco**: Resetta il gioco (mantiene la torre)

## 🔧 Caratteristiche Tecniche

- **Performance**: Rendering ottimizzato con requestAnimationFrame
- **Mobile**: DevicePixelRatio limitato a 2 per prestazioni mobile
- **SSR Ready**: Componenti compatibili con Next.js
- **Responsive**: Layout adattivo per tutti i dispositivi

## 📱 Compatibilità

- ✅ Chrome/Edge (90+)
- ✅ Firefox (90+)
- ✅ Safari (14+)
- ✅ Mobile browsers
- ✅ Tablet

## 🤝 Contribuire

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Pusha il branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🙏 Ringraziamenti

- Ispirato dal gioco originale 2048 di Gabriele Cirulli
- Concetto della torre ispirato dall'architettura italiana
- Design pattern moderni React + TypeScript

---

Fatto con ❤️ in Italia 🇮🇹