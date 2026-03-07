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
