import { useRef, useEffect } from 'react'
import useStore from '../store/store'
import './Minimap.css'

function Minimap() {
    const canvasRef = useRef()
    const cityData = useStore((s) => s.cityData)
    const collectedCoinIds = useStore((s) => s.collectedCoinIds)

    useEffect(() => {
        if (!cityData || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const { buildings, roads, bounds } = cityData

        // Padding and scaling
        const padding = 10
        const mapSize = 200
        const worldWidth = bounds.maxX - bounds.minX
        const worldDepth = bounds.maxZ - bounds.minZ
        const scale = (mapSize - padding * 2) / Math.max(worldWidth, worldDepth)

        const toMapX = (x) => padding + (x - bounds.minX) * scale
        const toMapZ = (z) => padding + (z - bounds.minZ) * scale

        let animationFrameId

        const render = () => {
            // Clear
            ctx.clearRect(0, 0, mapSize, mapSize)

            // Draw Background
            ctx.fillStyle = 'rgba(26, 31, 53, 0.8)'
            ctx.beginPath()
            ctx.arc(mapSize / 2, mapSize / 2, mapSize / 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = '#444'
            ctx.stroke()

            // Draw Roads
            ctx.strokeStyle = '#333'
            ctx.lineWidth = 2
            roads.forEach(r => {
                ctx.beginPath()
                ctx.moveTo(toMapX(r.x1), toMapZ(r.z1))
                ctx.lineTo(toMapX(r.x2), toMapZ(r.z2))
                ctx.stroke()
            })

            // Draw Buildings
            ctx.fillStyle = '#444'
            buildings.forEach(b => {
                const w = b.width * scale
                const d = b.depth * scale
                ctx.fillRect(toMapX(b.x) - w / 2, toMapZ(b.z) - d / 2, w, d)
            })

            // Draw Coins (only if not collected)
            // Note: We'll just draw dots for buildings that have coins
            buildings.forEach(b => {
                const coinId = `coin-${b.id}`
                if (b.stars > 50 && !collectedCoinIds.has(coinId)) {
                    ctx.fillStyle = '#FFD700'
                    ctx.beginPath()
                    ctx.arc(toMapX(b.x), toMapZ(b.z), 2, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            // Draw Player Car
            const car = window.__carState
            if (car) {
                const cx = toMapX(car.x)
                const cz = toMapZ(car.z)

                ctx.save()
                ctx.translate(cx, cz)
                ctx.rotate(car.rotation)

                // Triangle pointing up (which is -Z in world space)
                ctx.fillStyle = '#00AAFF'
                ctx.beginPath()
                ctx.moveTo(0, -6)
                ctx.lineTo(-4, 4)
                ctx.lineTo(4, 4)
                ctx.closePath()
                ctx.fill()

                ctx.restore()
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()
        return () => cancelAnimationFrame(animationFrameId)
    }, [cityData, collectedCoinIds])

    return (
        <div className="minimap-container">
            <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="minimap-canvas"
            />
        </div>
    )
}

export default Minimap
