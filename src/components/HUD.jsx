import { useState, useCallback, useEffect, useMemo } from 'react'
import useStore from '../store/store'
import { playUIClick } from '../services/audio'
import Minimap from './Minimap'
import RepoInfoPanel from './RepoInfoPanel'
import ProfilePage from './ProfilePage'
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
    const coinsCollected = useStore((s) => s.coinsCollected)
    const totalCoins = useStore((s) => s.totalCoins)
    const showRepoPanel = useStore((s) => s.showRepoPanel)
    const setShowRepoPanel = useStore((s) => s.setShowRepoPanel)
    const setActiveRepo = useStore((s) => s.setActiveRepo)
    const activeRepo = useStore((s) => s.activeRepo)
    const isSkylineView = useStore((s) => s.isSkylineView)
    const setIsSkylineView = useStore((s) => s.setIsSkylineView)
    const timelineDayOffset = useStore((s) => s.timelineDayOffset)
    const showProfilePage = useStore((s) => s.showProfilePage)
    const setShowProfilePage = useStore((s) => s.setShowProfilePage)

    const setGamePhase = useStore((s) => s.setGamePhase)
    const reset = useStore((s) => s.reset)

    const [shareStatus, setShareStatus] = useState('')

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

    const maxDaysOffset = useMemo(() => {
        if (!repos || repos.length === 0) return 365
        const oldest = repos.reduce((min, r) => {
            const ms = new Date(r.created_at).getTime()
            return ms < min ? ms : min
        }, Date.now())
        const days = Math.ceil((Date.now() - oldest) / (1000 * 60 * 60 * 24)) + 10 // pad a bit
        return Math.max(365, days)
    }, [repos])

    const fallbackCopy = async (dataUrl, text) => {
        try {
            await navigator.clipboard.writeText(text)
            setShareStatus('COPIED!')
        } catch {
            setShareStatus('SAVED!')
        }

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${username}-gitscape.png`
        a.click()
    }

    const handleShare = useCallback(async () => {
        const canvas = document.querySelector('#city-canvas-container canvas')
        if (!canvas) return

        const dataUrl = canvas.toDataURL('image/png')
        const shareText = `🏙️ ${username}'s Gitscape\n\n📦 ${repos.length} repos | ⭐ ${totalStars} stars | 🔥 ${contributions} contributions\n🚗 Driving a ${CAR_TIER_NAMES[carTier]}\n\nBuild yours at: ${window.location.origin}`

        if (navigator.share && navigator.canShare) {
            try {
                const blob = await (await fetch(dataUrl)).blob()
                const file = new File([blob], `${username}-gitscape.png`, { type: 'image/png' })
                await navigator.share({
                    title: `${username}'s Gitscape`,
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
        a.download = `${username}-gitscape.png`
        a.click()
        setShareStatus('SAVED!')
        setTimeout(() => setShareStatus(''), 2000)
    }, [username])

    // Handle 'E' to toggle repo panel
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key.toLowerCase() === 'p') {
                setShowProfilePage(!showProfilePage)
                playUIClick()
                return
            }

            if (e.key.toLowerCase() === 'e') {
                if (showRepoPanel) {
                    setShowRepoPanel(false)
                    setActiveRepo(null)
                    playUIClick()
                } else if (nearbyBuilding) {
                    setActiveRepo(nearbyBuilding)
                    setShowRepoPanel(true)
                    playUIClick()
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [nearbyBuilding, showRepoPanel, setActiveRepo, setShowRepoPanel, showProfilePage, setShowProfilePage])

    if (gamePhase !== 'playing') return null

    return (
        <div className="hud">

            {/* Controls Hint Overlay (Fades out automatically) */}
            <div className="hud-controls-hint">
                <span className="key">W</span><span className="key">A</span><span className="key">S</span><span className="key">D</span>
                <span className="controls-label">TO DRIVE</span>
                <span className="key" style={{ marginLeft: '12px' }}>SPACE</span>
                <span className="controls-label">TO JUMP</span>
            </div>

            {/* Minimap */}
            <Minimap />

            {/* Detailed Repo Stats Panel (Shows on 'E') */}
            <RepoInfoPanel />

            {/* Profile Page Overlay (Shows on 'P') */}
            <ProfilePage />

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
                    <div className="hud-car-tier">{CAR_TIER_NAMES[carTier] || 'CAR'}</div>
                </div>

                <div className="hud-section-right">
                    <div className="hud-speed">
                        {/* Speed Bar */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '0',
                            width: '100%',
                            height: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.min((carSpeed / 120) * 100, 100)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #6c5ce7, #00f5a0)',
                                boxShadow: '0 0 10px rgba(108,92,231,0.5)',
                                transition: 'width 0.1s linear'
                            }} />
                        </div>
                        <span className="speed-value">{Math.round(carSpeed)}</span>
                        <span className="speed-unit">KM/H</span>
                    </div>

                    {totalCoins > 0 && (
                        <div className="hud-coins">
                            <span className="coin-icon">🪙</span>
                            <span className="coin-count">{coinsCollected}/{totalCoins}</span>
                        </div>
                    )}

                    <div className="hud-actions">
                        <button
                            className={`hud-btn ${isSkylineView ? 'hud-btn-active' : ''}`}
                            onClick={() => { playUIClick(); setIsSkylineView(!isSkylineView) }}
                            style={isSkylineView ? { background: '#6c5ce7', color: '#fff', borderColor: '#6c5ce7' } : {}}
                        >
                            {isSkylineView ? 'DRIVING' : 'SKYLINE'}
                        </button>
                        <button className="hud-btn" onClick={() => { playUIClick(); setShowProfilePage(true) }}>PROFILE (P)</button>
                        <button className="hud-btn" onClick={() => { playUIClick(); setGamePhase('garage') }}>GARAGE</button>
                        <button className="hud-btn" onClick={() => { playUIClick(); handleScreenshot() }} title="Screenshot">📸</button>
                        <button className="hud-btn hud-btn-primary" onClick={() => { playUIClick(); handleShare() }}>
                            {shareStatus || 'SHARE'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default HUD
