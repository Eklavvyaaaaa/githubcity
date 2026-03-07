import { useState, useCallback } from 'react'
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
    const repos = useStore((s) => s.repos)
    const contributions = useStore((s) => s.contributions)
    const userData = useStore((s) => s.userData)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const reset = useStore((s) => s.reset)
    const [showStats, setShowStats] = useState(false)
    const [shareStatus, setShareStatus] = useState('')

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0)
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))]

    const handleShare = useCallback(async () => {
        const canvas = document.querySelector('#city-canvas-container canvas')
        if (!canvas) return

        // Capture screenshot
        const dataUrl = canvas.toDataURL('image/png')

        // Try native share first
        if (navigator.share && navigator.canShare) {
            try {
                const blob = await (await fetch(dataUrl)).blob()
                const file = new File([blob], `${username}-github-city.png`, { type: 'image/png' })
                await navigator.share({
                    title: `${username}'s GitHub City`,
                    text: `Check out my GitHub profile as a 3D city! 🏙️ ${repos.length} repos, ${contributions} contributions, driving a ${CAR_TIER_NAMES[carTier]}!`,
                    files: [file],
                })
                setShareStatus('Shared!')
            } catch (e) {
                if (e.name !== 'AbortError') fallbackCopy(dataUrl)
            }
        } else {
            fallbackCopy(dataUrl)
        }

        setTimeout(() => setShareStatus(''), 2000)
    }, [username, repos, contributions, carTier])

    const fallbackCopy = async (dataUrl) => {
        // Copy share text to clipboard
        const text = `🏙️ ${username}'s GitHub City\n\n📦 ${repos.length} repos | ⭐ ${totalStars} stars | 🔥 ${contributions} contributions\n🚗 Driving a ${CAR_TIER_NAMES[carTier]}\n\nBuild yours at: ${window.location.origin}`
        try {
            await navigator.clipboard.writeText(text)
            setShareStatus('Copied!')
        } catch {
            setShareStatus('Screenshot ready!')
        }

        // Also trigger download of screenshot
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${username}-github-city.png`
        a.click()
    }

    const handleScreenshot = useCallback(() => {
        const canvas = document.querySelector('#city-canvas-container canvas')
        if (!canvas) return
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `${username}-github-city.png`
        a.click()
        setShareStatus('📸 Saved!')
        setTimeout(() => setShareStatus(''), 2000)
    }, [username])

    if (gamePhase !== 'playing') return null

    return (
        <div className="hud">
            {/* Top bar */}
            <div className="hud-top glass">
                <div className="hud-left-info">
                    <div className="hud-city-name">{cityName}</div>
                    <div className="hud-username">@{username}</div>
                </div>
                <div className="hud-actions">
                    <button className="hud-action-btn" onClick={handleScreenshot} title="Screenshot">
                        📸
                    </button>
                    <button className="hud-action-btn" onClick={handleShare} title="Share">
                        {shareStatus || '🔗'}
                    </button>
                    <button className="hud-action-btn" onClick={() => setShowStats(!showStats)} title="City Stats">
                        📊
                    </button>
                    <button className="hud-action-btn hud-home-btn" onClick={reset} title="Back to Home">
                        🏠
                    </button>
                </div>
            </div>

            {/* City Stats Panel */}
            {showStats && (
                <div className="city-stats glass-strong animate-fade-in">
                    <h3 className="stats-title">📊 City Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-value">{repos.length}</span>
                            <span className="stat-label">Buildings</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{totalStars.toLocaleString()}</span>
                            <span className="stat-label">Stars</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{totalForks.toLocaleString()}</span>
                            <span className="stat-label">Forks</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{contributions.toLocaleString()}</span>
                            <span className="stat-label">Contributions</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{languages.length}</span>
                            <span className="stat-label">Districts</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{userData?.followers?.toLocaleString() || 0}</span>
                            <span className="stat-label">Followers</span>
                        </div>
                    </div>
                    <div className="stats-languages">
                        {languages.slice(0, 8).map(lang => (
                            <span key={lang} className="lang-badge">{lang}</span>
                        ))}
                    </div>
                </div>
            )}

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
