import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import useStore from '../store/store'
import { playUIClick } from '../services/audio'

/**
 * GITHUB CITY ANTIGRAVITY LANDING PAGE
 * A stunning, professional-grade landing page with a live Three.js centerpiece.
 */

const AntigravityLanding = () => {
    // Store access
    const error = useStore((s) => s.error)
    const setError = useStore((s) => s.setError)
    const setGamePhase = useStore((s) => s.setGamePhase)
    const setUsername = useStore((s) => s.setUsername)
    const setGithubToken = useStore((s) => s.setGithubToken)

    // Local state
    const [inputVal, setInputVal] = useState('')
    const [tokenVal, setTokenVal] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const [stats, setStats] = useState({ cities: 0, days: 0, possibilities: 0, source: 0 })

    // Refs for animations
    const canvasRef = useRef()
    const observerRef = useRef()

    // Handle form submission
    const handleLaunch = useCallback((e) => {
        if (e) e.preventDefault()
        const cleanName = inputVal.trim()
        if (!cleanName) {
            setError('Please enter a GitHub username.')
            return
        }
        playUIClick()
        setUsername(cleanName)
        if (tokenVal.trim()) setGithubToken(tokenVal.trim())
        setGamePhase('loading')
    }, [inputVal, tokenVal, setUsername, setGithubToken, setGamePhase, setError])

    // Scroll listener for Navbar
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Intersection Observer for scroll animations
    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view')
                    if (entry.target.id === 'stats-bar') {
                        startCountUp()
                    }
                }
            })
        }, { threshold: 0.1 })

        const elements = document.querySelectorAll('.animate-on-scroll')
        elements.forEach(el => observerRef.current.observe(el))

        return () => observerRef.current.disconnect()
    }, [])

    const startCountUp = () => {
        const duration = 2000
        const startTime = performance.now()
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3) // Cubic ease out
            setStats({
                cities: Math.floor(ease * 2000),
                days: Math.floor(ease * 365),
                possibilities: Math.floor(ease * 100), // Represents ∞ visually in label
                source: Math.floor(ease * 100)
            })
            if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    // Three.js City Preview
    useEffect(() => {
        if (!canvasRef.current) return

        const width = canvasRef.current.clientWidth
        const height = canvasRef.current.clientHeight
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.set(0, 14, 28)
        camera.lookAt(0, 0, 0)

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambient)

        const directional = new THREE.DirectionalLight(0x00f5a0, 0.8)
        directional.position.set(10, 20, 10)
        scene.add(directional)

        const point = new THREE.PointLight(0x00d9f5, 1, 50)
        point.position.set(-5, 5, 5)
        scene.add(point)

        // Buildings
        const buildings = new THREE.Group()
        const boxGeo = new THREE.BoxGeometry(1, 1, 1)
        const colors = [0x1a1f2e, 0x0e4429, 0x006d32, 0x26a641, 0x39d353]

        const count = 80
        const buildingData = []

        for (let i = 0; i < count; i++) {
            const angle = i * 0.4
            const r = 4 + i * 0.15
            const x = Math.cos(angle) * r
            const z = Math.sin(angle) * r
            const h = 0.3 + Math.abs(Math.sin(i * 1337)) * 2.5

            const mat = new THREE.MeshLambertMaterial({
                color: colors[i % colors.length],
                flatShading: true
            })
            const mesh = new THREE.Mesh(boxGeo, mat)
            mesh.position.set(x, h / 2 - 5, z) // Start slightly below
            mesh.scale.set(1.2, h, 1.2)
            buildings.add(mesh)

            buildingData.push({
                mesh,
                baseY: h / 2 - 5,
                phase: i * 0.5,
                floatSpeed: 0.8 + Math.random() * 0.4
            })
        }
        scene.add(buildings)

        // Particles
        const partGeo = new THREE.BufferGeometry()
        const partPos = []
        for (let i = 0; i < 600; i++) {
            const r = 25
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)
            partPos.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            )
        }
        partGeo.setAttribute('position', new THREE.Float32BufferAttribute(partPos, 3))
        const partMat = new THREE.PointsMaterial({ color: 0x00f5a0, size: 0.1, transparent: true, opacity: 0.5 })
        const particles = new THREE.Points(partGeo, partMat)
        scene.add(particles)

        let frameId
        const clock = new THREE.Clock()

        const animate = () => {
            const time = clock.getElapsedTime()

            buildings.rotation.y += 0.004
            particles.rotation.y -= 0.002

            buildingData.forEach(b => {
                b.mesh.position.y = b.baseY + Math.sin(time * b.floatSpeed + b.phase) * 0.8
            })

            renderer.render(scene, camera)
            frameId = requestAnimationFrame(animate)
        }
        animate()

        // Clean up
        return () => {
            cancelAnimationFrame(frameId)
            scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose()
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
                    else obj.material.dispose()
                }
            })
            renderer.dispose()
        }
    }, [])

    return (
        <div className="ag-landing">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

                :root {
                    --bg: #060810;
                    --surface: #0d1117;
                    --surface2: #161b22;
                    --border: rgba(255,255,255,0.08);
                    --accent: #00f5a0;
                    --accent2: #00d9f5;
                    --accent3: #f5a000;
                    --text: #e6edf3;
                    --muted: #7d8590;
                    --glow: rgba(0,245,160,0.18);
                    --glow2: rgba(0,217,245,0.12);
                }

                .ag-landing {
                    background: var(--bg);
                    color: var(--text);
                    font-family: 'JetBrains Mono', monospace;
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                h1, h2, h3 { font-family: 'Syne', sans-serif; font-weight: 800; }

                /* NAVBAR */
                .navbar {
                    position: fixed;
                    top: 0; left: 0; width: 100%;
                    padding: 20px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 1000;
                    transition: all 0.3s ease;
                    border-bottom: 1px solid transparent;
                }
                .navbar.scrolled {
                    background: rgba(6, 8, 16, 0.8);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid var(--border);
                    padding: 15px 40px;
                }
                .nav-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 20px;
                    letter-spacing: 2px;
                    color: var(--text);
                }
                .logo-square {
                    width: 24px; height: 24px;
                    background: var(--accent);
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .nav-links { display: flex; gap: 32px; }
                .nav-link {
                    color: var(--muted);
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 500;
                    transition: color 0.2s;
                    border-bottom: 1px solid transparent;
                    padding-bottom: 4px;
                }
                .nav-link:hover { color: var(--accent); border-bottom-color: var(--accent); }

                /* HERO */
                .hero {
                    padding: 160px 40px 100px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    max-width: 1400px;
                    margin: 0 auto;
                    align-items: center;
                }
                .hero-left { opacity: 0; transform: translateY(28px); animation: fadeUp 0.8s forwards; }
                .hero-badge {
                    display: inline-block;
                    padding: 6px 14px;
                    border: 1px solid var(--accent);
                    color: var(--accent);
                    border-radius: 100px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 24px;
                }
                .hero-title {
                    font-size: clamp(44px, 6vw, 84px);
                    line-height: 1.05;
                    margin: 0 0 24px;
                    letter-spacing: -2px;
                }
                .text-gradient {
                    background: linear-gradient(90deg, var(--accent), var(--accent2));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-sub {
                    color: var(--muted);
                    font-size: 17px;
                    line-height: 1.7;
                    max-width: 440px;
                    margin-bottom: 40px;
                }
                .input-row {
                    display: flex;
                    gap: 12px;
                    background: var(--surface);
                    padding: 8px;
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    transition: border-color 0.3s;
                    margin-bottom: 32px;
                }
                .input-row:focus-within { border-color: var(--accent); }
                .input-prefix { color: var(--accent); font-weight: 600; padding-left: 12px; display: flex; align-items: center; }
                .ag-input {
                    background: transparent;
                    border: none;
                    color: var(--text);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    width: 100%;
                    padding: 12px 8px;
                    outline: none;
                }
                .cta-btn {
                    background: linear-gradient(135deg, var(--accent), var(--accent2));
                    color: #000;
                    border: none;
                    padding: 0 28px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-family: 'Syne', sans-serif;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 20px var(--glow);
                    white-space: nowrap;
                }
                .cta-btn:hover { transform: scale(1.03); box-shadow: 0 6px 24px var(--glow); }
                .cta-btn:active { transform: scale(0.98); }

                .trust-badges { display: flex; gap: 16px; flex-wrap: wrap; }
                .trust-badge {
                    font-size: 11px;
                    padding: 6px 12px;
                    border: 1px solid var(--border);
                    border-radius: 100px;
                    color: var(--muted);
                    background: var(--surface);
                }

                /* BROWSER MOCKUP */
                .hero-right { position: relative; perspective: 1000px; }
                .browser-mockup {
                    background: var(--surface2);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 40px var(--glow2);
                    transform: rotateY(-6deg) rotateX(3deg);
                    animation: float 4s ease-in-out infinite;
                }
                .browser-chrome {
                    background: var(--surface);
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: 1px solid var(--border);
                }
                .dots { display: flex; gap: 6px; }
                .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); }
                .url-bar {
                    background: var(--bg);
                    padding: 4px 16px;
                    border-radius: 4px;
                    font-size: 11px;
                    color: var(--muted);
                    flex-grow: 1;
                    text-align: center;
                }
                .browser-content { height: 480px; position: relative; }
                .preview-canvas { width: 100%; height: 100%; display: block; }

                /* TICKER */
                .ticker-strip {
                    background: var(--accent3);
                    padding: 12px 0;
                    overflow: hidden;
                    border-top: 1px solid rgba(0,0,0,0.1);
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                }
                .ticker-content {
                    display: flex;
                    white-space: nowrap;
                    animation: marquee 30s linear infinite;
                }
                .ticker-text {
                    font-family: 'Syne', sans-serif;
                    font-weight: 700;
                    color: #000;
                    font-size: 14px;
                    text-transform: uppercase;
                    padding: 0 40px;
                }

                /* HOW IT WORKS */
                .section { padding: 120px 40px; max-width: 1400px; margin: 0 auto; }
                .section-header { text-align: center; margin-bottom: 80px; }
                .section-title { font-size: 48px; margin-bottom: 16px; }
                .section-sub { color: var(--muted); max-width: 600px; margin: 0 auto; line-height: 1.7; }

                .step-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
                .step-card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    padding: 40px;
                    border-radius: 16px;
                    position: relative;
                    transition: all 0.3s ease;
                    overflow: hidden;
                }
                .step-card:hover { transform: translateY(-8px); border-color: var(--accent); }
                .step-num {
                    position: absolute;
                    top: -20px; right: -10px;
                    font-size: 120px;
                    font-weight: 800;
                    color: rgba(255,255,255,0.03);
                    line-height: 1;
                }
                .step-icon { font-size: 40px; margin-bottom: 24px; color: var(--accent); }
                .step-title { font-size: 20px; margin-bottom: 12px; }
                .step-desc { color: var(--muted); font-size: 14px; line-height: 1.6; }

                /* STATS BAR */
                .stats-bar {
                    background: var(--surface);
                    border-top: 1px solid var(--border);
                    border-bottom: 1px solid var(--border);
                    padding: 60px 40px;
                }
                .stats-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    text-align: center;
                }
                .stat-item { padding: 0 40px; border-right: 1px solid var(--border); }
                .stat-item:last-child { border-right: none; }
                .stat-number { font-size: 48px; color: var(--accent); margin-bottom: 8px; }
                .stat-label { font-size: 12px; text-transform: uppercase; color: var(--muted); font-weight: 500; }

                /* FEATURES */
                .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .feature-card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    padding: 32px;
                    border-radius: 16px;
                    display: flex;
                    gap: 24px;
                    transition: border-color 0.3s;
                }
                .feature-card:hover { border-color: var(--accent); }
                .feature-icon-wrap {
                    width: 64px; height: 64px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 32px;
                    flex-shrink: 0;
                }
                .feature-name { font-size: 20px; margin: 0 0 8px 0; }
                .feature-desc { color: var(--muted); font-size: 14px; line-height: 1.6; }

                /* CTA */
                .cta-section {
                    text-align: center;
                    padding: 140px 40px;
                    position: relative;
                    overflow: hidden;
                }
                .cta-glow {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px; height: 600px;
                    background: radial-gradient(circle, var(--glow) 0%, transparent 70%);
                    z-index: -1;
                }
                .cta-input-wrap { max-width: 500px; margin: 0 auto 24px; }

                /* FOOTER */
                .footer {
                    padding: 80px 40px;
                    border-top: 1px solid var(--border);
                    max-width: 1400px; margin: 0 auto;
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 80px;
                    color: var(--muted);
                    font-size: 14px;
                }
                .footer-col-title { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--text); margin-bottom: 24px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .footer-links { display: flex; flex-direction: column; gap: 12px; }
                .footer-link { color: var(--muted); text-decoration: none; transition: color 0.2s; }
                .footer-link:hover { color: var(--accent); }

                /* ANIMATIONS */
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: rotateY(-6deg) rotateX(3deg) translateY(0); }
                    50% { transform: rotateY(-6deg) rotateX(3deg) translateY(-20px); }
                }
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                .animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-on-scroll.in-view { opacity: 1; transform: translateY(0); }

                /* MOBILE */
                @media (max-width: 960px) {
                    .hero { grid-template-columns: 1fr; text-align: center; padding-top: 120px; }
                    .hero-sub { margin: 0 auto 40px; }
                    .input-row { flex-direction: column; background: transparent; border: none; padding: 0; }
                    .input-prefix { display: none; }
                    .ag-input { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; padding: 16px; width: calc(100% - 32px); }
                    .cta-btn { width: 100%; padding: 16px; }
                    .trust-badges { justify-content: center; }
                    .step-grid, .stats-content, .feature-grid, .footer { grid-template-columns: 1fr; }
                    .stat-item { border-right: none; border-bottom: 1px solid var(--border); padding: 20px 0; }
                    .browser-mockup { transform: none; animation: floatMobile 4s ease-in-out infinite; }
                }
                @keyframes floatMobile {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>

            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <div className="nav-logo">
                    <div className="logo-square">🏙️</div>
                    GITHUB CITY
                </div>
                <div className="nav-links">
                    <a href="#how-it-works" className="nav-link">How It Works</a>
                    <a href="#features" className="nav-link">Features</a>
                    <a href="https://github.com" target="_blank" className="nav-link">GitHub</a>
                </div>
            </nav>

            <header className="hero">
                <div className="hero-left">
                    <span className="hero-badge">✦ Open Source · Free Forever</span>
                    <h1 className="hero-title">
                        Your GitHub history, <br />
                        <span className="text-gradient">floating in space.</span>
                    </h1>
                    <p className="hero-sub">
                        Transform your 365-day contribution graph into a procedural, anti-gravity 3D metropolis. Every commit is a brick.
                    </p>
                    <form className="input-row" onSubmit={handleLaunch}>
                        <div className="input-prefix">@</div>
                        <input
                            type="text"
                            className="ag-input"
                            placeholder="your-username"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                        />
                        <button type="submit" className="cta-btn">Launch City →</button>
                    </form>
                    <div className="trust-badges">
                        <span className="trust-badge">🧱 365 days of data</span>
                        <span className="trust-badge">⚡ WebGL powered</span>
                        <span className="trust-badge">🔓 No API key</span>
                    </div>
                </div>

                <div className="hero-right">
                    <div className="browser-mockup">
                        <div className="browser-chrome">
                            <div className="dots">
                                <div className="dot" style={{ background: '#ff5f56' }}></div>
                                <div className="dot" style={{ background: '#ffbd2e' }}></div>
                                <div className="dot" style={{ background: '#27c93f' }}></div>
                            </div>
                            <div className="url-bar">githubcity.app/@{inputVal || 'username'}</div>
                        </div>
                        <div className="browser-content">
                            <canvas ref={canvasRef} className="preview-canvas" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="ticker-strip">
                <div className="ticker-content">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="ticker-text">
                            ✦ Your commits, your city  ✦  Built with Three.js  ✦  Open Source  ✦  No API key needed  ✦  365 days of data  ✦  WebGL powered
                        </div>
                    ))}
                </div>
            </div>

            <section id="how-it-works" className="section">
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-sub">Simple, fast, and entirely built in your browser.</p>
                </div>
                <div className="step-grid">
                    {[
                        { num: '01', title: 'Enter Username', desc: 'Type in any public GitHub handle to start the generation process.', icon: '@' },
                        { num: '02', title: 'Fetch Active Data', desc: 'We securely grab your contribution history and repository stats.', icon: '📥' },
                        { num: '03', title: 'Enter Orbit', desc: 'Your personalized city is rendered in 3D using real-time physics.', icon: '🚀' }
                    ].map((step, i) => (
                        <div key={i} className="step-card animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                            <div className="step-num">{step.num}</div>
                            <div className="step-icon">{step.icon}</div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-desc">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <div id="stats-bar" className="stats-bar animate-on-scroll">
                <div className="stats-content">
                    <div className="stat-item">
                        <div className="stat-number">{stats.cities.toLocaleString()}+</div>
                        <div className="stat-label">Cities Generated</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{stats.days}</div>
                        <div className="stat-label">Days of Data</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">∞</div>
                        <div className="stat-label">Possibilities</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">{stats.source}%</div>
                        <div className="stat-label">Open Source</div>
                    </div>
                </div>
            </div>

            <section id="features" className="section">
                <div className="section-header animate-on-scroll">
                    <h2 className="section-title">Engine Features</h2>
                    <p className="section-sub">Built for performance, tuned for aesthetics.</p>
                </div>
                <div className="feature-grid">
                    {[
                        { title: 'Anti-Gravity Physics', desc: 'Buildings float and drift independently based on your commit frequency.', icon: '🪐' },
                        { title: 'Spiral Galaxy Layout', desc: 'Contributions arranged in a galaxy spiral pattern across 365 days.', icon: '🌀' },
                        { title: 'Real Contribution Data', desc: 'Fetched live from GitHub graph, ensuring your city is always up to date.', icon: '📊' },
                        { title: 'WebGL Performance', desc: 'Smooth 60fps rendering even with hundreds of animated buildings.', icon: '⚡' }
                    ].map((f, i) => (
                        <div key={i} className="feature-card animate-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                            <div className="feature-icon-wrap">{f.icon}</div>
                            <div>
                                <h3 className="feature-name">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-glow"></div>
                <div className="animate-on-scroll">
                    <h2 className="section-title">Ready to see your city?</h2>
                    <p className="section-sub" style={{ marginBottom: '40px' }}>Join thousands of developers and explore your coding legacy.</p>
                    <div className="cta-input-wrap">
                        <form className="input-row" onSubmit={handleLaunch}>
                            <div className="input-prefix">@</div>
                            <input
                                type="text"
                                className="ag-input"
                                placeholder="your-username"
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                            />
                            <button type="submit" className="cta-btn">Launch →</button>
                        </form>
                    </div>
                    <p className="trust-badge" style={{ display: 'inline-block' }}>No account needed · Works with any public handle</p>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-left">
                    <div className="nav-logo" style={{ marginBottom: '20px' }}>
                        <div className="logo-square">🏙️</div>
                        GITHUB CITY
                    </div>
                    <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
                        A creative exploration of coding history.<br />
                        Built with ❤️ and Three.js.
                    </p>
                </div>
                <div className="footer-links-col">
                    <h4 className="footer-col-title">Navigation</h4>
                    <div className="footer-links">
                        <a href="#how-it-works" className="footer-link">How It Works</a>
                        <a href="#features" className="footer-link">Features</a>
                        <a href="#" className="footer-link">Top Cities</a>
                    </div>
                </div>
                <div className="footer-links-col">
                    <h4 className="footer-col-title">Connect</h4>
                    <div className="footer-links">
                        <a href="https://github.com/Eklavvyaaaaa/githubcity" className="footer-link">GitHub Repo</a>
                        <a href="#" className="footer-link">Documentation</a>
                        <a href="#" className="footer-link">API Status</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default AntigravityLanding
