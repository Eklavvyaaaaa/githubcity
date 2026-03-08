# 🏙️ Gitscape

**Explore your GitHub profile as a living, 3D low-poly city.**

Gitscape transforms any GitHub profile into a procedurally generated 3D world. Every repository is a building, every contribution fuels your car, and every language forms a unique district. 

---

## ✨ Features (Phases 1-8)

### 🏗️ World Generation
- **Repos → Buildings**: Each repository is a unique building. Height and size are driven by stars, forks, and codebase size.
- **Language Biomes**: The city is divided into districts based on programming languages (JS, Python, Rust, etc.). Each biome has a unique color palette for the ground, sky, and atmosphere.
- **Ambient Life**: Drifting low-poly clouds and glowing traffic light trails make the city feel like a bustling metropolis.

### 🚗 Driving & Kinetics
- **6 Car Tiers**: Unlock faster and more advanced cars based on your total contributions — from the "Rusty Jalopy" to the "Hypercar".
- **Arcade Physics**: Smooth WASD driving with a dedicated physics-based jump mechanic (**Spacebar**).
- **Procedural Engine Audio**: A custom engine sound synthesizer that reacts to your speed, plus tire screeching and landing thuds.

### 🗺️ Navigation & Interaction
- **HUD Minimap**: A real-time 2D radar in the HUD showing roads, buildings, collected coins, and your position.
- **Interactive Repo Panels**: Drive up to any building and press **[E]** to see a detailed slide-out panel with the repo's full stats, description, and creation dates.
- **Proximity Tooltips**: Seamless 2D overlays that pop up to identify buildings as you drive past them.

### 🎮 Gameplay & Social
- **Commit Coins Mini-Game**: Collect glowing 3D GitHub coins floating above your most active repositories to increase your score.
- **Compare Mode**: Enter two usernames to generate two cities side-by-side in a cinematic split-screen view.
- **Capture & Share**: Built-in screenshot tool and native Web Share integration to show off your city.
- **Cinematic Intro**: A dynamic flythrough camera sequence that tours your city upon loading.

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| **W / A / S / D** | Drive & Steer |
| **Spacebar** | Jump / Hop |
| **E** | View Repo Details (When Near) |
| **ESC** | Close Panels / Exit |
| **Mouse** | Orbit Camera (In Garage/Compare) |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Eklavvyaaaaa/gitscape.git
cd gitscape

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your GitHub username!

---

## 🏗️ Technical Highlights

- **React Three Fiber & Three.js**: Core 3D engine.
- **Instanced Mesh Rendering**: Highly optimized — thousands of windows, trees, and coins rendered in just a few draw calls.
- **Web Audio API**: 100% procedural sound design. No heavy MP3/WAV files.
- **Zustand**: Fast, reactive global state management.
- **Spatial Hash Collisions**: O(1) collision detection for smooth driving even in dense cities.

---

## 📄 License

MIT — Feel free to fork and build your own districts!
