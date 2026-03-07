import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/store'

// ===========================
// Shared materials (reuse across all meshes)
// ===========================
const SHARED_MATERIALS = {
    road: new THREE.MeshStandardMaterial({ color: '#171728', roughness: 0.85 }),
    ground: new THREE.MeshStandardMaterial({ color: '#080812', roughness: 1 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: '#222240', roughness: 0.9 }),
    dashLine: new THREE.MeshBasicMaterial({ color: '#3a3a5a' }),
    lampPole: new THREE.MeshStandardMaterial({ color: '#3a3a55', metalness: 0.7, roughness: 0.2 }),
    lampBulb: new THREE.MeshBasicMaterial({ color: '#FFE4A0' }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: '#4A3528', roughness: 0.9 }),
    treeTop1: new THREE.MeshStandardMaterial({ color: '#1B5E20', roughness: 0.85 }),
    treeTop2: new THREE.MeshStandardMaterial({ color: '#2E7D32', roughness: 0.85 }),
    parkGround: new THREE.MeshStandardMaterial({ color: '#0f2a14', roughness: 0.95 }),
    wheel: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.95 }),
    hubcap: new THREE.MeshStandardMaterial({ color: '#888', metalness: 0.8, roughness: 0.2 }),
    headlight: new THREE.MeshBasicMaterial({ color: '#FFFDE0' }),
    taillight: new THREE.MeshBasicMaterial({ color: '#FF2222' }),
    rooftopUnit: new THREE.MeshStandardMaterial({ color: '#444455', roughness: 0.9, metalness: 0.3 }),
    billboard: new THREE.MeshStandardMaterial({ color: '#12122a', roughness: 0.8 }),
    billboardGlow: new THREE.MeshBasicMaterial({ color: '#6c5ce7', transparent: true, opacity: 0.2 }),
}

// Shared geometries
const SHARED_GEOS = {
    box: new THREE.BoxGeometry(1, 1, 1),
    lampPole: new THREE.CylinderGeometry(0.06, 0.1, 5, 6),
    lampArm: new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4),
    lampBulb: new THREE.SphereGeometry(0.2, 6, 6),
    treeTrunk: new THREE.CylinderGeometry(0.12, 0.18, 3, 5),
    treeTop1: new THREE.ConeGeometry(1.4, 3, 5),
    treeTop2: new THREE.ConeGeometry(1.0, 2, 5),
    cone: new THREE.ConeGeometry(0.6, 5, 4),
    wheel: new THREE.CylinderGeometry(0.38, 0.38, 0.25, 10),
}

// ===========================
// Instanced Buildings (HUGE perf gain)
// ===========================
function InstancedBuildings({ buildings }) {
    const meshRef = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])

    const { colorArray, count } = useMemo(() => {
        const colors = new Float32Array(buildings.length * 3)
        buildings.forEach((b, i) => {
            const c = new THREE.Color(b.color)
            if (b.isWeathered) c.multiplyScalar(0.5)
            if (b.isInactive) c.multiplyScalar(0.3)
            if (b.isForked) c.lerp(new THREE.Color('#666688'), 0.3)
            if (b.isPrivate) c.set('#0a0a15')
            colors[i * 3] = c.r
            colors[i * 3 + 1] = c.g
            colors[i * 3 + 2] = c.b
        })
        return { colorArray: colors, count: buildings.length }
    }, [buildings])

    useEffect(() => {
        if (!meshRef.current || count === 0) return
        buildings.forEach((b, i) => {
            dummy.position.set(b.x, b.height / 2, b.z)
            dummy.scale.set(b.width, b.height, b.depth)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
        meshRef.current.geometry.setAttribute(
            'color', new THREE.InstancedBufferAttribute(colorArray, 3)
        )
    }, [buildings, colorArray, count, dummy])

    if (count === 0) return null

    return (
        <instancedMesh ref={meshRef} args={[SHARED_GEOS.box, null, count]} castShadow receiveShadow frustumCulled={false}>
            <meshStandardMaterial vertexColors roughness={0.6} metalness={0.15} />
        </instancedMesh>
    )
}

// ===========================
// Landmark decorations (only for pinned, max ~3)
// ===========================
function Landmarks({ buildings }) {
    const pinned = useMemo(() => buildings.filter(b => b.isPinned), [buildings])
    if (pinned.length === 0) return null

    return (
        <group>
            {pinned.map(b => (
                <group key={b.id} position={[b.x, b.height, b.z]}>
                    <mesh position={[0, 3, 0]} castShadow geometry={SHARED_GEOS.cone}>
                        <meshStandardMaterial color={b.accentColor} emissive={b.accentColor} emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[b.width / 2 + 1, b.width / 2 + 1.5, 16]} />
                        <meshBasicMaterial color={b.accentColor} transparent opacity={0.3} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// ===========================
// Roof details (only for tall buildings, instanced)
// ===========================
function RoofDetails({ buildings }) {
    const meshRef = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])
    const tallBuildings = useMemo(() => buildings.filter(b => b.height > 12 && !b.isPinned), [buildings])

    useEffect(() => {
        if (!meshRef.current || tallBuildings.length === 0) return
        tallBuildings.forEach((b, i) => {
            dummy.position.set(b.x + b.width * 0.2, b.height + 0.8, b.z + b.depth * 0.2)
            dummy.scale.set(1.2, 1, 1)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [tallBuildings, dummy])

    if (tallBuildings.length === 0) return null

    return (
        <instancedMesh ref={meshRef} args={[SHARED_GEOS.box, SHARED_MATERIALS.rooftopUnit, tallBuildings.length]} castShadow frustumCulled={false} />
    )
}

// ===========================
// Roads (simplified, fewer meshes)
// ===========================
function Roads({ bounds }) {
    const step = 16
    const width = bounds.maxX - bounds.minX
    const depth = bounds.maxZ - bounds.minZ
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerZ = (bounds.minZ + bounds.maxZ) / 2

    const { hRoads, vRoads } = useMemo(() => {
        const h = [], v = []
        for (let z = Math.floor(bounds.minZ / step) * step; z <= bounds.maxZ; z += step) h.push(z)
        for (let x = Math.floor(bounds.minX / step) * step; x <= bounds.maxX; x += step) v.push(x)
        return { hRoads: h, vRoads: v }
    }, [bounds])

    // Merge all horizontal roads into one merged geometry
    const hRoadGeo = useMemo(() => {
        const geo = new THREE.PlaneGeometry(width + 60, 5)
        return geo
    }, [width])

    const vRoadGeo = useMemo(() => {
        const geo = new THREE.PlaneGeometry(5, depth + 60)
        return geo
    }, [depth])

    return (
        <group>
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.05, centerZ]} receiveShadow material={SHARED_MATERIALS.ground}>
                <planeGeometry args={[width + 80, depth + 80]} />
            </mesh>

            {/* Horizontal roads */}
            {hRoads.map((z, i) => (
                <mesh key={`h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.02, z]} geometry={hRoadGeo} material={SHARED_MATERIALS.road} />
            ))}

            {/* Vertical roads */}
            {vRoads.map((x, i) => (
                <mesh key={`v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, centerZ]} geometry={vRoadGeo} material={SHARED_MATERIALS.road} />
            ))}

            {/* Center lines — single merged geometry per direction instead of hundreds of dash meshes */}
            {hRoads.map((z, i) => (
                <mesh key={`cl-h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.03, z]} material={SHARED_MATERIALS.dashLine}>
                    <planeGeometry args={[width + 40, 0.12]} />
                </mesh>
            ))}
            {vRoads.map((x, i) => (
                <mesh key={`cl-v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, centerZ]} material={SHARED_MATERIALS.dashLine}>
                    <planeGeometry args={[0.12, depth + 40]} />
                </mesh>
            ))}
        </group>
    )
}

// ===========================
// Instanced Street Lamps (NO point lights!)
// ===========================
function InstancedLamps({ lamps }) {
    const poleRef = useRef()
    const armRef = useRef()
    const bulbRef = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])
    const count = Math.min(lamps.length, 200) // Cap at 200

    useEffect(() => {
        if (!poleRef.current) return
        for (let i = 0; i < count; i++) {
            const l = lamps[i]
            // Pole
            dummy.position.set(l.x, 2.5, l.z)
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            poleRef.current.setMatrixAt(i, dummy.matrix)
            // Arm
            dummy.position.set(l.x + 0.5, 4.8, l.z)
            dummy.rotation.set(0, 0, -0.4)
            dummy.updateMatrix()
            armRef.current.setMatrixAt(i, dummy.matrix)
            dummy.rotation.set(0, 0, 0)
            // Bulb
            dummy.position.set(l.x + 0.9, 4.9, l.z)
            dummy.updateMatrix()
            bulbRef.current.setMatrixAt(i, dummy.matrix)
        }
        poleRef.current.instanceMatrix.needsUpdate = true
        armRef.current.instanceMatrix.needsUpdate = true
        bulbRef.current.instanceMatrix.needsUpdate = true
    }, [lamps, count, dummy])

    if (count === 0) return null

    return (
        <group>
            <instancedMesh ref={poleRef} args={[SHARED_GEOS.lampPole, SHARED_MATERIALS.lampPole, count]} frustumCulled={false} />
            <instancedMesh ref={armRef} args={[SHARED_GEOS.lampArm, SHARED_MATERIALS.lampPole, count]} frustumCulled={false} />
            <instancedMesh ref={bulbRef} args={[SHARED_GEOS.lampBulb, SHARED_MATERIALS.lampBulb, count]} frustumCulled={false} />
        </group>
    )
}

// ===========================
// Instanced Trees
// ===========================
function InstancedTrees({ trees }) {
    const trunkRef = useRef()
    const top1Ref = useRef()
    const top2Ref = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])
    const count = Math.min(trees.length, 150) // Cap

    useEffect(() => {
        if (!trunkRef.current) return
        for (let i = 0; i < count; i++) {
            const t = trees[i]
            dummy.position.set(t.x, 1.5, t.z)
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            trunkRef.current.setMatrixAt(i, dummy.matrix)

            dummy.position.set(t.x, 3.5, t.z)
            dummy.updateMatrix()
            top1Ref.current.setMatrixAt(i, dummy.matrix)

            dummy.position.set(t.x, 4.8, t.z)
            dummy.updateMatrix()
            top2Ref.current.setMatrixAt(i, dummy.matrix)
        }
        trunkRef.current.instanceMatrix.needsUpdate = true
        top1Ref.current.instanceMatrix.needsUpdate = true
        top2Ref.current.instanceMatrix.needsUpdate = true
    }, [trees, count, dummy])

    if (count === 0) return null

    return (
        <group>
            <instancedMesh ref={trunkRef} args={[SHARED_GEOS.treeTrunk, SHARED_MATERIALS.treeTrunk, count]} frustumCulled={false} />
            <instancedMesh ref={top1Ref} args={[SHARED_GEOS.treeTop1, SHARED_MATERIALS.treeTop1, count]} frustumCulled={false} />
            <instancedMesh ref={top2Ref} args={[SHARED_GEOS.treeTop2, SHARED_MATERIALS.treeTop2, count]} frustumCulled={false} />
        </group>
    )
}

// ===========================
// Street Props (dispatches to instanced sub-components)
// ===========================
function StreetProps({ props: propData }) {
    const lamps = useMemo(() => propData.filter(p => p.type === 'lamp'), [propData])
    const trees = useMemo(() => propData.filter(p => p.type === 'tree'), [propData])

    return (
        <group>
            <InstancedLamps lamps={lamps} />
            <InstancedTrees trees={trees} />
        </group>
    )
}

// ===========================
// Parks (pre-computed positions)
// ===========================
function Parks({ parks }) {
    // Pre-compute tree positions once (not in render)
    const parkData = useMemo(() => {
        return parks.map(p => ({
            ...p,
            trees: Array.from({ length: 3 }, (_, j) => ({
                x: p.x + (j % 2 === 0 ? -1 : 1) * (1.5 + (j * 0.7)),
                z: p.z + (j < 2 ? -1 : 1) * (1.5 + (j * 0.5)),
            })),
        }))
    }, [parks])

    if (parkData.length === 0) return null

    return (
        <group>
            {parkData.map((p, i) => (
                <group key={i}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.03, p.z]} material={SHARED_MATERIALS.parkGround}>
                        <planeGeometry args={[p.width, p.depth]} />
                    </mesh>
                    {p.trees.map((t, j) => (
                        <group key={j} position={[t.x, 0, t.z]}>
                            <mesh position={[0, 1.2, 0]} geometry={SHARED_GEOS.treeTrunk} material={SHARED_MATERIALS.treeTrunk} />
                            <mesh position={[0, 3, 0]}>
                                <sphereGeometry args={[1.2, 6, 5]} />
                                <meshStandardMaterial color="#2E7D32" roughness={0.8} />
                            </mesh>
                        </group>
                    ))}
                </group>
            ))}
        </group>
    )
}

// ===========================
// Car (optimized — shared geometries)
// ===========================
const CAR_CONFIGS = [
    { color: '#8B7355', bodyH: 1.3, bodyW: 2.2, bodyL: 4.0, roofH: 1.0, roofL: 0.55, speed: 20, wheelR: 0.4 },
    { color: '#5B8DEF', bodyH: 1.2, bodyW: 2.1, bodyL: 4.3, roofH: 0.9, roofL: 0.50, speed: 32, wheelR: 0.38 },
    { color: '#FF6B6B', bodyH: 1.0, bodyW: 2.0, bodyL: 4.6, roofH: 0.7, roofL: 0.45, speed: 48, wheelR: 0.36 },
    { color: '#FFA726', bodyH: 1.1, bodyW: 2.3, bodyL: 5.0, roofH: 0.6, roofL: 0.40, speed: 58, wheelR: 0.42 },
    { color: '#AB47BC', bodyH: 0.9, bodyW: 2.1, bodyL: 5.3, roofH: 0.5, roofL: 0.38, speed: 72, wheelR: 0.35 },
    { color: '#00E676', bodyH: 0.75, bodyW: 2.0, bodyL: 5.6, roofH: 0.35, roofL: 0.35, speed: 92, wheelR: 0.33 },
]

// Ref to share car position with camera without scene traversal
const carStateRef = { current: { position: new THREE.Vector3(8, 0, 8), rotation: 0 } }

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

    // Build spatial hash for collision detection (O(1) instead of O(n))
    const spatialHash = useMemo(() => {
        const cellSize = 8
        const hash = new Map()
        for (const b of buildings) {
            const cx = Math.floor(b.x / cellSize)
            const cz = Math.floor(b.z / cellSize)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const key = `${cx + dx},${cz + dz}`
                    if (!hash.has(key)) hash.set(key, [])
                    hash.get(key).push(b)
                }
            }
        }
        return { hash, cellSize }
    }, [buildings])

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
        const dampingPer60 = 0.94
        const damping = Math.pow(dampingPer60, dt * 60)
        const turnSpeed = 2.8

        if (s.keys.w) s.velocity = Math.min(s.velocity + accel * dt, maxSpeed)
        else if (s.keys.s) s.velocity = Math.max(s.velocity - accel * dt, -maxSpeed * 0.35)
        else s.velocity *= damping

        if (Math.abs(s.velocity) < 0.1) s.velocity = 0

        if (Math.abs(s.velocity) > 1) {
            const tf = Math.min(Math.abs(s.velocity) / maxSpeed, 1)
            if (s.keys.a) s.rotation += turnSpeed * dt * tf * Math.sign(s.velocity)
            if (s.keys.d) s.rotation -= turnSpeed * dt * tf * Math.sign(s.velocity)
        }

        const dx = -Math.sin(s.rotation) * s.velocity * dt
        const dz = -Math.cos(s.rotation) * s.velocity * dt
        const newX = s.position.x + dx
        const newZ = s.position.z + dz

        // Spatial hash collision (O(1) average)
        let collided = false
        const cx = Math.floor(newX / spatialHash.cellSize)
        const cz = Math.floor(newZ / spatialHash.cellSize)
        const key = `${cx},${cz}`
        const nearby = spatialHash.hash.get(key)
        if (nearby) {
            for (const b of nearby) {
                const hw = b.width / 2 + 1.8
                const hd = b.depth / 2 + 1.8
                if (newX > b.x - hw && newX < b.x + hw && newZ > b.z - hd && newZ < b.z + hd) {
                    collided = true
                    break
                }
            }
        }

        if (!collided) { s.position.x = newX; s.position.z = newZ }
        else s.velocity *= -0.2

        if (groupRef.current) {
            groupRef.current.position.set(s.position.x, 0, s.position.z)
            groupRef.current.rotation.y = s.rotation
        }

        // Share car state with camera via ref (no scene traversal!)
        carStateRef.current.position.copy(s.position)
        carStateRef.current.rotation = s.rotation

        setCarSpeed(Math.abs(s.velocity) * 3.6)
    })

    const carMaterial = useMemo(() => (
        new THREE.MeshStandardMaterial({ color: config.color, metalness: 0.5, roughness: 0.25 })
    ), [config.color])

    return (
        <group ref={groupRef}>
            {/* Body */}
            <mesh position={[0, bodyH / 2 + wheelR * 1.2, 0]} castShadow material={carMaterial}>
                <boxGeometry args={[bodyW, bodyH, bodyL]} />
            </mesh>
            {/* Roof */}
            <mesh position={[0, bodyH + wheelR * 1.2 + roofH / 2, bodyL * -0.05]} castShadow>
                <boxGeometry args={[bodyW - 0.3, roofH, bodyL * roofL]} />
                <meshStandardMaterial color={config.color} metalness={0.6} roughness={0.15} transparent opacity={0.85} />
            </mesh>
            {/* Hood */}
            <mesh position={[0, bodyH * 0.7 + wheelR * 1.2, bodyL * 0.35]} castShadow material={carMaterial}>
                <boxGeometry args={[bodyW - 0.1, bodyH * 0.3, bodyL * 0.25]} />
            </mesh>
            {/* Wheels (shared geometry & material) */}
            {[[-bodyW / 2 - 0.1, wheelR, bodyL * 0.3], [bodyW / 2 + 0.1, wheelR, bodyL * 0.3],
            [-bodyW / 2 - 0.1, wheelR, -bodyL * 0.3], [bodyW / 2 + 0.1, wheelR, -bodyL * 0.3]].map(([x, y, z], i) => (
                <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} geometry={SHARED_GEOS.wheel} material={SHARED_MATERIALS.wheel} />
            ))}
            {/* Headlights */}
            <mesh position={[-0.65, bodyH * 0.5 + wheelR * 1.2, bodyL / 2 + 0.02]} material={SHARED_MATERIALS.headlight}>
                <boxGeometry args={[0.35, 0.2, 0.05]} />
            </mesh>
            <mesh position={[0.65, bodyH * 0.5 + wheelR * 1.2, bodyL / 2 + 0.02]} material={SHARED_MATERIALS.headlight}>
                <boxGeometry args={[0.35, 0.2, 0.05]} />
            </mesh>
            {/* Taillights */}
            <mesh position={[-0.75, bodyH * 0.5 + wheelR * 1.2, -bodyL / 2 - 0.02]} material={SHARED_MATERIALS.taillight}>
                <boxGeometry args={[0.3, 0.15, 0.05]} />
            </mesh>
            <mesh position={[0.75, bodyH * 0.5 + wheelR * 1.2, -bodyL / 2 - 0.02]} material={SHARED_MATERIALS.taillight}>
                <boxGeometry args={[0.3, 0.15, 0.05]} />
            </mesh>
            {/* Single headlight for the car (just 1 light, not per-lamp) */}
            <pointLight position={[0, bodyH * 0.5 + wheelR, bodyL / 2 + 3]} color="#FFFDE0" intensity={2} distance={30} decay={2} />
            {/* Spoiler for higher tiers */}
            {carTier >= 3 && (
                <group position={[0, bodyH + wheelR * 1.2 + 0.1, -bodyL * 0.45]}>
                    <mesh material={carMaterial}><boxGeometry args={[bodyW + 0.2, 0.08, 0.6]} /></mesh>
                    <mesh position={[-0.6, -0.3, 0]}><boxGeometry args={[0.08, 0.6, 0.08]} /><meshStandardMaterial color="#333" metalness={0.5} /></mesh>
                    <mesh position={[0.6, -0.3, 0]}><boxGeometry args={[0.08, 0.6, 0.08]} /><meshStandardMaterial color="#333" metalness={0.5} /></mesh>
                </group>
            )}
        </group>
    )
}

// ===========================
// Camera Controller (uses shared ref, NO scene traversal)
// ===========================
// Preallocated vectors for camera (avoid per-frame GC)
const _camOffset = new THREE.Vector3()
const _camDesired = new THREE.Vector3()
const _camLookAt = new THREE.Vector3()

function CameraController({ bounds }) {
    const { camera } = useThree()
    const gamePhase = useStore((s) => s.gamePhase)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const targetPos = useRef(new THREE.Vector3(0, 30, 40))
    const lookTarget = useRef(new THREE.Vector3(0, 0, 0))
    const introTime = useRef(0)
    const introDone = useRef(false)

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
        const carPos = carStateRef.current.position
        const carRot = carStateRef.current.rotation

        // Intro flythrough (4 seconds)
        if (gamePhase === 'intro' || (gamePhase === 'playing' && !introDone.current && introTime.current < 4)) {
            introTime.current += delta
            const t = Math.min(introTime.current / 4, 1)
            const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic

            // Orbit around city center, descending
            const orbitRadius = citySpan * (1.2 - eased * 0.6)
            const orbitAngle = t * Math.PI * 1.5
            const height = 60 - eased * 45

            const cx = cityCenter.x + Math.cos(orbitAngle) * orbitRadius
            const cz = cityCenter.z + Math.sin(orbitAngle) * orbitRadius

            camera.position.set(cx, height, cz)
            camera.lookAt(cityCenter.x, 5, cityCenter.z)

            if (t >= 1) {
                introDone.current = true
                if (gamePhase === 'intro') setGamePhase('playing')
            }
            return
        }

        // Normal driving camera
        _camOffset.set(Math.sin(carRot) * 18, 12, Math.cos(carRot) * 18)
        _camDesired.copy(carPos).add(_camOffset)
        targetPos.current.lerp(_camDesired, 0.04)

        _camLookAt.copy(carPos).setY(carPos.y + 2)
        lookTarget.current.lerp(_camLookAt, 0.08)

        camera.position.lerp(targetPos.current, 0.06)
        camera.lookAt(lookTarget.current)
    })

    return null
}

// ===========================
// Day/Night (single light, optimized)
// ===========================
function DayNightCycle() {
    const lightRef = useRef()
    const cachedAngle = useRef(0)
    const lastUpdate = useRef(0)

    useFrame(() => {
        // Update sun position only every 60 frames (once per second at 60fps)
        lastUpdate.current++
        if (lastUpdate.current < 60) return
        lastUpdate.current = 0

        const now = new Date()
        const hours = now.getHours() + now.getMinutes() / 60
        const angle = ((hours - 6) / 24) * Math.PI * 2
        cachedAngle.current = angle

        if (lightRef.current) {
            const sunY = Math.sin(angle) * 80
            const sunX = Math.cos(angle) * 100
            lightRef.current.position.set(sunX, Math.max(sunY, 5), 50)
            lightRef.current.intensity = Math.max(0.1, Math.sin(angle)) * 1.5
        }
    })

    return (
        <directionalLight
            ref={lightRef}
            position={[50, 80, 50]}
            intensity={1.2}
            color="#ffeedd"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-80}
            shadow-camera-right={80}
            shadow-camera-top={80}
            shadow-camera-bottom={-80}
        />
    )
}

// ===========================
// Rain (optimized particle system)
// ===========================
function Rain() {
    const rainRef = useRef()
    const count = 1500
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 200
            pos[i * 3 + 1] = Math.random() * 60
            pos[i * 3 + 2] = (Math.random() - 0.5) * 200
        }
        return pos
    }, [])

    const fallSpeed = 48 // units per second

    useFrame((_, delta) => {
        if (!rainRef.current) return
        const dt = Math.min(delta, 0.05)
        const fall = fallSpeed * dt
        const arr = rainRef.current.geometry.attributes.position.array
        for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] -= fall
            if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 50 + Math.random() * 10
        }
        rainRef.current.geometry.attributes.position.needsUpdate = true
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
// Billboards (HTML-based, lightweight)
// ===========================
function Billboards({ userData, repos, contributions, bounds }) {
    const achievements = useMemo(() => {
        const achs = []
        if (!repos || !userData) return achs
        const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)

        if (totalStars >= 100) achs.push('⭐ 100+ Stars!')
        if (totalStars >= 1000) achs.push('🌟 1000+ Stars!')
        if (repos.length >= 50) achs.push('🏗️ 50+ Repos!')
        if (repos.length >= 10) achs.push('📦 10+ Repos!')
        if (contributions >= 500) achs.push('🔥 500+ Contribs!')
        if (contributions >= 1000) achs.push('💫 1000+ Contribs!')

        const langCounts = {}
        repos.forEach(r => { if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1 })
        const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]
        if (topLang) achs.push(`🏆 ${topLang[0]}`)
        if (userData?.followers >= 50) achs.push(`👥 ${userData.followers} Followers`)

        return achs.slice(0, 6) // Max 6 billboards
    }, [userData, repos, contributions])

    if (achievements.length === 0) return null

    const spanX = bounds.maxX - bounds.minX
    const spanZ = bounds.maxZ - bounds.minZ
    const radius = Math.min(spanX, spanZ, 180) / 3
    const cx = (bounds.minX + bounds.maxX) / 2
    const cz = (bounds.minZ + bounds.maxZ) / 2

    return (
        <group>
            {achievements.map((text, i) => {
                const angle = (i / achievements.length) * Math.PI * 2
                const x = cx + Math.cos(angle) * radius
                const z = cz + Math.sin(angle) * radius
                return (
                    <group key={i} position={[x, 0, z]}>
                        <mesh position={[0, 4, 0]} geometry={SHARED_GEOS.lampPole} material={SHARED_MATERIALS.lampPole} />
                        <mesh position={[0, 8.5, 0]} rotation={[0, -angle + Math.PI / 2, 0]} material={SHARED_MATERIALS.billboard}>
                            <boxGeometry args={[7, 2, 0.15]} />
                        </mesh>
                        <mesh position={[0, 8.5, 0.09]} rotation={[0, -angle + Math.PI / 2, 0]} material={SHARED_MATERIALS.billboardGlow}>
                            <boxGeometry args={[7.2, 2.2, 0.02]} />
                        </mesh>
                        <Html position={[0, 8.5, 0.15]} rotation={[0, -angle + Math.PI / 2, 0]} center transform>
                            <div style={{
                                color: '#e8e8f0', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                                fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap',
                                textShadow: '0 0 10px rgba(108,92,231,0.5)', pointerEvents: 'none',
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
// District Labels (HTML-based)
// ===========================
function DistrictLabels({ districts }) {
    // Only show top 6 districts to limit DOM elements
    const topDistricts = useMemo(() => districts.slice(0, 6), [districts])

    return (
        <group>
            {topDistricts.map((d, i) => {
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
// Building Tooltip (on car proximity)
// ===========================
function BuildingTooltip({ buildings }) {
    const [nearbyBuilding, setNearbyBuilding] = useState(null)
    const lastCheck = useRef(0)

    useFrame(() => {
        // Check proximity every 30 frames
        lastCheck.current++
        if (lastCheck.current < 30) return
        lastCheck.current = 0

        const carPos = carStateRef.current.position
        let closest = null
        let closestDist = 15 // Max tooltip distance

        for (const b of buildings) {
            const dist = Math.sqrt((carPos.x - b.x) ** 2 + (carPos.z - b.z) ** 2)
            if (dist < closestDist) {
                closestDist = dist
                closest = b
            }
        }
        setNearbyBuilding(closest)
    })

    return (
        <Html
            position={nearbyBuilding ? [nearbyBuilding.x, nearbyBuilding.height + 2, nearbyBuilding.z] : [0, 0, 0]}
            center
            style={{ display: nearbyBuilding ? 'block' : 'none' }}
        >
            {nearbyBuilding && (
                <div style={{
                    background: 'rgba(10,10,30,0.92)',
                    border: '1px solid rgba(108,92,231,0.4)',
                    borderRadius: '10px', padding: '10px 16px',
                    color: '#e8e8f0', fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap', backdropFilter: 'blur(10px)',
                    pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ fontWeight: 700, marginBottom: '3px' }}>{nearbyBuilding.name}</div>
                    <div style={{ fontSize: '11px', color: '#8888aa' }}>
                        ⭐ {nearbyBuilding.stars} &nbsp; 🍴 {nearbyBuilding.forks} &nbsp; {nearbyBuilding.language}
                    </div>
                </div>
            )}
        </Html>
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

    const { buildings, parks, props, districts, bounds } = cityData

    const fogColor = weather === 'clear' ? '#070714' : weather === 'cloudy' ? '#0d0d20' : '#050510'
    const fogNear = weather === 'foggy' ? 15 : weather === 'rainy' ? 30 : 60
    const fogFar = weather === 'foggy' ? 60 : weather === 'rainy' ? 100 : 250

    return (
        <div style={{ width: '100%', height: '100vh' }} id="city-canvas-container">
            <Canvas
                camera={{ position: [0, 40, 50], fov: 55, near: 0.5, far: 1000 }}
                shadows
                dpr={[1, 1.5]}
                performance={{ min: 0.5 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0,
                    powerPreference: 'high-performance',
                    preserveDrawingBuffer: true,
                }}
            >
                <color attach="background" args={[fogColor]} />
                <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

                {/* Lighting — minimal lights for performance */}
                <ambientLight intensity={0.35} color="#5566aa" />
                <DayNightCycle />
                <hemisphereLight intensity={0.2} color="#6666aa" groundColor="#000011" />

                {/* City (instanced) */}
                <InstancedBuildings buildings={buildings} />
                <Landmarks buildings={buildings} />
                <RoofDetails buildings={buildings} />
                <Roads bounds={bounds} />
                <StreetProps props={props} />
                <Parks parks={parks} />
                <DistrictLabels districts={districts} />
                <Billboards userData={userData} repos={repos} contributions={contributions} bounds={bounds} />
                <BuildingTooltip buildings={buildings} />

                {/* Weather */}
                {weather === 'rainy' && <Rain />}

                {/* Car + Camera */}
                <Car carTier={carTier} buildings={buildings} />
                <CameraController bounds={bounds} />
            </Canvas>
        </div>
    )
}

export default CityScene
