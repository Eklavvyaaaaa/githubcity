import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/store'
import { CityEnvironment } from './CityScene'
import './CompareScene.css'

// ===========================
// Cinematic Orbit Camera
// ===========================
function OrbitCamera({ bounds }) {
    const { camera } = useThree()
    const timeRef = useRef(0)

    const cityCenter = useMemo(() => {
        if (!bounds) return new THREE.Vector3(0, 0, 0)
        return new THREE.Vector3(
            (bounds.minX + bounds.maxX) / 2,
            0,
            (bounds.minZ + bounds.maxZ) / 2
        )
    }, [bounds])

    const citySpan = useMemo(() => {
        if (!bounds) return 60
        return Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2
    }, [bounds])

    useFrame((_, delta) => {
        timeRef.current += delta * 0.1 // Slow rotation
        const radius = citySpan * 1.5
        const height = 45

        const cx = cityCenter.x + Math.cos(timeRef.current) * radius
        const cz = cityCenter.z + Math.sin(timeRef.current) * radius

        camera.position.set(cx, height, cz)
        camera.lookAt(cityCenter.x, 10, cityCenter.z)
    })

    return null
}

// ===========================
// Split Screen Compare Scene
// ===========================
export default function CompareScene() {
    const cityData = useStore((s) => s.cityData)
    const cityData2 = useStore((s) => s.cityData2)
    const weather = useStore((s) => s.weather)
    const weather2 = useStore((s) => s.weather2)
    const userData = useStore((s) => s.userData)
    const userData2 = useStore((s) => s.userData2)
    const repos = useStore((s) => s.repos)
    const repos2 = useStore((s) => s.repos2)
    const contributions = useStore((s) => s.contributions)
    const contributions2 = useStore((s) => s.contributions2)
    const reset = useStore((s) => s.reset)

    if (!cityData || !cityData2) return null

    const getFog = (w) => {
        const color = w === 'clear' ? '#070714' : w === 'cloudy' ? '#0d0d20' : '#050510'
        const near = w === 'foggy' ? 15 : w === 'rainy' ? 30 : 60
        const far = w === 'foggy' ? 60 : w === 'rainy' ? 100 : 250
        return { color, near, far }
    }

    const fog1 = getFog(weather)
    const fog2 = getFog(weather2)

    return (
        <div className="compare-container">
            {/* Header / Home Button */}
            <div className="compare-header animate-fade-in-up">
                <span>COMPARE MODE</span>
                <button className="compare-home-btn" onClick={reset}>HOME</button>
            </div>

            {/* Player 1 City */}
            <div className="compare-half">
                <Canvas
                    camera={{ position: [0, 40, 50], fov: 55, near: 0.5, far: 1000 }}
                    dpr={[1, 1.5]}
                    performance={{ min: 0.5 }}
                    gl={{
                        antialias: false, // Low poly style
                        powerPreference: 'high-performance',
                    }}
                >
                    <color attach="background" args={['#87CEEB']} />
                    <fog attach="fog" args={['#87CEEB', fog1.near, fog1.far]} />

                    <CityEnvironment
                        cityData={cityData}
                        weather={weather}
                        userData={userData}
                        repos={repos}
                        contributions={contributions}
                    />
                    <OrbitCamera bounds={cityData.bounds} />
                </Canvas>

                {/* Overlay Player 1 */}
                <div className="compare-stats-overlay animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="compare-badge" style={{ fontSize: '18px', color: '#ffffff' }}>@{userData.login}</div>
                    <div className="compare-stat-row">
                        <div className="compare-badge">{repos.length} <span>REPOS</span></div>
                        <div className="compare-badge">{contributions.toLocaleString()} <span>CONTRIBS</span></div>
                    </div>
                </div>
            </div>

            <div className="compare-divider" />

            {/* Player 2 City */}
            <div className="compare-half">
                <Canvas
                    camera={{ position: [0, 40, 50], fov: 55, near: 0.5, far: 1000 }}
                    dpr={[1, 1.5]}
                    performance={{ min: 0.5 }}
                    gl={{
                        antialias: false,
                        powerPreference: 'high-performance',
                    }}
                >
                    <color attach="background" args={['#87CEEB']} />
                    <fog attach="fog" args={['#87CEEB', fog2.near, fog2.far]} />

                    <CityEnvironment
                        cityData={cityData2}
                        weather={weather2}
                        userData={userData2}
                        repos={repos2}
                        contributions={contributions2}
                    />
                    <OrbitCamera bounds={cityData2.bounds} />
                </Canvas>

                {/* Overlay Player 2 */}
                <div className="compare-stats-overlay animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="compare-badge" style={{ fontSize: '18px', color: '#ffffff' }}>@{userData2.login}</div>
                    <div className="compare-stat-row">
                        <div className="compare-badge">{repos2.length} <span>REPOS</span></div>
                        <div className="compare-badge">{contributions2.toLocaleString()} <span>CONTRIBS</span></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
