import { useEffect, useState } from 'react'
import useStore from '../store/store'
import { fetchUser, fetchAllRepos, fetchContributions, getCarTier, determineWeather } from '../services/github'
import { generateCity } from '../city/CityGenerator'
import { generateCityName } from '../city/nameGen'
import './LoadingScreen.css'

const MESSAGES = [
    'Surveying land…',
    'Fetching blueprints from GitHub…',
    'Pouring foundations…',
    'Placing buildings…',
    'Paving roads…',
    'Planting trees…',
    'Choosing your car…',
    'City ready!',
]

function LoadingScreen() {
    const [msgIndex, setMsgIndex] = useState(0)
    const username = useStore((s) => s.username)
    const setUserData = useStore((s) => s.setUserData)
    const setRepos = useStore((s) => s.setRepos)
    const setContributions = useStore((s) => s.setContributions)
    const setCityData = useStore((s) => s.setCityData)
    const setCityName = useStore((s) => s.setCityName)
    const setCarTier = useStore((s) => s.setCarTier)
    const setWeather = useStore((s) => s.setWeather)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const setError = useStore((s) => s.setError)
    const githubToken = useStore((s) => s.githubToken)

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((i) => (i < MESSAGES.length - 1 ? i + 1 : i))
        }, 800)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                // Fetch GitHub data
                setMsgIndex(1)
                const user = await fetchUser(username, githubToken)
                if (cancelled) return
                setUserData(user)

                const repos = await fetchAllRepos(username, githubToken)
                if (cancelled) return
                setRepos(repos)

                setMsgIndex(2)
                const contribs = await fetchContributions(username)
                if (cancelled) return
                setContributions(contribs)

                // Generate city
                setMsgIndex(3)
                const cityData = generateCity(user, repos)
                if (cancelled) return
                setCityData(cityData)

                setMsgIndex(4)
                const name = generateCityName(username)
                setCityName(name)

                // Car tier
                setMsgIndex(6)
                const tier = getCarTier(contribs)
                setCarTier(tier)

                // Weather
                const weather = determineWeather(repos)
                setWeather(weather)

                // Done
                setMsgIndex(7)
                await new Promise((r) => setTimeout(r, 600))
                if (cancelled) return
                setGamePhase('playing')

            } catch (err) {
                if (!cancelled) {
                    console.error('Loading error:', err)
                    setError(err.message || 'Failed to load city')
                    setGamePhase('landing')
                }
            }
        }

        load()
        return () => { cancelled = true }
    }, [username])

    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-spinner" />
                <h2 className="loading-title">Building {username}'s city</h2>
                <p className="loading-message">{MESSAGES[msgIndex]}</p>
                <div className="loading-bar-track">
                    <div
                        className="loading-bar-fill"
                        style={{ width: `${((msgIndex + 1) / MESSAGES.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

export default LoadingScreen
