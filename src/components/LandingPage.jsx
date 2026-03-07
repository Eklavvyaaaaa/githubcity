import { useState } from 'react'
import useStore from '../store/store'
import { playUIClick } from '../services/audio'
import './LandingPage.css'

function LandingPage() {

    const error = useStore((s) => s.error)
    const setError = useStore((s) => s.setError)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const setUsername = useStore((s) => s.setUsername)
    const setGithubToken = useStore((s) => s.setGithubToken)

    const [inputVal, setInputVal] = useState('')
    const [tokenVal, setTokenVal] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        const cleanName = inputVal.trim()
        if (!cleanName) {
            setError('Please enter a GitHub username.')
            return
        }

        setUsername(cleanName)
        if (tokenVal.trim()) setGithubToken(tokenVal.trim())

        setGamePhase('loading')
    }

    return (
        <div className="landing animate-fade-in">
            <div className="landing-content">

                {/* Clean minimalist title */}
                <h1 className="landing-title">GITHUB CITY</h1>


                {error && (
                    <div className="landing-error animate-fade-in">
                        <span>{error}</span>
                        <button className="error-dismiss" onClick={() => setError(null)}>X</button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="landing-form-container animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <input
                        type="text"
                        className="landing-input"
                        placeholder="ENTER GITHUB USERNAME"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                    />



                    <input
                        type="password"
                        className="landing-input"
                        placeholder="GITHUB TOKEN (OPTIONAL)"
                        value={tokenVal}
                        onChange={(e) => setTokenVal(e.target.value)}
                        autoComplete="off"
                        title="Add a GitHub Personal Access Token to avoid API rate limits for large repositories."
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '-10px', marginBottom: '8px' }}>
                        * TOKEN INCREASES RATE LIMITS (SAFE: NEVER STORED/LOGGED)
                    </div>

                    <button
                        type="submit"
                        className="landing-button"
                        disabled={!inputVal.trim()}
                        onClick={playUIClick}
                    >
                        BUILD CITY
                    </button>
                </form>

            </div>
        </div>
    )
}

export default LandingPage
