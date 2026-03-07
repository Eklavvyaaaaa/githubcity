/**
 * GitHub API Service
 * Fetches user data, repos, and contributions from GitHub
 */

const API_BASE = 'https://api.github.com'

function headers(token) {
    const h = { Accept: 'application/vnd.github.v3+json' }
    if (token) h.Authorization = `token ${token}`
    return h
}

/**
 * Fetch user profile
 */
export async function fetchUser(username, token) {
    const res = await fetch(`${API_BASE}/users/${username}`, { headers: headers(token) })
    if (!res.ok) throw new Error(`User "${username}" not found`)
    return res.json()
}

/**
 * Fetch all public repos (paginated, up to 300)
 */
export async function fetchAllRepos(username, token) {
    const allRepos = []
    let page = 1
    const perPage = 100
    const maxPages = 3

    while (page <= maxPages) {
        const res = await fetch(
            `${API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
            { headers: headers(token) }
        )
        if (!res.ok) break
        const repos = await res.json()
        if (!repos.length) break
        allRepos.push(...repos)
        if (repos.length < perPage) break
        page++
    }

    return allRepos
}

/**
 * Fetch contribution count by scraping the GitHub profile page
 * Falls back to a heuristic from public events if scraping fails
 */
export async function fetchContributions(username) {
    try {
        // Try fetching from GitHub profile page  
        const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
        if (res.ok) {
            const data = await res.json()
            return data.total?.lastYear || data.total?.['lastYear'] || estimateContributions(username)
        }
    } catch {
        // Fallback
    }
    return estimateContributions(username)
}

/**
 * Estimate contributions from public events (rough heuristic)
 */
async function estimateContributions(username) {
    try {
        const res = await fetch(`${API_BASE}/users/${username}/events/public?per_page=100`)
        if (res.ok) {
            const events = await res.json()
            // Each push event ~ 1-3 contributions, other events ~ 1
            let count = 0
            for (const e of events) {
                if (e.type === 'PushEvent') {
                    count += (e.payload?.commits?.length || 1)
                } else {
                    count += 1
                }
            }
            // Scale up (events only cover ~90 days, and not all events)
            return Math.round(count * 3)
        }
    } catch {
        // ignore
    }
    return 0
}

/**
 * Determine car tier from contribution count
 */
export function getCarTier(contributions) {
    if (contributions >= 2000) return 5  // Hypercar
    if (contributions >= 1000) return 4  // Supercar
    if (contributions >= 500) return 3   // Muscle Car
    if (contributions >= 200) return 2   // Sports Coupe
    if (contributions >= 50) return 1    // Family Sedan
    return 0                              // Rusty Jalopy
}

/**
 * Determine weather from recent repo activity
 */
export function determineWeather(repos) {
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    const oneMonth = 30 * 24 * 60 * 60 * 1000

    const recentPushes = repos.filter(r => {
        const pushed = new Date(r.pushed_at).getTime()
        return now - pushed < oneWeek
    }).length

    if (recentPushes >= 5) return 'clear'
    if (recentPushes >= 2) return 'cloudy'

    const monthPushes = repos.filter(r => {
        const pushed = new Date(r.pushed_at).getTime()
        return now - pushed < oneMonth
    }).length

    if (monthPushes >= 3) return 'cloudy'
    if (monthPushes >= 1) return 'foggy'
    return 'rainy'
}

/**
 * Language → Biome color mapping
 */
const LANGUAGE_BIOMES = {
    JavaScript: { ground: '#3d3520', sky: '#1a1508', fog: '#1a1508' },   // Golden desert
    TypeScript: { ground: '#1e2d3d', sky: '#0a1520', fog: '#0a1520' },   // Blue tundra
    Python: { ground: '#1a2a3a', sky: '#081828', fog: '#081828' },    // Deep ocean
    Java: { ground: '#3a2020', sky: '#1a0808', fog: '#1a0808' },    // Red mesa
    'C++': { ground: '#2a2a3a', sky: '#10101a', fog: '#10101a' },    // Purple dusk
    C: { ground: '#2a2a3a', sky: '#10101a', fog: '#10101a' },    // Purple dusk
    'C#': { ground: '#252040', sky: '#0d0a1a', fog: '#0d0a1a' },    // Violet twilight
    Go: { ground: '#203a3a', sky: '#081a1a', fog: '#081a1a' },     // Cyan marsh
    Rust: { ground: '#3a2510', sky: '#1a1008', fog: '#1a1008' },     // Rust canyon
    Ruby: { ground: '#3a1525', sky: '#1a0810', fog: '#1a0810' },     // Ruby caves
    PHP: { ground: '#2a2540', sky: '#10101a', fog: '#10101a' },     // Indigo plains
    Swift: { ground: '#3a2820', sky: '#1a1208', fog: '#1a1208' },     // Orange mesa
    Kotlin: { ground: '#352535', sky: '#150a15', fog: '#150a15' },     // Magenta forest
    HTML: { ground: '#3a2520', sky: '#1a1008', fog: '#1a1008' },     // Orange terracotta
    CSS: { ground: '#202a3a', sky: '#081018', fog: '#081018' },     // Blue steel
    Shell: { ground: '#253025', sky: '#0a150a', fog: '#0a150a' },     // Forest green
    Dart: { ground: '#203540', sky: '#081520', fog: '#081520' },     // Teal ocean
    Vue: { ground: '#20352a', sky: '#081510', fog: '#081510' },     // Emerald valley
    Lua: { ground: '#1a1a3a', sky: '#08081a', fog: '#08081a' },     // Midnight blue
}

const DEFAULT_BIOME = { ground: '#2b3a32', sky: '#070714', fog: '#070714' } // Default dark navy

/**
 * Calculate biome from repos' most used language
 */
export function calculateBiome(repos) {
    if (!repos || repos.length === 0) return DEFAULT_BIOME

    const langCount = {}
    for (const r of repos) {
        const lang = r.language
        if (lang) langCount[lang] = (langCount[lang] || 0) + 1
    }

    let topLang = null
    let topCount = 0
    for (const [lang, count] of Object.entries(langCount)) {
        if (count > topCount) {
            topLang = lang
            topCount = count
        }
    }

    return LANGUAGE_BIOMES[topLang] || DEFAULT_BIOME
}
