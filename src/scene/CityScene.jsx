import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky, Text, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import useStore from '../store/store'

// ===========================
// Buildings (Instanced)
// ===========================
function Buildings({ buildings }) {
    const meshRef = useRef()
    const windowMeshRef = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])
    const [hoveredBuilding, setHoveredBuilding] = useState(null)

    // Create instanced mesh for buildings
    const { colors, count } = useMemo(() => {
        const colors = new Float32Array(buildings.length * 3)
        buildings.forEach((b, i) => {
            const color = new THREE.Color(b.color)
            // Weathered buildings are darker
            if (b.isWeathered) color.multiplyScalar(0.5)
            if (b.isInactive) color.multiplyScalar(0.3)
            // Forked repos slightly transparent-ish (lighter)
            if (b.isForked) color.lerp(new THREE.Color('#666688'), 0.3)
            // Private repos are very dark
            if (b.isPrivate) color.set('#1a1a2a')
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        })
        return { colors, count: buildings.length }
    }, [buildings])

    useEffect(() => {
        if (!meshRef.current) return
        buildings.forEach((b, i) => {
            dummy.position.set(b.x, b.height / 2, b.z)
            dummy.scale.set(b.width, b.height, b.depth)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
        meshRef.current.geometry.setAttribute(
            'color',
            new THREE.InstancedBufferAttribute(colors, 3)
        )
    }, [buildings, colors, dummy])

    if (count === 0) return null

    return (
        <group>
            <instancedMesh
                ref={meshRef}
                args={[null, null, count]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    vertexColors
                    roughness={0.7}
                    metalness={0.1}
                />
            </instancedMesh>

            {/* Landmark decorations */}
            {buildings.filter(b => b.isPinned).map((b) => (
                <group key={b.id} position={[b.x, b.height, b.z]}>
                    {/* Spire on top */}
                    <mesh position={[0, 2, 0]} castShadow>
                        <coneGeometry args={[0.5, 4, 4]} />
                        <meshStandardMaterial color={b.accentColor} emissive={b.accentColor} emissiveIntensity={0.3} />
                    </mesh>
                    {/* Glow ring */}
                    <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[b.width / 2 + 0.5, b.width / 2 + 1, 32]} />
                        <meshBasicMaterial color={b.accentColor} transparent opacity={0.3} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}

            {/* Building labels (shown when nearby) */}
            {hoveredBuilding && (
                <Html position={[hoveredBuilding.x, hoveredBuilding.height + 2, hoveredBuilding.z]} center>
                    <div style={{
                        background: 'rgba(10,10,30,0.9)',
                        border: '1px solid rgba(108,92,231,0.4)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        color: '#e8e8f0',
                        fontSize: '13px',
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(10px)',
                        pointerEvents: 'none',
                    }}>
                        <div style={{ fontWeight: 700 }}>{hoveredBuilding.name}</div>
                        <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '2px' }}>
                            ⭐ {hoveredBuilding.stars} &nbsp; 🍴 {hoveredBuilding.forks} &nbsp; {hoveredBuilding.language}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    )
}

// ===========================
// Roads
// ===========================
function Roads({ bounds }) {
    const step = 16 // CELL_SIZE from CityGenerator
    const roads = useMemo(() => {
        const segments = []
        for (let z = Math.floor(bounds.minZ / step) * step; z <= bounds.maxZ; z += step) {
            segments.push({ type: 'h', pos: z })
        }
        for (let x = Math.floor(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
            segments.push({ type: 'v', pos: x })
        }
        return segments
    }, [bounds])

    const width = bounds.maxX - bounds.minX
    const depth = bounds.maxZ - bounds.minZ
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerZ = (bounds.minZ + bounds.maxZ) / 2

    return (
        <group>
            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.05, centerZ]} receiveShadow>
                <planeGeometry args={[width + 60, depth + 60]} />
                <meshStandardMaterial color="#0d0d1a" roughness={1} />
            </mesh>

            {/* Road segments */}
            {roads.map((road, i) => {
                if (road.type === 'h') {
                    return (
                        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.01, road.pos]}>
                            <planeGeometry args={[width + 40, 4]} />
                            <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
                        </mesh>
                    )
                } else {
                    return (
                        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[road.pos, 0.01, centerZ]}>
                            <planeGeometry args={[4, depth + 40]} />
                            <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
                        </mesh>
                    )
                }
            })}

            {/* Road center lines */}
            {roads.map((road, i) => {
                if (road.type === 'h') {
                    return (
                        <mesh key={`line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.02, road.pos]}>
                            <planeGeometry args={[width + 40, 0.15]} />
                            <meshBasicMaterial color="#333355" />
                        </mesh>
                    )
                } else {
                    return (
                        <mesh key={`line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[road.pos, 0.02, centerZ]}>
                            <planeGeometry args={[0.15, depth + 40]} />
                            <meshBasicMaterial color="#333355" />
                        </mesh>
                    )
                }
            })}
        </group>
    )
}

// ===========================
// Street Props (Instanced lamps & trees)
// ===========================
function StreetProps({ props }) {
    const lamps = useMemo(() => props.filter(p => p.type === 'lamp'), [props])
    const trees = useMemo(() => props.filter(p => p.type === 'tree'), [props])
    const lampRef = useRef()
    const treeTrunkRef = useRef()
    const treeTopRef = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])

    useEffect(() => {
        if (lampRef.current) {
            lamps.forEach((l, i) => {
                dummy.position.set(l.x, 2.5, l.z)
                dummy.scale.set(1, 1, 1)
                dummy.updateMatrix()
                lampRef.current.setMatrixAt(i, dummy.matrix)
            })
            lampRef.current.instanceMatrix.needsUpdate = true
        }
    }, [lamps, dummy])

    useEffect(() => {
        if (treeTrunkRef.current && treeTopRef.current) {
            trees.forEach((t, i) => {
                // Trunk
                dummy.position.set(t.x, 1.5, t.z)
                dummy.scale.set(1, 1, 1)
                dummy.updateMatrix()
                treeTrunkRef.current.setMatrixAt(i, dummy.matrix)
                // Top
                dummy.position.set(t.x, 4, t.z)
                dummy.scale.set(1, 1, 1)
                dummy.updateMatrix()
                treeTopRef.current.setMatrixAt(i, dummy.matrix)
            })
            treeTrunkRef.current.instanceMatrix.needsUpdate = true
            treeTopRef.current.instanceMatrix.needsUpdate = true
        }
    }, [trees, dummy])

    return (
        <group>
            {/* Lamps */}
            {lamps.length > 0 && (
                <instancedMesh ref={lampRef} args={[null, null, lamps.length]}>
                    <cylinderGeometry args={[0.08, 0.1, 5, 6]} />
                    <meshStandardMaterial color="#444466" metalness={0.6} roughness={0.3} />
                </instancedMesh>
            )}
            {/* Lamp lights (glow spheres) */}
            {lamps.slice(0, 200).map((l, i) => (
                <mesh key={i} position={[l.x, 5.2, l.z]}>
                    <sphereGeometry args={[0.25, 8, 8]} />
                    <meshBasicMaterial color="#FFE4A0" />
                </mesh>
            ))}

            {/* Tree trunks */}
            {trees.length > 0 && (
                <instancedMesh ref={treeTrunkRef} args={[null, null, trees.length]}>
                    <cylinderGeometry args={[0.15, 0.2, 3, 6]} />
                    <meshStandardMaterial color="#5C4033" roughness={0.9} />
                </instancedMesh>
            )}
            {/* Tree tops */}
            {trees.length > 0 && (
                <instancedMesh ref={treeTopRef} args={[null, null, trees.length]}>
                    <coneGeometry args={[1.2, 3, 6]} />
                    <meshStandardMaterial color="#2D5A27" roughness={0.8} />
                </instancedMesh>
            )}
        </group>
    )
}

// ===========================
// Parks
// ===========================
function Parks({ parks }) {
    return (
        <group>
            {parks.map((p, i) => (
                <group key={i}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.02, p.z]}>
                        <planeGeometry args={[p.width, p.depth]} />
                        <meshStandardMaterial color="#1a3320" roughness={0.95} />
                    </mesh>
                    {/* Park trees */}
                    {Array.from({ length: 3 }).map((_, j) => (
                        <group key={j} position={[
                            p.x + (Math.random() - 0.5) * p.width * 0.6,
                            0,
                            p.z + (Math.random() - 0.5) * p.depth * 0.6,
                        ]}>
                            <mesh position={[0, 1, 0]}>
                                <cylinderGeometry args={[0.12, 0.18, 2, 6]} />
                                <meshStandardMaterial color="#5C4033" />
                            </mesh>
                            <mesh position={[0, 3, 0]}>
                                <sphereGeometry args={[1.2, 8, 6]} />
                                <meshStandardMaterial color="#2D7A27" roughness={0.8} />
                            </mesh>
                        </group>
                    ))}
                </group>
            ))}
        </group>
    )
}

// ===========================
// Procedural Car
// ===========================
const CAR_CONFIGS = [
    { color: '#8B7355', bodyH: 1.2, bodyW: 2, bodyL: 4, roofH: 0.8, speed: 20, name: 'Jalopy' },
    { color: '#5B8DEF', bodyH: 1.1, bodyW: 2.1, bodyL: 4.2, roofH: 0.9, speed: 30, name: 'Sedan' },
    { color: '#FF6B6B', bodyH: 1.0, bodyW: 2.0, bodyL: 4.5, roofH: 0.7, speed: 45, name: 'Coupe' },
    { color: '#FFA726', bodyH: 1.1, bodyW: 2.2, bodyL: 5.0, roofH: 0.6, speed: 55, name: 'Muscle' },
    { color: '#AB47BC', bodyH: 0.9, bodyW: 2.1, bodyL: 5.2, roofH: 0.5, speed: 70, name: 'Super' },
    { color: '#00E676', bodyH: 0.8, bodyW: 2.0, bodyL: 5.5, roofH: 0.4, speed: 90, name: 'Hyper' },
]

function Car({ carTier, buildings }) {
    const carRef = useRef()
    const setCarSpeed = useStore((s) => s.setCarSpeed)
    const config = CAR_CONFIGS[carTier] || CAR_CONFIGS[0]

    // Movement state
    const state = useRef({
        velocity: 0,
        rotation: 0,
        position: new THREE.Vector3(0, 0.5, 0),
        keys: { w: false, a: false, s: false, d: false },
    })

    // Keyboard handlers
    useEffect(() => {
        const onKeyDown = (e) => {
            const key = e.key.toLowerCase()
            if (key === 'w' || key === 'arrowup') state.current.keys.w = true
            if (key === 'a' || key === 'arrowleft') state.current.keys.a = true
            if (key === 's' || key === 'arrowdown') state.current.keys.s = true
            if (key === 'd' || key === 'arrowright') state.current.keys.d = true
        }
        const onKeyUp = (e) => {
            const key = e.key.toLowerCase()
            if (key === 'w' || key === 'arrowup') state.current.keys.w = false
            if (key === 'a' || key === 'arrowleft') state.current.keys.a = false
            if (key === 's' || key === 'arrowdown') state.current.keys.s = false
            if (key === 'd' || key === 'arrowright') state.current.keys.d = false
        }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [])

    useFrame((_, delta) => {
        const s = state.current
        const dt = Math.min(delta, 0.05)
        const maxSpeed = config.speed
        const accel = maxSpeed * 1.5
        const friction = 0.96
        const turnSpeed = 2.5

        // Acceleration / braking
        if (s.keys.w) s.velocity = Math.min(s.velocity + accel * dt, maxSpeed)
        else if (s.keys.s) s.velocity = Math.max(s.velocity - accel * dt, -maxSpeed * 0.4)
        else s.velocity *= friction

        // Turning
        if (Math.abs(s.velocity) > 0.5) {
            if (s.keys.a) s.rotation += turnSpeed * dt * Math.sign(s.velocity)
            if (s.keys.d) s.rotation -= turnSpeed * dt * Math.sign(s.velocity)
        }

        // Move
        const dx = -Math.sin(s.rotation) * s.velocity * dt
        const dz = -Math.cos(s.rotation) * s.velocity * dt
        s.position.x += dx
        s.position.z += dz

        // Simple collision with buildings
        for (const b of buildings) {
            const halfW = b.width / 2 + 1.5
            const halfD = b.depth / 2 + 1.5
            if (
                s.position.x > b.x - halfW && s.position.x < b.x + halfW &&
                s.position.z > b.z - halfD && s.position.z < b.z + halfD
            ) {
                s.position.x -= dx * 1.5
                s.position.z -= dz * 1.5
                s.velocity *= -0.3
            }
        }

        // Apply to mesh
        if (carRef.current) {
            carRef.current.position.copy(s.position)
            carRef.current.rotation.y = s.rotation
        }

        setCarSpeed(Math.abs(s.velocity) * 3.6) // Convert to km/h
    })

    return (
        <group ref={carRef} position={[0, 0.5, 0]}>
            {/* Body */}
            <mesh position={[0, config.bodyH / 2, 0]} castShadow>
                <boxGeometry args={[config.bodyW, config.bodyH, config.bodyL]} />
                <meshStandardMaterial color={config.color} metalness={0.4} roughness={0.3} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, config.bodyH + config.roofH / 2, -0.3]} castShadow>
                <boxGeometry args={[config.bodyW - 0.3, config.roofH, config.bodyL * 0.5]} />
                <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.2} />
            </mesh>
            {/* Wheels */}
            {[[-1, 0.3, 1.3], [1, 0.3, 1.3], [-1, 0.3, -1.3], [1, 0.3, -1.3]].map(([x, y, z], i) => (
                <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.35, 0.35, 0.3, 12]} />
                    <meshStandardMaterial color="#222" roughness={0.9} />
                </mesh>
            ))}
            {/* Headlights */}
            <mesh position={[-0.6, config.bodyH * 0.6, config.bodyL / 2 + 0.01]}>
                <boxGeometry args={[0.3, 0.2, 0.05]} />
                <meshBasicMaterial color="#FFE4A0" />
            </mesh>
            <mesh position={[0.6, config.bodyH * 0.6, config.bodyL / 2 + 0.01]}>
                <boxGeometry args={[0.3, 0.2, 0.05]} />
                <meshBasicMaterial color="#FFE4A0" />
            </mesh>
            {/* Taillights */}
            <mesh position={[-0.7, config.bodyH * 0.6, -config.bodyL / 2 - 0.01]}>
                <boxGeometry args={[0.25, 0.15, 0.05]} />
                <meshBasicMaterial color="#FF3333" />
            </mesh>
            <mesh position={[0.7, config.bodyH * 0.6, -config.bodyL / 2 - 0.01]}>
                <boxGeometry args={[0.25, 0.15, 0.05]} />
                <meshBasicMaterial color="#FF3333" />
            </mesh>
        </group>
    )
}

// ===========================
// Camera Follow
// ===========================
function CameraFollow({ carTier }) {
    const { camera } = useThree()
    const carConfig = CAR_CONFIGS[carTier] || CAR_CONFIGS[0]

    useFrame(() => {
        // Find car group (it updates its own position)
        const carGroup = document.querySelector('canvas')
        // Read car position from store-connected component
        // We use a simpler approach: scan for the car mesh in the scene
    })

    return null
}

function CameraController() {
    const { camera, scene } = useThree()
    const targetPos = useRef(new THREE.Vector3(0, 30, 30))
    const lookTarget = useRef(new THREE.Vector3(0, 0, 0))

    useFrame(() => {
        // Find the car group (first child with name or position)
        scene.traverse((child) => {
            if (child.name === 'car-group' || (child.userData && child.userData.isCar)) return
        })

        // Find car by traversing — the car group is identifiable
        let carPos = null
        let carRot = 0
        scene.traverse((obj) => {
            if (obj.userData?.isCar) {
                carPos = obj.position.clone()
                carRot = obj.rotation.y
            }
        })

        if (carPos) {
            // Third-person camera behind car
            const offset = new THREE.Vector3(
                Math.sin(carRot) * 15,
                10,
                Math.cos(carRot) * 15
            )
            targetPos.current.lerp(carPos.clone().add(offset), 0.05)
            lookTarget.current.lerp(carPos, 0.1)
        }

        camera.position.lerp(targetPos.current, 0.08)
        camera.lookAt(lookTarget.current)
    })

    return null
}

// Wrapper so Car marks itself
function CarWrapper({ carTier, buildings }) {
    const ref = useRef()

    useEffect(() => {
        if (ref.current) {
            ref.current.userData.isCar = true
        }
    }, [])

    return (
        <group ref={ref}>
            <Car carTier={carTier} buildings={buildings} />
        </group>
    )
}

// ===========================
// Billboards (Achievements)
// ===========================
function Billboards({ userData, repos, contributions, bounds }) {
    const achievements = useMemo(() => {
        const achs = []
        const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

        if (totalStars >= 100) achs.push('⭐ 100+ Stars Earned!')
        if (totalStars >= 1000) achs.push('🌟 1000+ Stars!')
        if (repos.length >= 50) achs.push('🏗️ 50+ Repositories!')
        if (contributions >= 1000) achs.push('🔥 1000+ Contributions!')

        // Top language
        const langCounts = {}
        repos.forEach(r => { if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1 })
        const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]
        if (topLang) achs.push(`🏆 Top Language: ${topLang[0]}`)

        if (userData?.created_at) {
            const years = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            if (years >= 5) achs.push(`🎂 ${years} Year GitHub Veteran!`)
        }

        if (userData?.followers >= 100) achs.push(`👥 ${userData.followers}+ Followers!`)

        return achs
    }, [userData, repos, contributions])

    return (
        <group>
            {achievements.map((text, i) => {
                const angle = (i / achievements.length) * Math.PI * 2
                const radius = Math.min(
                    (bounds.maxX - bounds.minX) / 3,
                    60
                )
                const x = (bounds.minX + bounds.maxX) / 2 + Math.cos(angle) * radius
                const z = (bounds.minZ + bounds.maxZ) / 2 + Math.sin(angle) * radius

                return (
                    <group key={i} position={[x, 8, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
                        {/* Billboard pole */}
                        <mesh position={[0, -4, 0]}>
                            <cylinderGeometry args={[0.15, 0.15, 8, 6]} />
                            <meshStandardMaterial color="#444466" metalness={0.5} />
                        </mesh>
                        {/* Billboard panel */}
                        <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[8, 2.5, 0.2]} />
                            <meshStandardMaterial color="#1a1a3a" />
                        </mesh>
                        <Text
                            position={[0, 0, 0.15]}
                            fontSize={0.6}
                            color="#e8e8f0"
                            anchorX="center"
                            anchorY="middle"
                            maxWidth={7}
                        >
                            {text}
                        </Text>
                    </group>
                )
            })}
        </group>
    )
}

// ===========================
// Main City Scene
// ===========================
function CityScene() {
    const cityData = useStore((s) => s.cityData)
    const carTier = useStore((s) => s.carTier)
    const weather = useStore((s) => s.weather)
    const userData = useStore((s) => s.userData)
    const repos = useStore((s) => s.repos)
    const contributions = useStore((s) => s.contributions)

    if (!cityData) return null

    const { buildings, roads, parks, props, districts, bounds } = cityData

    // Weather → fog
    const fogColor = weather === 'clear' ? '#0a0a2a' : weather === 'cloudy' ? '#1a1a3a' : '#0d0d20'
    const fogNear = weather === 'foggy' ? 20 : weather === 'rainy' ? 40 : 80
    const fogFar = weather === 'foggy' ? 80 : weather === 'rainy' ? 120 : 300

    return (
        <div style={{ width: '100%', height: '100vh' }} id="city-canvas-container">
            <Canvas
                camera={{ position: [0, 30, 40], fov: 60, near: 0.1, far: 1000 }}
                shadows
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            >
                {/* Fog */}
                <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

                {/* Lighting */}
                <ambientLight intensity={0.3} color="#6670aa" />
                <directionalLight
                    position={[50, 80, 30]}
                    intensity={1.2}
                    color="#ffeedd"
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-left={-100}
                    shadow-camera-right={100}
                    shadow-camera-top={100}
                    shadow-camera-bottom={-100}
                />
                <pointLight position={[0, 20, 0]} intensity={0.5} color="#6c5ce7" distance={100} />

                {/* Sky */}
                <Sky sunPosition={[100, 50, 100]} turbidity={8} rayleigh={2} />

                {/* City elements */}
                <Buildings buildings={buildings} />
                <Roads bounds={bounds} />
                <StreetProps props={props} />
                <Parks parks={parks} />
                <Billboards userData={userData} repos={repos} contributions={contributions} bounds={bounds} />

                {/* Car */}
                <CarWrapper carTier={carTier} buildings={buildings} />

                {/* Camera controller */}
                <CameraController />

                {/* Post-processing */}
                <EffectComposer>
                    <Bloom
                        luminanceThreshold={0.8}
                        luminanceSmoothing={0.3}
                        intensity={0.8}
                        mipmapBlur
                    />
                </EffectComposer>
            </Canvas>
        </div>
    )
}

export default CityScene
