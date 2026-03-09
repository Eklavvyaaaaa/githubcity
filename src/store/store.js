import { create } from 'zustand'

const useStore = create((set, get) => ({
  // Game phase: 'landing' | 'loading' | 'intro' | 'playing' | 'garage' | 'compare'
  gamePhase: 'landing',
  setGamePhase: (phase) => set({ gamePhase: phase }),

  // User data
  username: '',
  setUsername: (username) => set({ username }),

  userData: null,
  setUserData: (userData) => set({ userData }),

  repos: [],
  setRepos: (repos) => set({ repos }),

  contributions: 0,
  setContributions: (contributions) => set({ contributions }),

  // City data (generated from GitHub data)
  cityData: null,
  setCityData: (cityData) => set({ cityData }),

  cityName: '',
  setCityName: (cityName) => set({ cityName }),

  // Car state
  carTier: 0,
  setCarTier: (carTier) => set({ carTier }),

  carSpeed: 0,
  setCarSpeed: (carSpeed) => set({ carSpeed }),

  // Current location in the city
  currentDistrict: '',
  setCurrentDistrict: (d) => set({ currentDistrict: d }),
  nearbyBuilding: null,
  setNearbyBuilding: (b) => set({ nearbyBuilding: b }),

  // Phase 8: Interactive Repo Panel
  activeRepo: null,
  setActiveRepo: (repo) => set({ activeRepo: repo }),
  showRepoPanel: false,
  setShowRepoPanel: (show) => set({ showRepoPanel: show }),

  // Skyline Camera
  isSkylineView: false,
  setIsSkylineView: (val) => set({ isSkylineView: val }),

  // Time Travel Timeline
  timelineDayOffset: 0, // 0 = today, -365 = 1 year ago
  setTimelineDayOffset: (offset) => set({ timelineDayOffset: offset }),

  // Atmosphere
  weather: 'clear', // 'clear' | 'cloudy' | 'rainy' | 'foggy'
  setWeather: (weather) => set({ weather }),

  // Loading messages
  loadingMessage: '',
  setLoadingMessage: (msg) => set({ loadingMessage: msg }),
  loadingProgress: 0,
  setLoadingProgress: (p) => set({ loadingProgress: p }),

  // Compare mode
  compareUsername: '',
  setCompareUsername: (u) => set({ compareUsername: u }),

  // Token (optional)
  githubToken: '',
  setGithubToken: (token) => set({ githubToken: token }),

  // Dynamic Biome (based on top language)
  biomeColor: { ground: '#2b3a32', sky: '#070714', fog: '#070714' },
  setBiomeColor: (biomeColor) => set({ biomeColor }),

  // Coin Collection Mini-Game
  coinsCollected: 0,
  totalCoins: 0,
  collectedCoinIds: new Set(),
  collectCoin: (id) => {
    const s = get()
    if (s.collectedCoinIds.has(id)) return
    const newSet = new Set(s.collectedCoinIds)
    newSet.add(id)
    set({ collectedCoinIds: newSet, coinsCollected: s.coinsCollected + 1 })
  },
  setTotalCoins: (n) => set({ totalCoins: n }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Reset
  reset: () => set({
    gamePhase: 'landing',
    username: '',
    userData: null,
    repos: [],
    contributions: 0,
    cityData: null,
    cityName: '',
    carTier: 0,
    carSpeed: 0,
    weather: 'clear',
    loadingMessage: '',
    loadingProgress: 0,
    error: null,
    biomeColor: { ground: '#2b3a32', sky: '#070714', fog: '#070714' },
    coinsCollected: 0,
    totalCoins: 0,
    collectedCoinIds: new Set(),
    activeRepo: null,
    showRepoPanel: false,
  }),
}))

export default useStore
