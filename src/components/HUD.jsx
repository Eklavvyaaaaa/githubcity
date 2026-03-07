import useStore from '../store/store'
import './HUD.css'

const CAR_TIER_NAMES = [
    'Rusty Jalopy',
    'Family Sedan',
    'Sports Coupe',
    'Muscle Car',
    'Supercar',
    'Hypercar',
]

function HUD() {
    const gamePhase = useStore((s) => s.gamePhase)
    const carTier = useStore((s) => s.carTier)
    const carSpeed = useStore((s) => s.carSpeed)
    const cityName = useStore((s) => s.cityName)
    const username = useStore((s) => s.username)
    const setGamePhase = useStore((s) => s.setGamePhase)

    if (gamePhase !== 'playing') return null

    return (
        <div className="hud">
            {/* Top bar */}
            <div className="hud-top glass">
                <div className="hud-city-name">{cityName}</div>
                <div className="hud-username">@{username}</div>
            </div>

            {/* Speed & car info */}
            <div className="hud-bottom-left glass">
                <div className="hud-speed">
                    <span className="speed-value">{Math.round(carSpeed)}</span>
                    <span className="speed-unit">km/h</span>
                </div>
                <div className="hud-car-tier">{CAR_TIER_NAMES[carTier] || 'Rusty Jalopy'}</div>
            </div>

            {/* Controls hint */}
            <div className="hud-bottom-right glass">
                <div className="hud-controls">
                    <span className="key">W</span><span className="key">A</span><span className="key">S</span><span className="key">D</span>
                    <span className="controls-label">to drive</span>
                </div>
                <button className="hud-garage-btn" onClick={() => setGamePhase('garage')}>
                    🏎️ Garage
                </button>
            </div>
        </div>
    )
}

export default HUD
