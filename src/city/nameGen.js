/**
 * City Name Generator
 * Creates a procedural city name from a username
 */

const PREFIXES = [
    'Neo', 'Nova', 'Port', 'San', 'New', 'Fort', 'Mount', 'Grand', 'East', 'West',
    'North', 'South', 'Upper', 'Lower', 'Old', 'Star', 'Bay', 'Lake', 'Bright', 'Shadow',
]

const ROOTS = [
    'haven', 'port', 'ville', 'burg', 'ford', 'field', 'ton', 'dale', 'wood', 'brook',
    'ridge', 'vale', 'crest', 'peak', 'shore', 'gate', 'bridge', 'stone', 'cliff', 'marsh',
]

const SUFFIXES = [
    'City', 'Heights', 'Springs', 'Falls', 'Bay', 'Park', 'Hills', 'Point', 'Creek', '',
]

function hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
}

export function generateCityName(username) {
    const hash = hashString(username)
    const prefix = PREFIXES[hash % PREFIXES.length]
    const root = ROOTS[(hash >> 4) % ROOTS.length]
    const suffix = SUFFIXES[(hash >> 8) % SUFFIXES.length]

    // Capitalize root
    const capitalRoot = root.charAt(0).toUpperCase() + root.slice(1)

    return `${prefix} ${capitalRoot}${suffix ? ' ' + suffix : ''}`
}
