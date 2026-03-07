import useStore from './store/store'
import LandingPage from './components/LandingPage'
import LoadingScreen from './components/LoadingScreen'
import CityScene from './scene/CityScene'
import HUD from './components/HUD'
import GarageScreen from './components/GarageScreen'

function App() {
  const gamePhase = useStore((s) => s.gamePhase)

  return (
    <>
      {gamePhase === 'landing' && <LandingPage />}
      {gamePhase === 'loading' && <LoadingScreen />}
      {(gamePhase === 'intro' || gamePhase === 'playing') && (
        <>
          <CityScene />
          <HUD />
        </>
      )}
      {gamePhase === 'garage' && <GarageScreen />}
    </>
  )
}

export default App
