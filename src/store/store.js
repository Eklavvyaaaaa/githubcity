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
  }),
}))

export default useStore
