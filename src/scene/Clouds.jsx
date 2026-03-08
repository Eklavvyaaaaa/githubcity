import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Clouds({ count = 20, bounds }) {
    const meshRef = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Generate cloud data
    const cloudData = useMemo(() => {
        const clouds = []
        const width = bounds.maxX - bounds.minX + 200
        const depth = bounds.maxZ - bounds.minZ + 200

        for (let i = 0; i < count; i++) {
            clouds.push({
                x: bounds.minX - 100 + Math.random() * width,
                z: bounds.minZ - 100 + Math.random() * depth,
                y: 40 + Math.random() * 20,
                speed: 0.5 + Math.random() * 2,
                scaleX: 10 + Math.random() * 15,
                scaleY: 3 + Math.random() * 5,
                scaleZ: 8 + Math.random() * 12,
                opacity: 0.1 + Math.random() * 0.2
            })
        }
        return clouds
    }, [count, bounds])

    useFrame((_, delta) => {
        if (!meshRef.current) return

        const width = bounds.maxX - bounds.minX + 200

        cloudData.forEach((cloud, i) => {
            // Drift
            cloud.x += cloud.speed * delta

            // Wrap around
            if (cloud.x > bounds.maxX + 100) {
                cloud.x = bounds.minX - 100
            }

            dummy.position.set(cloud.x, cloud.y, cloud.z)
            dummy.scale.set(cloud.scaleX, cloud.scaleY, cloud.scaleZ)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.15}
                depthWrite={false}
            />
        </instancedMesh>
    )
}

export default Clouds
