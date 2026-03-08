import { useEffect, useState } from 'react'
import useStore from '../store/store'
import { playUIClick } from '../services/audio'
import './RepoInfoPanel.css'

function RepoInfoPanel() {
    const activeRepo = useStore((s) => s.activeRepo)
    const showRepoPanel = useStore((s) => s.showRepoPanel)
    const setShowRepoPanel = useStore((s) => s.setShowRepoPanel)
    const setActiveRepo = useStore((s) => s.setActiveRepo)

    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (showRepoPanel) {
            setIsVisible(true)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 400)
            return () => clearTimeout(timer)
        }
    }, [showRepoPanel])

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && showRepoPanel) {
                handleClose()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [showRepoPanel])

    if (!isVisible && !showRepoPanel) return null

    const handleClose = () => {
        playUIClick()
        setShowRepoPanel(false)
        setTimeout(() => setActiveRepo(null), 400)
    }

    if (!activeRepo) return null

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown'
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className={`repo-panel-overlay ${showRepoPanel ? 'active' : ''}`} onClick={handleClose}>
            <div className="repo-panel-content" onClick={e => e.stopPropagation()}>
                <button className="repo-panel-close" onClick={handleClose}>✕</button>

                <div className="repo-panel-header">
                    <div className="repo-panel-lang-badge" style={{ backgroundColor: activeRepo.color }}>
                        {activeRepo.language}
                    </div>
                    <h2 className="repo-panel-title">{activeRepo.name}</h2>
                    <p className="repo-panel-fullname">{activeRepo.fullName}</p>
                </div>

                <div className="repo-panel-body">
                    <p className="repo-panel-description">
                        {activeRepo.description || 'No description provided.'}
                    </p>

                    <div className="repo-panel-stats-grid">
                        <div className="repo-stat-item">
                            <span className="stat-label">STARS</span>
                            <span className="stat-value">⭐ {activeRepo.stars}</span>
                        </div>
                        <div className="repo-stat-item">
                            <span className="stat-label">FORKS</span>
                            <span className="stat-value">🍴 {activeRepo.forks}</span>
                        </div>
                        <div className="repo-stat-item">
                            <span className="stat-label">SIZE</span>
                            <span className="stat-value">📦 {activeRepo.repoSize} KB</span>
                        </div>
                        <div className="repo-stat-item">
                            <span className="stat-label">FROZEN?</span>
                            <span className="stat-value">{activeRepo.isInactive ? '❄️ YES' : '🔥 ACTIVE'}</span>
                        </div>
                    </div>

                    <div className="repo-panel-dates">
                        <div className="date-item">
                            <span className="date-label">CREATED</span>
                            <span className="date-value">{formatDate(activeRepo.createdAt)}</span>
                        </div>
                        <div className="date-item">
                            <span className="date-label">LAST PUSH</span>
                            <span className="date-value">{formatDate(activeRepo.lastPush)}</span>
                        </div>
                    </div>

                    <div className="repo-panel-footer">
                        <a
                            href={activeRepo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="repo-panel-link-btn"
                            onClick={() => playUIClick()}
                        >
                            VIEW ON GITHUB
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RepoInfoPanel
