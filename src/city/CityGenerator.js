/**
 * City Generator
 * Transforms GitHub data into a 3D city layout
 */

import { getDistrictStyle, assignDistricts } from './districts'

export const BLOCK_SIZE = 18      // Size of one city block (increased for larger buildings)
export const ROAD_WIDTH = 10       // Width of roads (wider for better driving)
export const CELL_SIZE = BLOCK_SIZE + ROAD_WIDTH  // Total cell spacing
export const BUILDING_GAP = 3     // Gap between building edge and plot edge

/**
 * Generate a complete city from GitHub data
 */
export function generateCity(user, repos) {
    if (!repos || repos.length === 0) {
        return {
            buildings: [],
            roads: [],
            parks: [],
            props: [],
            districts: [],
            bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
        }
    }

    // Assign districts
    const languages = assignDistricts(repos)
    const districtMap = {}
    languages.forEach((lang, i) => {
        districtMap[lang] = i
    })

    // Sort repos into districts
    const districtRepos = {}
    for (const repo of repos) {
        const lang = repo.language || 'Other'
        if (!districtRepos[lang]) districtRepos[lang] = []
        districtRepos[lang].push(repo)
    }

    // Layout: arrange districts in a spiral/grid pattern
    const gridCols = Math.ceil(Math.sqrt(languages.length))
    const buildings = []
    const parks = []
    const districts = []

    languages.forEach((lang, districtIndex) => {
        const dRepos = districtRepos[lang] || []
        const style = getDistrictStyle(lang)

        // District grid position
        const distCol = districtIndex % gridCols
        const distRow = Math.floor(districtIndex / gridCols)

        // District offset in world space
        const distOffsetX = distCol * CELL_SIZE * 4
        const distOffsetZ = distRow * CELL_SIZE * 4

        // Track district bounds
        let dMinX = Infinity, dMaxX = -Infinity
        let dMinZ = Infinity, dMaxZ = -Infinity

        // Sort repos within district: pinned/starred first
        const sorted = [...dRepos].sort((a, b) => {
            const scoreA = (a.stargazers_count || 0) * 2 + (a.forks_count || 0)
            const scoreB = (b.stargazers_count || 0) * 2 + (b.forks_count || 0)
            return scoreB - scoreA
        })

        // Arrange buildings in a local grid
        const localCols = Math.ceil(Math.sqrt(sorted.length))

        sorted.forEach((repo, i) => {
            const localCol = i % localCols
            const localRow = Math.floor(i / localCols)

            const x = distOffsetX + localCol * CELL_SIZE + CELL_SIZE / 2
            const z = distOffsetZ + localRow * CELL_SIZE + CELL_SIZE / 2

            // Building height based on stars + forks + code size
            const stars = repo.stargazers_count || 0
            const forks = repo.forks_count || 0
            const size = repo.size || 0  // KB of code — proxy for commit activity
            const baseHeight = 4
            const height = baseHeight
                + Math.log2(stars + 1) * 4
                + Math.log2(forks + 1) * 2
                + Math.log2(size + 1) * 1.5

            // Building footprint scales with repo size, CLAMPED to fit within plot
            const maxBuildingSize = BLOCK_SIZE - BUILDING_GAP * 2  // max that fits in plot
            const sizeBonus = Math.log2(size + 1) * 0.8
            const rawWidth = 5 + Math.random() * 2 + Math.min(sizeBonus, 7)
            const rawDepth = 5 + Math.random() * 2 + Math.min(sizeBonus * 1.3, 9)
            const width = Math.min(rawWidth, maxBuildingSize)
            const depth = Math.min(rawDepth, maxBuildingSize)

            // Age/weathering based on last push
            const daysSinceUpdate = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
            const isWeathered = daysSinceUpdate > 365
            const isInactive = daysSinceUpdate > 730

            // Determine if repo has any real activity
            const hasActivity = stars > 0 || forks > 0 || daysSinceUpdate < 365

            // Building shape based on language
            let shape = 'box'
            if (['HTML', 'CSS', 'Vue', 'Svelte', 'Astro'].includes(lang)) {
                shape = 'cylinder'
            } else if (['Python', 'Jupyter Notebook', 'R', 'Ruby'].includes(lang)) {
                shape = 'cylinder'
            } else if (['Rust', 'C++', 'C', 'Go', 'Assembly'].includes(lang)) {
                shape = 'hex'
            } else if (['JavaScript', 'TypeScript', 'Java', 'C#', 'PHP'].includes(lang)) {
                shape = 'box'
            }

            if (!hasActivity && Math.random() > 0.5) {
                // Zero-activity repo → park
                parks.push({
                    x, z,
                    width: BLOCK_SIZE,
                    depth: BLOCK_SIZE,
                    district: lang,
                })
            } else {
                // Number of window rows based on height
                const windowRows = Math.max(1, Math.floor(height / 4))
                const windowCols = Math.max(1, Math.floor(width / 2.5))

                buildings.push({
                    id: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    x, z,
                    width,
                    height: Math.max(height, 4),
                    depth,
                    shape,
                    color: style.primary,
                    secondaryColor: style.secondary,
                    accentColor: style.accent,
                    buildingStyle: style.buildingStyle,
                    stars,
                    forks,
                    language: lang,
                    description: repo.description || '',
                    isForked: repo.fork,
                    isWeathered,
                    isInactive,
                    isPrivate: repo.private,
                    isPinned: i < 3 && stars > 0,
                    url: repo.html_url,
                    lastPush: repo.pushed_at,
                    createdAt: repo.created_at,
                    windowRows,
                    windowCols,
                    repoSize: size,
                })
            }

            // Update district bounds
            dMinX = Math.min(dMinX, x - BLOCK_SIZE / 2)
            dMaxX = Math.max(dMaxX, x + BLOCK_SIZE / 2)
            dMinZ = Math.min(dMinZ, z - BLOCK_SIZE / 2)
            dMaxZ = Math.max(dMaxZ, z + BLOCK_SIZE / 2)
        })

        if (dRepos.length > 0) {
            districts.push({
                name: style.name,
                language: lang,
                style,
                bounds: { minX: dMinX, maxX: dMaxX, minZ: dMinZ, maxZ: dMaxZ },
                repoCount: dRepos.length,
            })
        }
    })

    // Calculate overall bounds
    const allX = buildings.map(b => b.x).concat(parks.map(p => p.x))
    const allZ = buildings.map(b => b.z).concat(parks.map(p => p.z))
    const margin = 40
    const bounds = {
        minX: Math.min(...allX) - margin,
        maxX: Math.max(...allX) + margin,
        minZ: Math.min(...allZ) - margin,
        maxZ: Math.max(...allZ) + margin,
    }

    // Garage spawn point — placed south of the city, away from all buildings
    const garageSpawn = {
        x: (bounds.minX + bounds.maxX) / 2,
        z: bounds.maxZ + 20,
    }

    // Generate roads along the grid lines
    const roads = generateRoads(bounds)

    // Generate street props
    const props = generateProps(buildings, bounds)

    return { buildings, roads, parks, props, districts, bounds, garageSpawn }
}

/**
 * Generate road segments along grid lines
 */
function generateRoads(bounds) {
    const roads = []
    const step = CELL_SIZE

    // Horizontal roads
    for (let z = Math.floor(bounds.minZ / step) * step; z <= bounds.maxZ; z += step) {
        roads.push({
            x1: bounds.minX, z1: z,
            x2: bounds.maxX, z2: z,
            width: ROAD_WIDTH,
        })
    }

    // Vertical roads
    for (let x = Math.floor(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
        roads.push({
            x1: x, z1: bounds.minZ,
            x2: x, z2: bounds.maxZ,
            width: ROAD_WIDTH,
        })
    }

    return roads
}

/**
 * Generate street props (lamp posts, trees)
 */
function generateProps(buildings, bounds) {
    const props = []
    const step = CELL_SIZE

    // Place street lamps along roads
    for (let x = Math.floor(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
        for (let z = Math.floor(bounds.minZ / step) * step; z <= bounds.maxZ; z += step) {
            // Lamp at intersection corners
            props.push({ type: 'lamp', x: x - ROAD_WIDTH / 2 - 0.5, z: z - ROAD_WIDTH / 2 - 0.5 })

            // Occasional trees
            if (Math.random() > 0.5) {
                props.push({
                    type: 'tree',
                    x: x + BLOCK_SIZE / 2 + (Math.random() - 0.5) * 2,
                    z: z + BLOCK_SIZE / 2 + (Math.random() - 0.5) * 2,
                })
            }
        }
    }

    return props
}
