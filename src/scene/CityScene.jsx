import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/store'

// ===========================
// Window Texture Generator
// ===========================
function createWindowTexture(color, rows, cols) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    // Base building color
    const baseColor = new THREE.Color(color)
    ctx.fillStyle = `rgb(${Math.floor(baseColor.r * 80)}, ${Math.floor(baseColor.g * 80)}, ${Math.floor(baseColor.b * 80)})`
    ctx.fillRect(0, 0, 128, 256)

    // Window grid
    const winW = Math.floor(128 / (cols * 2))
    const winH = Math.floor(256 / (rows * 2))
    const padX = Math.floor(winW * 0.6)
    const padY = Math.floor(winH * 0.5)

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const lit = Math.random() > 0.3
            const x = padX + c * (winW + padX)
            const y = padY + r * (winH + padY)
            if (lit) {
                const warmth = 0.5 + Math.random() * 0.5
                ctx.fillStyle = `rgba(255, ${Math.floor(220 * warmth)}, ${Math.floor(140 * warmth)}, ${0.5 + Math.random() * 0.5})`
            } else {
                ctx.fillStyle = `rgba(30, 30, 50, 0.8)`
            }
            ctx.fillRect(x, y, winW - 2, winH - 2)
        }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
}

// ===========================
// Individual Building Component
// ===========================
function Building({ data }) {
    const meshRef = useRef()

    const texture = useMemo(() => {
        if (data.isPrivate) return null
        const rows = Math.max(3, Math.floor(data.height / 2))
        const cols = Math.max(2, Math.floor(data.width / 2))
        return createWindowTexture(data.color, rows, cols)
    }, [data])

    const color = useMemo(() => {
        const c = new THREE.Color(data.color)
        if (data.isWeathered) c.multiplyScalar(0.5)
        if (data.isInactive) c.multiplyScalar(0.3)
        if (data.isForked) c.lerp(new THREE.Color('#666688'), 0.3)
        if (data.isPrivate) c.set('#0a0a15')
        return c
    }, [data])

    const emissiveColor = useMemo(() => {
        if (data.isPrivate || data.isInactive) return new THREE.Color('#000000')
        return new THREE.Color(data.accentColor || data.color).multiplyScalar(0.15)
    }, [data])

    return (
        <group position={[data.x, 0, data.z]}>
            {/* Main body */}
            <mesh position={[0, data.height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[data.width, data.height, data.depth]} />
                <meshStandardMaterial
                    color={color}
                    map={texture}
                    roughness={data.isWeathered ? 0.95 : 0.6}
                    metalness={data.isPrivate ? 0 : 0.15}
                    emissive={emissiveColor}
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* Roof detail */}
            {!data.isPrivate && data.height > 8 && (
                <mesh position={[0, data.height + 0.3, 0]} castShadow>
                    <boxGeometry args={[data.width + 0.4, 0.6, data.depth + 0.4]} />
                    <meshStandardMaterial color={color.clone().multiplyScalar(0.7)} roughness={0.8} />
                </mesh>
            )}

            {/* Pinned/Landmark decorations */}
            {data.isPinned && (
                <>
                    {/* Spire */}
                    <mesh position={[0, data.height + 3, 0]} castShadow>
                        <coneGeometry args={[0.6, 5, 4]} />
                        <meshStandardMaterial
                            color={data.accentColor}
                            emissive={data.accentColor}
                            emissiveIntensity={0.5}
                            metalness={0.6}
                            roughness={0.2}
                        />
                    </mesh>
                    {/* Glow ring at base */}
                    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[data.width / 2 + 1, data.width / 2 + 1.5, 32]} />
                        <meshBasicMaterial color={data.accentColor} transparent opacity={0.4} side={THREE.DoubleSide} />
                    </mesh>
                    {/* Beacon light on top */}
                    <pointLight
                        position={[0, data.height + 5, 0]}
                        color={data.accentColor}
                        intensity={2}
                        distance={20}
                        decay={2}
                    />
                </>
            )}

            {/* AC unit / rooftop detail for tall buildings */}
            {data.height > 12 && !data.isPinned && (
                <mesh position={[data.width * 0.2, data.height + 0.8, data.depth * 0.2]} castShadow>
                    <boxGeometry args={[1.2, 1, 1]} />
                    <meshStandardMaterial color="#444455" roughness={0.9} metalness={0.3} />
                </mesh>
            )}
        </group>
    )
}

// ===========================
// Buildings Container
// ===========================
function Buildings({ buildings }) {
    const [hoveredBuilding, setHoveredBuilding] = useState(null)

    return (
        <group>
            {buildings.map((b) => (
                <Building key={b.id} data={b} />
            ))}

            {/* Tooltip */}
            {hoveredBuilding && (
                <Html position={[hoveredBuilding.x, hoveredBuilding.height + 3, hoveredBuilding.z]} center>
                    <div style={{
                        background: 'rgba(10,10,30,0.92)',
                        border: '1px solid rgba(108,92,231,0.4)',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        color: '#e8e8f0',
                        fontSize: '13px',
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                        backdropFilter: 'blur(10px)',
                        pointerEvents: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    }}>
                        <div style={{ fontWeight: 700, marginBottom: '3px' }}>{hoveredBuilding.name}</div>
                        <div style={{ fontSize: '11px', color: '#8888aa' }}>
                            ⭐ {hoveredBuilding.stars} &nbsp; 🍴 {hoveredBuilding.forks} &nbsp; {hoveredBuilding.language}
                        </div>
                        {hoveredBuilding.description && (
                            <div style={{ fontSize: '10px', color: '#666688', marginTop: '3px', maxWidth: '200px', whiteSpace: 'normal' }}>
                                {hoveredBuilding.description.slice(0, 80)}
                            </div>
                        )}
                    </div>
                </Html>
            )}
        </group>
    )
}

// ===========================
// Roads with lane markings
// ===========================
function Roads({ bounds }) {
    const step = 16
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

    // Create road texture
    const roadTexture = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 256
        const ctx = canvas.getContext('2d')

        // Asphalt
        ctx.fillStyle = '#1c1c2e'
        ctx.fillRect(0, 0, 64, 256)

        // Center line (dashed)
        ctx.strokeStyle = '#3a3a5a'
        ctx.lineWidth = 2
        ctx.setLineDash([16, 12])
        ctx.beginPath()
        ctx.moveTo(32, 0)
        ctx.lineTo(32, 256)
        ctx.stroke()

        // Edge lines
        ctx.setLineDash([])
        ctx.strokeStyle = '#2a2a4a'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(2, 0)
        ctx.lineTo(2, 256)
        ctx.moveTo(62, 0)
        ctx.lineTo(62, 256)
        ctx.stroke()

        const tex = new THREE.CanvasTexture(canvas)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        return tex
    }, [])

    return (
        <group>
            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.05, centerZ]} receiveShadow>
                <planeGeometry args={[width + 80, depth + 80]} />
                <meshStandardMaterial color="#080812" roughness={1} />
            </mesh>

            {/* Road segments */}
            {roads.map((road, i) => {
                if (road.type === 'h') {
                    return (
                        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.02, road.pos]}>
                            <planeGeometry args={[width + 60, 5]} />
                            <meshStandardMaterial color="#171728" roughness={0.85} />
                        </mesh>
                    )
                } else {
                    return (
                        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[road.pos, 0.02, centerZ]}>
                            <planeGeometry args={[5, depth + 60]} />
                            <meshStandardMaterial color="#171728" roughness={0.85} />
                        </mesh>
                    )
                }
            })}

            {/* Dashed center lines */}
            {roads.map((road, i) => {
                const dashes = []
                const dashLen = 2
                const gapLen = 3
                if (road.type === 'h') {
                    for (let x = bounds.minX; x < bounds.maxX; x += dashLen + gapLen) {
                        dashes.push(
                            <mesh key={`d-${i}-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x + dashLen / 2, 0.03, road.pos]}>
                                <planeGeometry args={[dashLen, 0.15]} />
                                <meshBasicMaterial color="#3a3a5a" />
                            </mesh>
                        )
                    }
                } else {
                    for (let z = bounds.minZ; z < bounds.maxZ; z += dashLen + gapLen) {
                        dashes.push(
                            <mesh key={`d-${i}-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[road.pos, 0.03, z + dashLen / 2]}>
                                <planeGeometry args={[0.15, dashLen]} />
                                <meshBasicMaterial color="#3a3a5a" />
                            </mesh>
                        )
                    }
                }
                return <group key={`dashes-${i}`}>{dashes}</group>
            })}

            {/* Sidewalk edges */}
            {roads.map((road, i) => {
                if (road.type === 'h') {
                    return (
                        <group key={`sw-${i}`}>
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.04, road.pos - 2.8]}>
                                <planeGeometry args={[width + 60, 0.6]} />
                                <meshStandardMaterial color="#222240" roughness={0.9} />
                            </mesh>
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.04, road.pos + 2.8]}>
                                <planeGeometry args={[width + 60, 0.6]} />
                                <meshStandardMaterial color="#222240" roughness={0.9} />
                            </mesh>
                        </group>
                    )
                } else {
                    return (
                        <group key={`sw-${i}`}>
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[road.pos - 2.8, 0.04, centerZ]}>
                                <planeGeometry args={[0.6, depth + 60]} />
                                <meshStandardMaterial color="#222240" roughness={0.9} />
                            </mesh>
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[road.pos + 2.8, 0.04, centerZ]}>
                                <planeGeometry args={[0.6, depth + 60]} />
                                <meshStandardMaterial color="#222240" roughness={0.9} />
                            </mesh>
                        </group>
                    )
                }
            })}
        </group>
    )
}

// ===========================
// Street Props (Lamps & Trees)
// ===========================
function StreetProps({ props: propData }) {
    const lamps = useMemo(() => propData.filter(p => p.type === 'lamp').slice(0, 300), [propData])
    const trees = useMemo(() => propData.filter(p => p.type === 'tree').slice(0, 200), [propData])

    return (
        <group>
            {/* Street lamps */}
            {lamps.map((l, i) => (
                <group key={`lamp-${i}`} position={[l.x, 0, l.z]}>
                    {/* Pole */}
                    <mesh position={[0, 2.5, 0]}>
                        <cylinderGeometry args={[0.06, 0.1, 5, 6]} />
                        <meshStandardMaterial color="#3a3a55" metalness={0.7} roughness={0.2} />
                    </mesh>
                    {/* Arm */}
                    <mesh position={[0.5, 4.8, 0]} rotation={[0, 0, -0.4]}>
                        <cylinderGeometry args={[0.04, 0.04, 1.2, 4]} />
                        <meshStandardMaterial color="#3a3a55" metalness={0.7} roughness={0.2} />
                    </mesh>
                    {/* Light bulb */}
                    <mesh position={[0.9, 4.9, 0]}>
                        <sphereGeometry args={[0.2, 8, 8]} />
                        <meshBasicMaterial color="#FFE4A0" />
                    </mesh>
                    {/* Point light */}
                    <pointLight position={[0.9, 4.5, 0]} color="#FFE0A0" intensity={0.8} distance={12} decay={2} />
                </group>
            ))}

            {/* Trees */}
            {trees.map((t, i) => (
                <group key={`tree-${i}`} position={[t.x, 0, t.z]}>
                    <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.12, 0.18, 3, 6]} />
                        <meshStandardMaterial color="#4A3528" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 3.5, 0]}>
                        <coneGeometry args={[1.4, 3, 7]} />
                        <meshStandardMaterial color="#1B5E20" roughness={0.85} />
                    </mesh>
                    <mesh position={[0, 4.8, 0]}>
                        <coneGeometry args={[1.0, 2, 7]} />
                        <meshStandardMaterial color="#2E7D32" roughness={0.85} />
                    </mesh>
                </group>
            ))}
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
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.03, p.z]} receiveShadow>
                        <planeGeometry args={[p.width, p.depth]} />
                        <meshStandardMaterial color="#0f2a14" roughness={0.95} />
                    </mesh>
                    {/* Park trees (rounded) */}
                    {Array.from({ length: 4 }).map((_, j) => {
                        const px = p.x + (j % 2 === 0 ? -1 : 1) * (1.5 + Math.random() * 2)
                        const pz = p.z + (j < 2 ? -1 : 1) * (1.5 + Math.random() * 2)
                        return (
                            <group key={j} position={[px, 0, pz]}>
                                <mesh position={[0, 1.2, 0]}>
                                    <cylinderGeometry args={[0.1, 0.15, 2.4, 6]} />
                                    <meshStandardMaterial color="#5C4033" roughness={0.9} />
                                </mesh>
                                <mesh position={[0, 3, 0]}>
                                    <sphereGeometry args={[1.3, 8, 6]} />
                                    <meshStandardMaterial color="#2E7D32" roughness={0.8} />
                                </mesh>
                            </group>
                        )
                    })}
                    {/* Bench */}
                    <mesh position={[p.x, 0.3, p.z + 2]}>
                        <boxGeometry args={[2, 0.15, 0.5]} />
                        <meshStandardMaterial color="#5C4033" roughness={0.9} />
                    </mesh>
                    <mesh position={[p.x - 0.8, 0.15, p.z + 2]}>
                        <boxGeometry args={[0.1, 0.3, 0.4]} />
                        <meshStandardMaterial color="#444" metalness={0.5} />
                    </mesh>
                    <mesh position={[p.x + 0.8, 0.15, p.z + 2]}>
                        <boxGeometry args={[0.1, 0.3, 0.4]} />
                        <meshStandardMaterial color="#444" metalness={0.5} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// ===========================
// Procedural Car (6 tiers)
// ===========================
const CAR_CONFIGS = [
    { color: '#8B7355', bodyH: 1.3, bodyW: 2.2, bodyL: 4.0, roofH: 1.0, roofL: 0.55, speed: 20, wheelR: 0.4 },
    { color: '#5B8DEF', bodyH: 1.2, bodyW: 2.1, bodyL: 4.3, roofH: 0.9, roofL: 0.50, speed: 32, wheelR: 0.38 },
    { color: '#FF6B6B', bodyH: 1.0, bodyW: 2.0, bodyL: 4.6, roofH: 0.7, roofL: 0.45, speed: 48, wheelR: 0.36 },
    { color: '#FFA726', bodyH: 1.1, bodyW: 2.3, bodyL: 5.0, roofH: 0.6, roofL: 0.40, speed: 58, wheelR: 0.42 },
    { color: '#AB47BC', bodyH: 0.9, bodyW: 2.1, bodyL: 5.3, roofH: 0.5, roofL: 0.38, speed: 72, wheelR: 0.35 },
    { color: '#00E676', bodyH: 0.75, bodyW: 2.0, bodyL: 5.6, roofH: 0.35, roofL: 0.35, speed: 92, wheelR: 0.33 },
]

function Car({ carTier, buildings }) {
    const groupRef = useRef()
    const setCarSpeed = useStore((s) => s.setCarSpeed)
    const config = CAR_CONFIGS[carTier] || CAR_CONFIGS[0]
    const { bodyH, bodyW, bodyL, roofH, roofL, speed: maxSpeed, wheelR } = config

    const state = useRef({
        velocity: 0,
        rotation: 0,
        position: new THREE.Vector3(8, 0, 8),
        keys: {},
    })

    useEffect(() => {
        const onKey = (e) => {
            const key = e.key.toLowerCase()
            const map = { w: 'w', arrowup: 'w', s: 's', arrowdown: 's', a: 'a', arrowleft: 'a', d: 'd', arrowright: 'd' }
            const mapped = map[key]
            if (mapped) state.current.keys[mapped] = e.type === 'keydown'
        }
        window.addEventListener('keydown', onKey)
        window.addEventListener('keyup', onKey)
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
    }, [])

    useFrame((_, delta) => {
        const s = state.current
        const dt = Math.min(delta, 0.05)
        const accel = maxSpeed * 1.8
        const friction = 0.94
        const turnSpeed = 2.8

        if (s.keys.w) s.velocity = Math.min(s.velocity + accel * dt, maxSpeed)
        else if (s.keys.s) s.velocity = Math.max(s.velocity - accel * dt, -maxSpeed * 0.35)
        else s.velocity *= friction

        if (Math.abs(s.velocity) < 0.1) s.velocity = 0

        if (Math.abs(s.velocity) > 1) {
            const turnFactor = Math.min(Math.abs(s.velocity) / maxSpeed, 1)
            if (s.keys.a) s.rotation += turnSpeed * dt * turnFactor * Math.sign(s.velocity)
            if (s.keys.d) s.rotation -= turnSpeed * dt * turnFactor * Math.sign(s.velocity)
        }

        const dx = -Math.sin(s.rotation) * s.velocity * dt
        const dz = -Math.cos(s.rotation) * s.velocity * dt
        const newX = s.position.x + dx
        const newZ = s.position.z + dz

        // Collision detection
        let collided = false
        for (const b of buildings) {
            const hw = b.width / 2 + 1.8
            const hd = b.depth / 2 + 1.8
            if (newX > b.x - hw && newX < b.x + hw && newZ > b.z - hd && newZ < b.z + hd) {
                collided = true
                break
            }
        }

        if (!collided) {
            s.position.x = newX
            s.position.z = newZ
        } else {
            s.velocity *= -0.2
        }

        if (groupRef.current) {
            groupRef.current.position.set(s.position.x, 0, s.position.z)
            groupRef.current.rotation.y = s.rotation
        }

        setCarSpeed(Math.abs(s.velocity) * 3.6)
    })

    const wheelPositions = [
        [-bodyW / 2 - 0.1, wheelR, bodyL * 0.3],
        [bodyW / 2 + 0.1, wheelR, bodyL * 0.3],
        [-bodyW / 2 - 0.1, wheelR, -bodyL * 0.3],
        [bodyW / 2 + 0.1, wheelR, -bodyL * 0.3],
    ]

    return (
        <group ref={groupRef} userData={{ isCar: true }}>
            {/* Body */}
            <mesh position={[0, bodyH / 2 + wheelR * 1.2, 0]} castShadow>
                <boxGeometry args={[bodyW, bodyH, bodyL]} />
                <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.25} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, bodyH + wheelR * 1.2 + roofH / 2, bodyL * -0.05]} castShadow>
                <boxGeometry args={[bodyW - 0.3, roofH, bodyL * roofL]} />
                <meshStandardMaterial color={config.color} metalness={0.6} roughness={0.15} transparent opacity={0.85} />
            </mesh>
            {/* Hood slope */}
            <mesh position={[0, bodyH * 0.7 + wheelR * 1.2, bodyL * 0.35]} castShadow>
                <boxGeometry args={[bodyW - 0.1, bodyH * 0.3, bodyL * 0.25]} />
                <meshStandardMaterial color={config.color} metalness={0.5} roughness={0.25} />
            </mesh>

            {/* Wheels */}
            {wheelPositions.map(([x, y, z], i) => (
                <group key={i} position={[x, y, z]}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[wheelR, wheelR, 0.25, 16]} />
                        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
                    </mesh>
                    {/* Hubcap */}
                    <mesh rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? -0.13 : 0.13, 0, 0]}>
                        <cylinderGeometry args={[wheelR * 0.6, wheelR * 0.6, 0.02, 12]} />
                        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
                    </mesh>
                </group>
            ))}

            {/* Headlights */}
            {[[-0.65, bodyH * 0.5 + wheelR * 1.2, bodyL / 2 + 0.02], [0.65, bodyH * 0.5 + wheelR * 1.2, bodyL / 2 + 0.02]].map(([x, y, z], i) => (
                <group key={`hl-${i}`}>
                    <mesh position={[x, y, z]}>
                        <boxGeometry args={[0.35, 0.2, 0.05]} />
                        <meshBasicMaterial color="#FFFDE0" />
                    </mesh>
                    <pointLight position={[x, y, z + 2]} color="#FFFDE0" intensity={1.5} distance={25} decay={2} />
                </group>
            ))}

            {/* Taillights */}
            {[[-0.75, bodyH * 0.5 + wheelR * 1.2, -bodyL / 2 - 0.02], [0.75, bodyH * 0.5 + wheelR * 1.2, -bodyL / 2 - 0.02]].map(([x, y, z], i) => (
                <mesh key={`tl-${i}`} position={[x, y, z]}>
                    <boxGeometry args={[0.3, 0.15, 0.05]} />
                    <meshBasicMaterial color="#FF2222" />
                </mesh>
            ))}

            {/* Spoiler for higher tiers */}
            {carTier >= 3 && (
                <group position={[0, bodyH + wheelR * 1.2 + 0.1, -bodyL * 0.45]}>
                    {/* Spoiler wing */}
                    <mesh>
                        <boxGeometry args={[bodyW + 0.2, 0.08, 0.6]} />
                        <meshStandardMaterial color={config.color} metalness={0.6} roughness={0.2} />
                    </mesh>
                    {/* Supports */}
                    <mesh position={[-0.6, -0.3, 0]}>
                        <boxGeometry args={[0.08, 0.6, 0.08]} />
                        <meshStandardMaterial color="#333" metalness={0.5} />
                    </mesh>
                    <mesh position={[0.6, -0.3, 0]}>
                        <boxGeometry args={[0.08, 0.6, 0.08]} />
                        <meshStandardMaterial color="#333" metalness={0.5} />
                    </mesh>
                </group>
            )}
        </group>
    )
}

// ===========================
// Camera Controller
// ===========================
function CameraController() {
    const { camera, scene } = useThree()
    const targetPos = useRef(new THREE.Vector3(0, 30, 40))
    const lookTarget = useRef(new THREE.Vector3(0, 0, 0))
    const initialized = useRef(false)

    useFrame(() => {
        let carPos = null
        let carRot = 0

        scene.traverse((obj) => {
            if (obj.userData?.isCar) {
                carPos = obj.position.clone()
                carRot = obj.rotation.y
            }
        })

        if (carPos) {
            if (!initialized.current) {
                // Initial overhead view
                targetPos.current.set(carPos.x, 40, carPos.z + 40)
                lookTarget.current.copy(carPos)
                camera.position.copy(targetPos.current)
                initialized.current = true
            }

            const offset = new THREE.Vector3(
                Math.sin(carRot) * 18,
                12,
                Math.cos(carRot) * 18
            )
            const desired = carPos.clone().add(offset)
            targetPos.current.lerp(desired, 0.04)
            lookTarget.current.lerp(carPos.clone().add(new THREE.Vector3(0, 2, 0)), 0.08)
        }

        camera.position.lerp(targetPos.current, 0.06)
        camera.lookAt(lookTarget.current)
    })

    return null
}

// ===========================
// Day/Night Cycle
// ===========================
function DayNightCycle() {
    const lightRef = useRef()

    useFrame(() => {
        const now = new Date()
        const hours = now.getHours() + now.getMinutes() / 60
        // Map 0-24 hours to sun angle
        const angle = ((hours - 6) / 24) * Math.PI * 2
        const sunY = Math.sin(angle) * 80
        const sunX = Math.cos(angle) * 100

        if (lightRef.current) {
            lightRef.current.position.set(sunX, Math.max(sunY, 5), 50)
            const dayIntensity = Math.max(0.1, Math.sin(angle))
            lightRef.current.intensity = dayIntensity * 1.5
        }
    })

    return (
        <directionalLight
            ref={lightRef}
            position={[50, 80, 50]}
            intensity={1.2}
            color="#ffeedd"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
        />
    )
}

// ===========================
// Weather Effects
// ===========================
function Rain() {
    const rainRef = useRef()
    const count = 2000
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 200
            pos[i * 3 + 1] = Math.random() * 60
            pos[i * 3 + 2] = (Math.random() - 0.5) * 200
        }
        return pos
    }, [])

    useFrame(() => {
        if (rainRef.current) {
            const posArr = rainRef.current.geometry.attributes.position.array
            for (let i = 0; i < count; i++) {
                posArr[i * 3 + 1] -= 0.8
                if (posArr[i * 3 + 1] < 0) posArr[i * 3 + 1] = 50 + Math.random() * 10
            }
            rainRef.current.geometry.attributes.position.needsUpdate = true
        }
    })

    return (
        <points ref={rainRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.1} color="#6688cc" transparent opacity={0.4} sizeAttenuation />
        </points>
    )
}

// ===========================
// Billboards (Achievements)
// ===========================
function Billboards({ userData, repos, contributions, bounds }) {
    const achievements = useMemo(() => {
        const achs = []
        if (!repos || !userData) return achs
        const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

        if (totalStars >= 100) achs.push('⭐ 100+ Stars Earned!')
        if (totalStars >= 1000) achs.push('🌟 1000+ Stars!')
        if (repos.length >= 50) achs.push('🏗️ 50+ Repos!')
        if (repos.length >= 10) achs.push('📦 10+ Repos!')
        if (contributions >= 500) achs.push('🔥 500+ Contributions!')
        if (contributions >= 1000) achs.push('💫 1000+ Contributions!')

        const langCounts = {}
        repos.forEach(r => { if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1 })
        const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]
        if (topLang) achs.push(`🏆 Top: ${topLang[0]}`)

        if (userData?.followers >= 50) achs.push(`👥 ${userData.followers} Followers`)

        if (userData?.created_at) {
            const years = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            if (years >= 3) achs.push(`🎂 ${years}yr Veteran`)
        }

        return achs.slice(0, 8)
    }, [userData, repos, contributions])

    if (achievements.length === 0) return null

    return (
        <group>
            {achievements.map((text, i) => {
                const angle = (i / achievements.length) * Math.PI * 2
                const radius = Math.min((bounds.maxX - bounds.minX) / 3, 60)
                const cx = (bounds.minX + bounds.maxX) / 2
                const cz = (bounds.minZ + bounds.maxZ) / 2
                const x = cx + Math.cos(angle) * radius
                const z = cz + Math.sin(angle) * radius

                return (
                    <group key={i} position={[x, 0, z]}>
                        {/* Pole */}
                        <mesh position={[0, 4, 0]}>
                            <cylinderGeometry args={[0.12, 0.15, 8, 6]} />
                            <meshStandardMaterial color="#3a3a55" metalness={0.5} roughness={0.3} />
                        </mesh>
                        {/* Panel */}
                        <mesh position={[0, 8.5, 0]} rotation={[0, -angle + Math.PI / 2, 0]}>
                            <boxGeometry args={[7, 2, 0.15]} />
                            <meshStandardMaterial color="#12122a" roughness={0.8} />
                        </mesh>
                        {/* Border glow */}
                        <mesh position={[0, 8.5, 0.09]} rotation={[0, -angle + Math.PI / 2, 0]}>
                            <boxGeometry args={[7.2, 2.2, 0.02]} />
                            <meshBasicMaterial color="#6c5ce7" transparent opacity={0.2} />
                        </mesh>
                        <Html position={[0, 8.5, 0.15]} rotation={[0, -angle + Math.PI / 2, 0]} center transform>
                            <div style={{
                                color: '#e8e8f0', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                                fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap',
                                textShadow: '0 0 10px rgba(108,92,231,0.5)',
                                pointerEvents: 'none',
                            }}>
                                {text}
                            </div>
                        </Html>
                    </group>
                )
            })}
        </group>
    )
}

// ===========================
// District Labels
// ===========================
function DistrictLabels({ districts }) {
    return (
        <group>
            {districts.map((d, i) => {
                const cx = (d.bounds.minX + d.bounds.maxX) / 2
                const cz = (d.bounds.minZ + d.bounds.maxZ) / 2
                return (
                    <group key={i} position={[cx, 2, cz - 8]}>
                        <Html center transform>
                            <div style={{
                                color: d.style.accent, fontSize: '20px',
                                fontFamily: 'Orbitron, sans-serif', fontWeight: 700,
                                letterSpacing: '2px', whiteSpace: 'nowrap',
                                textShadow: `0 0 15px ${d.style.accent}`,
                                pointerEvents: 'none', opacity: 0.8,
                            }}>
                                {d.language}
                            </div>
                        </Html>
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

    const fogColor = weather === 'clear' ? '#070714' : weather === 'cloudy' ? '#0d0d20' : '#050510'
    const fogNear = weather === 'foggy' ? 15 : weather === 'rainy' ? 30 : 60
    const fogFar = weather === 'foggy' ? 60 : weather === 'rainy' ? 100 : 250

    return (
        <div style={{ width: '100%', height: '100vh' }} id="city-canvas-container">
            <Canvas
                camera={{ position: [0, 40, 50], fov: 55, near: 0.1, far: 1000 }}
                shadows
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0,
                    powerPreference: 'high-performance',
                }}
            >
                <color attach="background" args={[fogColor]} />
                <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

                {/* Ambient + Day/Night */}
                <ambientLight intensity={0.35} color="#5566aa" />
                <DayNightCycle />
                <pointLight position={[0, 30, 0]} intensity={0.4} color="#6c5ce7" distance={150} />
                <hemisphereLight intensity={0.2} color="#6666aa" groundColor="#000011" />

                {/* City elements */}
                <Buildings buildings={buildings} />
                <Roads bounds={bounds} />
                <StreetProps props={props} />
                <Parks parks={parks} />
                <DistrictLabels districts={districts} />
                <Billboards userData={userData} repos={repos} contributions={contributions} bounds={bounds} />

                {/* Weather */}
                {weather === 'rainy' && <Rain />}

                {/* Car */}
                <Car carTier={carTier} buildings={buildings} />

                {/* Camera */}
                <CameraController />
            </Canvas>
        </div>
    )
}

export default CityScene
