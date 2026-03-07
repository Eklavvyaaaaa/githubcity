/**
 * Web Audio API Sound Synthesizer v2
 * Polished, pleasant game sounds — all procedurally generated.
 */

let audioCtx = null

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
}

// ===========================
// Engine Sound (soft humming loop, pitch-linked to speed)
// ===========================
let engineOsc = null
let engineGain = null
let engineFilter = null

export function startEngine() {
    const ctx = getCtx()
    if (engineOsc) return

    // Primary: soft triangle wave for a mellow hum
    engineOsc = ctx.createOscillator()
    engineOsc.type = 'triangle'
    engineOsc.frequency.value = 45

    // Sub-harmonic for body
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = 90

    // Warm lowpass to keep it smooth
    engineFilter = ctx.createBiquadFilter()
    engineFilter.type = 'lowpass'
    engineFilter.frequency.value = 250
    engineFilter.Q.value = 1

    engineGain = ctx.createGain()
    engineGain.gain.value = 0.03

    engineOsc.connect(engineFilter)
    sub.connect(engineFilter)
    engineFilter.connect(engineGain)
    engineGain.connect(ctx.destination)

    engineOsc.start()
    sub.start()

    engineOsc._sub = sub
}

export function updateEngineSound(speed, maxSpeed) {
    if (!engineOsc || !engineGain || !engineFilter) return
    const ratio = Math.min(Math.abs(speed) / maxSpeed, 1)

    // Gentle pitch ramp: 45Hz idle → 140Hz max
    const freq = 45 + ratio * 95
    engineOsc.frequency.value = freq
    if (engineOsc._sub) engineOsc._sub.frequency.value = freq * 2

    // Volume stays soft: 0.02 idle, 0.05 max
    engineGain.gain.value = 0.02 + ratio * 0.03

    // Filter opens gently
    engineFilter.frequency.value = 200 + ratio * 400
}

export function stopEngine() {
    if (engineOsc) {
        engineOsc.stop()
        if (engineOsc._sub) engineOsc._sub.stop()
        engineOsc.disconnect()
        if (engineOsc._sub) engineOsc._sub.disconnect()
        engineOsc = null
    }
    if (engineFilter) { engineFilter.disconnect(); engineFilter = null }
    if (engineGain) { engineGain.disconnect(); engineGain = null }
}

// ===========================
// Tire Screech (subtle filtered whoosh, not harsh)
// ===========================
let lastScreechTime = 0

export function playTireScreech() {
    const now = Date.now()
    if (now - lastScreechTime < 1000) return
    lastScreechTime = now

    const ctx = getCtx()
    const t = ctx.currentTime
    const duration = 0.2

    // Soft filtered noise — like a short "shhh" whoosh
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI)  // smooth bell curve
        data[i] = (Math.random() * 2 - 1) * env
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400
    bp.Q.value = 1.5

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 800

    const gain = ctx.createGain()
    gain.gain.value = 0.035

    source.connect(bp)
    bp.connect(hp)
    hp.connect(gain)
    gain.connect(ctx.destination)
    source.start(t)
}

// ===========================
// UI Click (clean soft pop)
// ===========================
export function playUIClick() {
    const ctx = getCtx()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, t)
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.06)

    gain.gain.setValueAtTime(0.1, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.08)
}

// ===========================
// UI Hover (very soft tick)
// ===========================
export function playUIHover() {
    const ctx = getCtx()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = 880

    gain.gain.setValueAtTime(0.03, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.03)
}

// ===========================
// Jump (light springy boing)
// ===========================
export function playJumpSound() {
    const ctx = getCtx()
    const t = ctx.currentTime

    // Quick rising tone
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(280, t)
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.1)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.18)
}

// ===========================
// Land Thud (warm bass bump)
// ===========================
export function playLandThud() {
    const ctx = getCtx()
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(90, t)
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.12, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)

    // Lowpass to keep it warm
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 150

    osc.connect(lp)
    lp.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.2)
}

// ===========================
// Coin Collect (bright sparkly chime — 3 ascending notes)
// ===========================
export function playCoinCollect() {
    const ctx = getCtx()
    const t = ctx.currentTime

    const notes = [
        { freq: 784, delay: 0 },       // G5
        { freq: 988, delay: 0.06 },     // B5
        { freq: 1175, delay: 0.12 },    // D6
    ]

    notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, t + delay)
        gain.gain.linearRampToValueAtTime(0.08, t + delay + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t + delay)
        osc.stop(t + delay + 0.15)
    })
}
