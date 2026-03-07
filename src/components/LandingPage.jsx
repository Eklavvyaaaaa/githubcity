import { useState } from 'react'
import useStore from '../store/store'
import './LandingPage.css'

function LandingPage() {
    const [input, setInput] = useState('')
    const [showToken, setShowToken] = useState(false)
    const [tokenInput, setTokenInput] = useState('')
    const error = useStore((s) => s.error)
    const setError = useStore((s) => s.setError)
    const setUsername = useStore((s) => s.setUsername)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const setGithubToken = useStore((s) => s.setGithubToken)

    const handleSubmit = (e) => {
        e.preventDefault()
        const name = input.trim()
        if (!name) return
        setError(null)
        if (tokenInput.trim()) setGithubToken(tokenInput.trim())
        setUsername(name)
        setGamePhase('loading')
    }

    return (
        <div className="landing">
            {/* Animated background particles */}
            <div className="landing-particles">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${3 + Math.random() * 4}s`,
                    }} />
                ))}
            </div>

            {/* Grid background */}
            <div className="landing-grid" />

            <div className="landing-content">
                {/* Logo */}
                <div className="landing-logo animate-fade-in">
                    <span className="logo-icon">🏙️</span>
                    <h1 className="logo-text">
                        <span className="logo-github">GitHub</span>
                        <span className="logo-city">City</span>
                    </h1>
                </div>

                {/* Subtitle */}
                <p className="landing-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Your GitHub profile as a 3D city you can drive through
                </p>

                {/* Search form */}
                <form className="landing-form animate-fade-in-up" style={{ animationDelay: '0.4s' }} onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter GitHub username"
                            className="landing-input"
                            autoFocus
                            spellCheck={false}
                            id="username-input"
                        />
                    </div>
                    <button type="submit" className="landing-button" id="build-city-btn" disabled={!input.trim()}>
                        <span>Build My City</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-arrow">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </form>

                {/* Error message */}
                {error && (
                    <div className="landing-error animate-fade-in">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)} className="error-dismiss">✕</button>
                    </div>
                )}

                {/* Optional token input */}
                <button className="token-toggle" onClick={() => setShowToken(!showToken)} style={{ animationDelay: '0.6s' }}>
                    {showToken ? 'Hide token input' : '🔑 Add GitHub token (optional)'}
                </button>
                {showToken && (
                    <div className="token-input-wrapper animate-fade-in">
                        <input
                            type="password"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="landing-input token-input"
                        />
                        <p className="token-hint">For higher API rate limits (5000/hr vs 60/hr)</p>
                    </div>
                )}
                <div className="landing-features animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <div className="feature">
                        <span className="feature-icon">🏗️</span>
                        <span>Repos → Buildings</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🚗</span>
                        <span>Contributions → Car</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">⭐</span>
                        <span>Stars → Height</span>
                    </div>
                </div>
            </div>

            {/* Bottom gradient */}
            <div className="landing-bottom-fade" />
        </div>
    )
}

export default LandingPage
