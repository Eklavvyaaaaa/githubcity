import { useState, useCallback, useEffect } from 'react'
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
    const currentDistrict = useStore((s) => s.currentDistrict)
    const nearbyBuilding = useStore((s) => s.nearbyBuilding)
    const username = useStore((s) => s.username)
    const repos = useStore((s) => s.repos)
    const contributions = useStore((s) => s.contributions)

    const setGamePhase = useStore((s) => s.setGamePhase)
    const reset = useStore((s) => s.reset)

    const [shareStatus, setShareStatus] = useState('')

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

    const fallbackCopy = async (dataUrl, text) => {
        try {
            await navigator.clipboard.writeText(text)
            setShareStatus('COPIED!')
        } catch {
            setShareStatus('SAVED!')
        }

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${username}-github-city.png`
        a.click()
    }

    const handleShare = useCallback(async () => {
        const canvas = document.querySelector('#city-canvas-container canvas')
        if (!canvas) return

        const dataUrl = canvas.toDataURL('image/png')
        const shareText = `🏙️ ${username}'s GitHub City\n\n📦 ${repos.length} repos | ⭐ ${totalStars} stars | 🔥 ${contributions} contributions\n🚗 Driving a ${CAR_TIER_NAMES[carTier]}\n\nBuild yours at: ${window.location.origin}`

        if (navigator.share && navigator.canShare) {
            try {
                const blob = await (await fetch(dataUrl)).blob()
                const file = new File([blob], `${username}-github-city.png`, { type: 'image/png' })
                await navigator.share({
                    title: `${username}'s GitHub City`,
                    text: `Check out my GitHub profile as a 3D city! 🏙️ ${repos.length} repos, ${contributions} contributions, driving a ${CAR_TIER_NAMES[carTier]}!`,
                    files: [file],
                })
                setShareStatus('SHARED!')
            } catch (e) {
                if (e.name !== 'AbortError') fallbackCopy(dataUrl, shareText)
            }
        } else {
            fallbackCopy(dataUrl, shareText)
        }

        setTimeout(() => setShareStatus(''), 2000)
    }, [username, repos, contributions, carTier, totalStars])

    const handleScreenshot = useCallback(() => {
        const canvas = document.querySelector('#city-canvas-container canvas')
        if (!canvas) return
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `${username}-github-city.png`
        a.click()
        setShareStatus('SAVED!')
        setTimeout(() => setShareStatus(''), 2000)
    }, [username])

    if (gamePhase !== 'playing') return null

    return (
        <div className="hud">

            {/* Controls Hint Overlay (Fades out automatically) */}
            <div className="hud-controls-hint">
                <span className="key">W</span><span className="key">A</span><span className="key">S</span><span className="key">D</span>
                <span className="controls-label">TO DRIVE</span>
            </div>

            {/* 2D Building Tooltip */}
            <div className={`building-tooltip-overlay ${nearbyBuilding ? '' : 'hidden'}`}>
                <div className="building-name">{nearbyBuilding?.name || 'Unknown Repo'}</div>
                <div className="building-stats">
                    <span>⭐ {nearbyBuilding?.stars || 0}</span>
                    <span>{nearbyBuilding?.language || 'Markdown'}</span>
                </div>
            </div>

            {/* Single Bottom Bar PolyTrack Style */}
            <div className="hud-bottom-bar">

                <div className="hud-section-left">
                    <span className="hud-progress-icon">🏁</span>
                    <div className="hud-district-info">
                        <div className="hud-district-name">{currentDistrict || 'Loading Area...'}</div>
                        <div className="hud-repo-count">{repos.length} BUILDINGS PLACED</div>
                    </div>
                </div>

                <div className="hud-section-center">
                    <div className="hud-username">@{username}</div>
                    <div className="hud-car-tier">DRIVING: {CAR_TIER_NAMES[carTier] || 'CAR'}</div>
                </div>

                <div className="hud-section-right">
                    <div className="hud-speed">
                        <span className="speed-value">{Math.round(carSpeed)}</span>
                        <span className="speed-unit">KM/H</span>
                    </div>

                    <div className="hud-actions">
                        <button className="hud-btn" onClick={() => setGamePhase('garage')}>GARAGE</button>
                        <button className="hud-btn" onClick={handleScreenshot} title="Screenshot">📸</button>
                        <button className="hud-btn hud-btn-primary" onClick={handleShare}>
                            {shareStatus || 'SHARE'}
                        </button>
                        <button className="hud-btn" onClick={reset} title="Exit">EXIT</button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default HUD
