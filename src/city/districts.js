/**
 * Language → District Style Mapping
 * Each language gets a distinct color palette and building style
 */

export const DISTRICT_STYLES = {
    JavaScript: {
        name: 'JavaScript District',
        primary: '#F7DF1E',
        secondary: '#E8B708',
        accent: '#FFE066',
        ground: '#3D3500',
        buildingStyle: 'modern', // glass towers
    },
    TypeScript: {
        name: 'TypeScript Quarter',
        primary: '#3178C6',
        secondary: '#245EA8',
        accent: '#5B9EF5',
        ground: '#0D2240',
        buildingStyle: 'geometric', // clean cubes
    },
    Python: {
        name: 'Python Gardens',
        primary: '#3776AB',
        secondary: '#FFD43B',
        accent: '#4B9CD3',
        ground: '#1A3350',
        buildingStyle: 'organic', // rounded shapes
    },
    Java: {
        name: 'Java Industrial',
        primary: '#ED8B00',
        secondary: '#5382A1',
        accent: '#F0A030',
        ground: '#2D1F00',
        buildingStyle: 'industrial',
    },
    'C++': {
        name: 'C++ Foundry',
        primary: '#00599C',
        secondary: '#004482',
        accent: '#659AD2',
        ground: '#001A33',
        buildingStyle: 'industrial',
    },
    C: {
        name: 'C Foundry',
        primary: '#555555',
        secondary: '#A8B9CC',
        accent: '#777777',
        ground: '#1A1A1A',
        buildingStyle: 'brutalist',
    },
    Rust: {
        name: 'Rust Works',
        primary: '#CE422B',
        secondary: '#A33720',
        accent: '#E0604D',
        ground: '#2A0F09',
        buildingStyle: 'angular', // sharp industrial
    },
    Go: {
        name: 'Go District',
        primary: '#00ADD8',
        secondary: '#007D9C',
        accent: '#5DC9E2',
        ground: '#002B36',
        buildingStyle: 'minimal', // clean cubes
    },
    Ruby: {
        name: 'Ruby Row',
        primary: '#CC342D',
        secondary: '#A32822',
        accent: '#E05A53',
        ground: '#2A0B09',
        buildingStyle: 'ornate',
    },
    PHP: {
        name: 'PHP Quarter',
        primary: '#777BB4',
        secondary: '#5A5E91',
        accent: '#999ED4',
        ground: '#1A1B30',
        buildingStyle: 'modern',
    },
    Swift: {
        name: 'Swift Heights',
        primary: '#FA7343',
        secondary: '#F05138',
        accent: '#FFB088',
        ground: '#301508',
        buildingStyle: 'sleek',
    },
    Kotlin: {
        name: 'Kotlin Towers',
        primary: '#7F52FF',
        secondary: '#B125EA',
        accent: '#C084FC',
        ground: '#1A0A3D',
        buildingStyle: 'modern',
    },
    'C#': {
        name: 'C# Center',
        primary: '#68217A',
        secondary: '#953DAD',
        accent: '#B06ABC',
        ground: '#1A0722',
        buildingStyle: 'geometric',
    },
    Shell: {
        name: 'Shell Terminal',
        primary: '#89E051',
        secondary: '#5CB02E',
        accent: '#AAF070',
        ground: '#0D2200',
        buildingStyle: 'minimal',
    },
    HTML: {
        name: 'HTML Plaza',
        primary: '#E34F26',
        secondary: '#F06529',
        accent: '#F28D6A',
        ground: '#2A1209',
        buildingStyle: 'ornate',
    },
    CSS: {
        name: 'CSS Boulevard',
        primary: '#1572B6',
        secondary: '#33A9DC',
        accent: '#6BC1E4',
        ground: '#061F2F',
        buildingStyle: 'modern',
    },
    Vue: {
        name: 'Vue Village',
        primary: '#4FC08D',
        secondary: '#35495E',
        accent: '#7DD3AE',
        ground: '#0B2817',
        buildingStyle: 'organic',
    },
    Dart: {
        name: 'Dart District',
        primary: '#0175C2',
        secondary: '#024F8E',
        accent: '#46C1F6',
        ground: '#001F33',
        buildingStyle: 'geometric',
    },
}

// Default for unknown languages
export const DEFAULT_STYLE = {
    name: 'Mixed District',
    primary: '#8888AA',
    secondary: '#6666AA',
    accent: '#AAAACC',
    ground: '#1A1A2A',
    buildingStyle: 'modern',
}

/**
 * Get district style for a given language
 */
export function getDistrictStyle(language) {
    if (!language) return DEFAULT_STYLE
    return DISTRICT_STYLES[language] || DEFAULT_STYLE
}

/**
 * Get all unique languages from repos and assign district sectors
 */
export function assignDistricts(repos) {
    // Count repos per language
    const langCounts = {}
    for (const repo of repos) {
        const lang = repo.language || 'Other'
        langCounts[lang] = (langCounts[lang] || 0) + 1
    }

    // Sort by count (biggest district first)
    const sortedLangs = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([lang]) => lang)

    return sortedLangs
}
