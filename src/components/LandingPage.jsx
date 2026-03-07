import { useState } from 'react'
import useStore from '../store/store'
import './LandingPage.css'

function LandingPage() {
    const [input, setInput] = useState('')
    const setUsername = useStore((s) => s.setUsername)
    const setGamePhase = useStore((s) => s.setGamePhase)

    const handleSubmit = (e) => {
        e.preventDefault()
        const name = input.trim()
        if (!name) return
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

                {/* Features */}
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
