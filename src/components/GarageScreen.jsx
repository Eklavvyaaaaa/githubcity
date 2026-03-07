import useStore from '../store/store'
import { playUIClick } from '../services/audio'
import './GarageScreen.css'

const CAR_TIERS = [
    { name: 'Rusty Jalopy', minContribs: 0, color: '#8B7355', desc: 'Slow and beaten up. Every legend starts somewhere.' },
    { name: 'Family Sedan', minContribs: 50, color: '#5B8DEF', desc: 'Reliable and steady. Making progress!' },
    { name: 'Sports Coupe', minContribs: 200, color: '#FF6B6B', desc: 'Turning heads. Your commits are paying off.' },
    { name: 'Muscle Car', minContribs: 500, color: '#FFA726', desc: 'Raw power. The open source community knows your name.' },
    { name: 'Supercar', minContribs: 1000, color: '#AB47BC', desc: 'Elite performance. Top tier developer.' },
    { name: 'Hypercar', minContribs: 2000, color: '#00E676', desc: 'The ultimate machine. A GitHub legend.' },
]

function GarageScreen() {
    const carTier = useStore((s) => s.carTier)
    const setCarTier = useStore((s) => s.setCarTier)
    const contributions = useStore((s) => s.contributions)
    const setGamePhase = useStore((s) => s.setGamePhase)

    // The max tier unlocked based on contributions
    const maxUnlockedTier = CAR_TIERS.reduce((max, tier, i) => {
        return contributions >= tier.minContribs ? i : max
    }, 0)

    const handleSelect = (tierIndex) => {
        if (tierIndex <= maxUnlockedTier) {
            playUIClick()
            setCarTier(tierIndex)
        }
    }

    return (
        <div className="garage-overlay">
            <div className="garage-panel glass-strong">
                <h2 className="garage-title">YOUR GARAGE</h2>
                <p className="garage-contribs">{contributions.toLocaleString()} CONTRIBUTIONS THIS YEAR</p>

                <div className="garage-tiers">
                    {CAR_TIERS.map((tier, i) => {
                        const unlocked = i <= maxUnlockedTier
                        const selected = i === carTier
                        return (
                            <div
                                key={tier.name}
                                className={`garage-tier ${unlocked ? 'unlocked' : 'locked'} ${selected ? 'current' : ''}`}
                                onClick={() => handleSelect(i)}
                                style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
                            >
                                <div className="tier-indicator" style={{ background: unlocked ? tier.color : 'rgba(255,255,255,0.1)' }} />
                                <div className="tier-info">
                                    <div className="tier-name">{tier.name}</div>
                                    <div className="tier-desc">{tier.desc}</div>
                                    <div className="tier-req">{tier.minContribs}+ contributions</div>
                                </div>
                                {selected && <span className="tier-badge">EQUIPPED</span>}
                                {unlocked && !selected && <span className="tier-badge tier-badge-select">SELECT</span>}
                                {!unlocked && <span className="tier-lock">🔒</span>}
                            </div>
                        )
                    })}
                </div>

                <button className="garage-close-btn" onClick={() => { playUIClick(); setGamePhase('playing') }}>
                    BACK TO CITY
                </button>
            </div>
        </div>
    )
}

export default GarageScreen
