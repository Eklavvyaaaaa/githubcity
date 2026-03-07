# 🏙️ GitHub City

**Your GitHub profile as a 3D city you can drive through.**

GitHub City transforms any GitHub profile into a fully explorable 3D city. Repositories become buildings, contributions determine your car, and your coding activity shapes the world.

## ✨ Features

- **Repos → Buildings** — Each repository becomes a building. More stars and forks = taller buildings
- **Language Districts** — Buildings grouped by programming language, each with unique colors
- **6 Car Tiers** — From Rusty Jalopy (0 contributions) to Hypercar (2000+)
- **WASD Driving** — Drive through your city with smooth third-person camera
- **Day/Night Cycle** — Real-time sky changes based on actual time
- **Weather System** — Active devs get clear skies, inactive devs get fog and rain
- **Achievement Billboards** — Discover your GitHub milestones scattered throughout the city
- **Landmark Buildings** — Top-starred repos become towering monuments
- **Garage Screen** — See your car tier and what's needed to upgrade

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Eklavvyaaaaa/githubcity.git
cd githubcity

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter any GitHub username!

## 🔑 GitHub Token (Optional)

Without a token, you get 60 API requests/hour. For heavy use:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Create a token (no scopes needed for public data)
3. Paste it in the "Add GitHub token" field on the landing page

## 🏗️ Tech Stack

- **Three.js** + **React Three Fiber** — 3D rendering
- **Vite** — Build tool
- **Zustand** — State management
- **Procedural geometry** — All assets generated in code (no external 3D files)

## 📦 Project Structure

```
src/
├── car/           # Car models & driving controller
├── city/          # City generation engine & districts
├── components/    # UI (Landing, HUD, Garage, Loading)
├── scene/         # 3D scene (CityScene, buildings, roads)
├── services/      # GitHub API
├── store/         # Zustand state
└── styles/        # Global CSS
```

## 📄 License

MIT
