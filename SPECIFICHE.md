Qui ci sono le specifiche di una versioen TOWER del gioco 2048 che vanno recepite ed implementate.
README — 2048 !Tower Integration Guide

This document explains how to integrate the !Tower background mode into an existing 2048 game. It covers environment setup, file structure, integration points, build commands, QA, and troubleshooting.

Assumptions
	•	Your 2048 base is a web app built with React + TypeScript (Vite or Next.js).
	•	The !Tower module is provided as a single React component (see: 2048 Tower — Prototype (background Tower + Milestone Flags)).
	•	You already emit an event when tiles merge (e.g., onTileMerged(value:number)).

⸻

1) Setup

1.1 Recommended environment
	•	Node: v18+
	•	Package manager: npm v9+ (or pnpm/yarn)
	•	Bundler: Vite 5+ or Next.js 14+

1.2 Create a sandbox (if needed)

# Vite + React + TS
npm create vite@latest 2048-tower -- --template react-ts
cd 2048-tower
npm install
npm run dev

1.3 Optional styling

The prototype uses a few utility classes (e.g., w-screen h-screen). Must use Tailwind, and must have color e style found in https://2048-c.vercel.app or already present here!


html, body, #root { height: 100%; }
body { margin: 0; background: #f8f3ea; }
.w-screen { width: 100vw; } .h-screen { height: 100vh; }
.overflow-hidden { overflow: hidden; }
.relative { position: relative; }
.absolute { position: absolute; }
.inset-0 { top:0; left:0; right:0; bottom:0; }
.z-10 { z-index:10; } .z-20 { z-index:20; } .z-30 { z-index:30; }
.select-none { user-select:none; }



⸻

2) Files & Structure

Minimal structure to drop in the !Tower component:

src/
  tower/
    TowerApp.tsx          # the !Tower component (from the provided textdoc)
    index.ts              # optional re-exports
  core/
    game.ts               # your 2048 engine (emits onTileMerged, onGameOver)
  app/
    App.tsx               # compose core board + tower

src/tower/TowerApp.tsx should contain the component from the textdoc as is.

⸻

3) Integration Points

3.1 Mounting the Tower

Mount the !Tower layer behind the board. You can:
	•	Place the tower component as a sibling absolutely positioned behind the board container, or
	•	Render two <canvas> (tower back / board front) as done in the prototype, leaving your interactive tiles on the front layer.

Example (simplified):

export function GameScene() {
  return (
    <div className="relative w-screen h-screen">
      {/* Tower layer */}
      <TowerApp />
      {/* Your existing board on top */}
      <Board />
    </div>
  );
}

3.2 Events from the core engine

Hook the tower to merge events and game over:

// core/game.ts
export interface GameEvents {
  onTileMerged?: (value: number) => void;
  onGameOver?: (finalScore: number, maxTile: number) => void;
}

In React, pass callbacks or use a shared event bus/context. The tower only needs to know when a milestone is reached (64,128,256,512,1024,2048,4096).

3.3 Undo behavior (decided)
	•	Segments remain even if the user uses Undo after unlocking a milestone.

⸻

4) no API but all compact
⸻

5) Behavior & UX
	•	The board size never changes.
	•	When a milestone is unlocked, a new segment is added to the tower, the camera scrolls slightly upward (≈ 18% of segment height), with a subtle animation.
	•	Vedi Torre: smoothly scrolls the camera to show the top around 22% from the top of viewport.
	•	Torna al gioco: brings camera back to baseline.
	•	Share button: creates a PNG (client-side canvas) with the full tower.
 

⸻

6) Performance Guidelines
	•	Clamp devicePixelRatio to ≤ 2 for mobile performance.
	•	Redraw on demand only: on animation frames, window resize, or when segments change.
	•	Cache heavy decorations (e.g., rosone and cupola) to OffscreenCanvas (optional).
	•	Keep particle effects minimal (< 14 particles, < 600ms), or behind a feature flag.

⸻

7) Next.js / SSR Notes
	•	The component has SSR guards. On Next.js, ensure the tower only accesses window in effects.
	•	If you import it in a server component, wrap it in a client component ("use client").

⸻

8) Build & Run

8.1 Vite

npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build

8.2 Next.js

npm run dev
npm run build
npm start


⸻

9) QA Checklist (Acceptance)
	•	Board stays at constant size; tower behind; no input captured by the tower canvas.
	•	Each milestone (64→4096) adds a segment with the correct decor and palette.
	•	Latest segment is slightly wider (emphasis), taper is applied to others.
	•	Camera increments ~-0.18 * segmentHeight per run milestone (±0.03 range).
	•	Vedi Torre frames the top at 22% of viewport (±2%).
	•	Share creates PNG ≤ 1.5 MB with tower and latest milestone flag.
	•	Undo after milestone does not remove segments.
	•	60 fps on a mid-tier device; no major GC spikes.

⸻

10) Troubleshooting
	•	Black/empty canvas: ensure canvases get a non-zero width/height after mount; check SSR guards.
	•	Board appears behind tower: verify z-index (board/front should be higher than tower/back).
	•	Blurry rendering: confirm DPR scaling and setTransform(dpr,0,0,dpr,0,0).
	•	Huge memory use: reduce DPR clamp to 1.5; shorten particle durations; avoid large offscreen canvases.
	•	PNG not downloading (Share): browsers may block auto-download. Consider showing a preview with a “Download” button inside a user gesture.

⸻

11) Extensibility / Feature Flags
	•	TOWER_TOP_TARGET_RATIO (default 0.22) — make it configurable for A/B (0.18 / 0.25).
	•	ENABLE_GLOW_1024_PLUS (default true) — toggle subtle glow.
	•	ENABLE_PARTICLES (default true) — reduce for low-end devices.
	•	Skins: map milestone → palette + decor set (romanico, gotico, cyberpunk, lego…).

⸻

12) Security & Privacy
	•	The Share feature generates images client-side; nothing is uploaded by default.
	•	If you later add server-side sharing, comply with GDPR: ask consent, avoid storing raw gameplay without permission.

⸻

13) Minimal Test Cases

Unit
	•	pickPalette(label) returns a tuple of 2 hex colors for known milestones; falls back to default for unknown.
	•	makeSegment(label) (if extracted) clamps height as specified and sets label correctly.
	•	Camera target formula: with H=1000, baseline=H*0.82, total=300, desiredTop=H*0.22, computed targetOffset equals desiredTop - baseline + total.

Integration
	•	Sequence 32→64→128 adds two segments with correct decor and taper.
	•	Double milestone in same move adds segments in order without visual flicker.
	•	Resize during camera animation preserves layout (no warp/jump).

⸻

14) License & Credits
	•	Base 2048 mechanics per rispettive licenze del vostro progetto.
	•	!Tower visuals and code © Your Team, 2025.
	•	Credits for SFX (if included) must be listed in public/credits.txt.

⸻

15) Handoff Notes
	•	Deliver this README, the !Tower component file, and the Spec v1.1 document.
	•	Create a short Loom or GIF capturing: add 64→4096, Vedi Torre, Share.

Done. Hand this pack to your developer and you’re set to build 2048 !Tower. 🚀