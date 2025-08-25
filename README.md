# 🏰 2048-TOWER

Un bellissimo gioco 2048 con **torre dinamica** che cresce automaticamente con i milestone raggiunti! 

## ✨ Caratteristiche

- 🎮 **Gioco 2048 classico** con palette di colori rossi e gialli
- 🏰 **Torre dinamica** che si costruisce automaticamente
- ⚡ **Sistema di milestone** che aggiunge livelli alla torre (32, 64, 128, 256, 512, 1024, 2048...)
- 🐰 **Bonus velocità** per espansione griglia e pulizia
- 🎯 **Vista torre** per ammirare la tua creazione
- 📤 **Condivisione** della torre creata

## 🚀 Come giocare

🎮 **[Gioca ora su localhost:5174](http://localhost:5174)** (quando il server dev è attivo)

## 🛠️ Sviluppo

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
```

## 🏗️ Tecnologie

- **React 18** + **TypeScript**
- **Vite** per il build
- **Tailwind CSS** per lo styling
- **Canvas API** per il rendering della torre

## 📁 Struttura del progetto

```
src/
├── app/          # Componenti principali (Game, App)
├── core/         # Motore di gioco 2048
├── tower/        # Sistema di rendering della torre
└── index.css     # Stili globali
```

## 🎯 Milestone della torre

La torre si costruisce automaticamente quando raggiungi questi valori:
- **32** - Base con porta gotica
- **64** - Finestre ad arco
- **128** - Balcone medievale  
- **256** - Torretta con stemmi
- **512** - Finestre gotiche microscopiche
- **1024** - Merlature
- **2048** - Corona regale
- **4096** - Torre interna
- **8192** - Guglia finale

## 🏆 Vittoria

Quando vinci, la torre si mostra automaticamente nella sua bellezza! ✨

---

**Creato da Francesco Marinuzzi, Ph.D.** 🎓

[🏗️ Repository GitHub](https://github.com/Marinuzzi/2048-TOWER)