import { lazy, Suspense, Component } from 'react'
import useStore from './store/store'
import LandingPage from './components/LandingPage'
import LoadingScreen from './components/LoadingScreen'
import GarageScreen from './components/GarageScreen'

// Lazy load heavy 3D components
const CityScene = lazy(() => import('./scene/CityScene'))
const HUD = lazy(() => import('./components/HUD'))

// Simple fallback while CityScene chunk loads (NOT the full LoadingScreen which re-triggers API calls)
function SceneLoader() {
  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a1a', color: '#a29bfe',
      fontFamily: "'Orbitron', sans-serif", fontSize: '18px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, margin: '0 auto 16px',
          border: '3px solid rgba(108,92,231,0.2)',
          borderTopColor: '#6c5ce7', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        Entering city...
      </div>
    </div>
  )
}

// Error boundary to catch CityScene crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('CityScene Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%', height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0a1a', color: '#e8e8f0',
          fontFamily: "'Inter', sans-serif",
          flexDirection: 'column', gap: '16px',
        }}>
          <div style={{ fontSize: '48px' }}>😵</div>
          <h2 style={{ color: '#ff5252' }}>City crashed!</h2>
          <p style={{ color: '#8888aa', maxWidth: '400px', textAlign: 'center' }}>
            {this.state.error?.message || 'Something went wrong rendering the 3D city.'}
          </p>
          <button
            onClick={() => {
              useStore.getState().setGamePhase('landing')
              useStore.getState().setError('City rendering failed. Try again.')
              this.setState({ hasError: false, error: null })
            }}
            style={{
              padding: '12px 24px', background: '#6c5ce7', color: '#fff',
              border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
            }}
          >
            Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const gamePhase = useStore((s) => s.gamePhase)

  return (
    <>
      {gamePhase === 'landing' && <LandingPage />}
      {gamePhase === 'loading' && <LoadingScreen />}
      {['intro', 'playing', 'garage'].includes(gamePhase) && (
        <ErrorBoundary>
          <Suspense fallback={<SceneLoader />}>
            <CityScene />
            <HUD />
          </Suspense>
        </ErrorBoundary>
      )}
      {gamePhase === 'garage' && <GarageScreen />}
    </>
  )
}

export default App
