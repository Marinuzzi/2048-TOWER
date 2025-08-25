# 🚀 Guida al Deployment su Vercel

## Passo 1: Preparazione del Repository GitHub

1. **Crea un nuovo repository** su GitHub chiamato `2048-C`

2. **Clona il repository** localmente:
   ```bash
   git clone https://github.com/TUO-USERNAME/2048-C.git
   cd 2048-C
   ```

3. **Copia tutti i file** del progetto nella cartella, mantenendo questa struttura:
   ```
   2048-C/
   ├── src/
   │   ├── Game2048.jsx
   │   ├── main.jsx
   │   └── index.css
   ├── public/
   │   └── favicon.svg
   ├── .gitignore
   ├── index.html
   ├── package.json
   ├── vite.config.js
   ├── tailwind.config.js
   ├── postcss.config.js
   └── README.md
   ```

4. **Commit e push** tutti i file:
   ```bash
   git add .
   git commit -m "Initial commit: 2048 game with React and Tailwind"
   git push origin main
   ```

## Passo 2: Deploy su Vercel

### Metodo A: Deploy Automatico (Consigliato)

1. Vai su [vercel.com](https://vercel.com) e accedi con GitHub

2. Clicca su **"New Project"**

3. **Seleziona** il repository `2048-C`

4. **Configurazione automatica**:
   - Vercel rileverà automaticamente che è un progetto Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Clicca **"Deploy"** 🚀

6. **Ottieni il link**: Una volta completato, avrai un URL come:
   ```
   https://2048-c.vercel.app
   ```

### Metodo B: Deploy da CLI

1. **Installa Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Accedi a Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy il progetto**:
   ```bash
   vercel --prod
   ```

## Passo 3: Configurazioni Opzionali

### Domain Personalizzato
1. Nel dashboard Vercel, vai alle **Settings** del progetto
2. Sezione **Domains**
3. Aggiungi il tuo dominio personalizzato

### Variabili d'Ambiente
Se dovessi aggiungere variabili d'ambiente in futuro:
1. **Settings** → **Environment Variables**
2. Aggiungi le variabili necessarie

## 📋 Checklist Post-Deploy

- [ ] Il sito è accessibile all'URL fornito da Vercel
- [ ] Il gioco si carica correttamente
- [ ] I controlli (tastiera/touch) funzionano
- [ ] Le animazioni e i gradienti appaiono correttamente
- [ ] Il design è responsive su mobile
- [ ] Il favicon appare nel browser

## 🔄 Aggiornamenti Futuri

Ogni volta che pushes modifiche su GitHub:
1. Vercel **rebuildera automaticamente** il sito
2. Le modifiche saranno live in **pochi minuti**
3. Riceverai notifiche via email sui deploy

## 🛠️ Troubleshooting

**Problema**: Build fallisce
- **Soluzione**: Controlla i log di build su Vercel e verifica che tutte le dipendenze siano nel `package.json`

**Problema**: Stili non caricano
- **Soluzione**: Verifica che `tailwind.config.js` e `postcss.config.js` siano presenti

**Problema**: 404 su refresh
- **Soluzione**: Vercel gestisce automaticamente le SPA, dovrebbe funzionare out-of-the-box

## 🎉 Complimenti!

Il tuo gioco 2048 è ora live e accessibile a tutto il mondo! 

Condividi il link con amici e famiglia per far provare il tuo bellissimo gioco! 🎮