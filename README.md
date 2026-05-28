# 🎲 METABOARD 3D — Cozy Tycoon Arena

An online 3D board game built with **React**, **Three.js (React Three Fiber)**, and **Tailwind CSS**. Draw inspiration from Indian Business and International Countries Monopoly rules, featuring a gorgeous Neo-Brutalist / Pastel Glassmorphic design system.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## ✨ Features Built So Far

### 🎨 1. Cozy Neo-Brutalist UI
* **Harmonious Palette**: Bright pastel cards, thick black borders, amber tag badges, and cream surfaces.
* **Landing Page & Lobby**: Balanced scrolling menus, name/avatar/color customizer, and game mode selector.
* **Sliding Portfolio Drawer**: Slide out a detailed list of your properties grouped by color, showing mortgage status and house indicators.
* **Tabbed Rules Modal**: Setup guidelines, Rent values, building costs, Jail rules, and a fully styled Chance & Community Chest Card Deck viewer.

### 🧩 2. Premium 3D Board & Performance
* **Upright Text Rotation**: Math counter-rotation rotates all text labels and emojis on the tiles to face the bottom camera, making top, left, and right side titles completely horizontal and readable.
* **Aspect-Ratio Textures**: High-resolution canvases (`512x1024` for sides, `1024x1024` for corners) eliminate horizontal squishing.
* **Cached CanvasTextures**: Canvas contexts are created only once per tile. Updates (such as building houses, changing theme, or mortgaging) write directly to the canvas and set `texture.needsUpdate = true` to avoid GPU bottlenecks and micro-stutters.
* **Studio Environment**: Warm lighting with soft shadows, studio-tinted point lights, and a brutalist inner ring.

### 🎥 3. Smart Camera Controller
* **Cinematic Actions**: Focuses on the center dice while rolling, zooms close-up to follow hopping pawns, pauses for 1 second on the landing tile, and flies back to overview.
* **Orbit Center Settle**: Camera target resets to `[0, 0, 0]` at the end of the turn so that OrbitControls rotates naturally around the board center.
* **Zoom-to-Cursor Freedom**: Moving the mouse over any tile and scrolling immediately targets the camera to that point, letting you inspect any corner or country tile freely.

### ⚙️ 4. Full Monopoly / Indian Business Rules
* **Jail Escapes**: Standard roll, escape cards, or buy freedom for ₹500 / $50. Smart bots intelligently evaluate escaping.
* **Rest House Penalty**: Triggers skips on active player turns. Humans are shown a "Wake Up" banner, and bots wake up automatically with custom log notes.
* **Club House drinks**: Land on it and purchase drinks for all players (pays ₹100 / $100 to all other active players).
* **AI Computer Mode**: Simulated bot engines make decisions (buying properties, building houses, mortgaging, or declaring bankruptcy) based on cash reserves and property groups.
* **Online Multiplayer**: Integrated Supabase real-time lobby creation and connection using room codes.

---

## 🛠️ Project Stack & Installation

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/online-monopoly-board-game.git
cd online-monopoly-board-game
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🗺️ Roadmap (Upcoming Features)

### 🔊 1. Bouncy Sound Effects & Ambient Music
* Bouncy dice roll sound effects, sliding card paper shuffles, cash register registers on salary, and wood-taps for house constructions.
* Cozy, lo-fi background lobby music.

### 🤝 2. Tycoon Trading Panel
* Implement an interactive 2D drawer layout for proposing trades.
* Select properties and cash bids between two tycoons and allow bots to accept/reject offers.

### 🤖 3. Smart Bot Personalities
* Diverse AI playstyles:
  * **Aggressive Builder**: Builds houses immediately, risking low cash.
  * **Strategic Investor**: Prioritizes buying full groups and unmortgaging.
  * **Conservative Tycoon**: Keeps a high cash buffer, avoiding risky purchases.

### 🎭 4. Board Themes & Customizations
* Expand the Lobby theme dropdown to support other aesthetic layouts:
  * **Retro 90s Board**: High-contrast vaporwave neon lights.
  * **Cozy Forest Board**: Wooden tiles and foliage assets.
  * **Classic International**: Traditional Monopoly layout.

### 🛡️ 5. Network Reconnection Sync
* Automatically cache room state on connection drops.
* Implement a "Rejoin Session" popup to resume active online room matches.
