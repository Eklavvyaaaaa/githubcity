import { useState } from 'react'
import useStore from '../store/store'
import './LandingPage.css'

function LandingPage() {

    const error = useStore((s) => s.error)
    const setError = useStore((s) => s.setError)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const setUsername = useStore((s) => s.setUsername)

    const setCompareUsername = useStore((s) => s.setCompareUsername)
    const setToken = useStore((s) => s.setToken)
    const isCompareMode = useStore((s) => s.isCompareMode)
    const setIsCompareMode = useStore((s) => s.setIsCompareMode)

    const [inputVal, setInputVal] = useState('')
    const [compareVal, setCompareVal] = useState('')
    const [tokenVal, setTokenVal] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        const cleanName = inputVal.trim()
        if (!cleanName) {
            setError('Please enter a GitHub username.')
            return
        }

        setUsername(cleanName)
        if (tokenVal.trim()) setToken(tokenVal.trim())

        if (isCompareMode) {
            const cleanCompare = compareVal.trim()
            if (!cleanCompare) {
                setError('Please enter a second username to compare.')
                return
            }
            if (cleanCompare === cleanName) {
                setError('Please enter two different usernames.')
                return
            }
            setCompareUsername(cleanCompare)
            setGamePhase('loading_compare')
        } else {
            setGamePhase('loading')
        }
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

                    {isCompareMode && (
                        <input
                            type="text"
                            className="landing-input animate-fade-in"
                            placeholder="VS ANOTHER USERNAME"
                            value={compareVal}
                            onChange={(e) => setCompareVal(e.target.value)}
                            autoComplete="off"
                            spellCheck="false"
                        />
                    )}

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
                        disabled={!inputVal.trim() || (isCompareMode && !compareVal.trim())}
                    >
                        {isCompareMode ? 'COMPARE CITIES' : 'BUILD CITY'}
                    </button>

                    <label className="compare-toggle">
                        <input
                            type="checkbox"
                            checked={isCompareMode}
                            onChange={(e) => setIsCompareMode(e.target.checked)}
                        />
                        <span className="compare-toggle-label">COMPARE MODE</span>
                    </label>
                </form>

            </div>
        </div>
    )
}

export default LandingPage
