const SITE_TITLE = 'desk';

/**
 * Formats a library title with the site title
 * @param libraryName - The library name (e.g., "Movies", "TV Shows")
 * @param tabName - Optional tab name (e.g., "Favorites", "Genres")
 * @returns Formatted title like "Movies - desk" or "Favorites - Movies - desk"
 */
export function formatLibraryTitle(libraryName: string, tabName?: string): string {
    if (tabName && tabName !== libraryName) {
        return `${tabName} - ${libraryName} - ${SITE_TITLE}`;
    }
    return `${libraryName} - ${SITE_TITLE}`;
}

/**
 * Formats an item title with proper context and site title
 * @param itemName - The item name
 * @param itemType - The item type (Movie, Series, Season, Episode, etc.)
 * @param seriesName - Optional series name (for seasons/episodes)
 * @param seasonName - Optional season name (for episodes)
 * @returns Formatted title with proper hierarchy and site title
 */
export function formatItemTitle(
    itemName: string | null | undefined,
    itemType?: string,
    seriesName?: string | null,
    seasonName?: string | null
): string {
    if (!itemName) return SITE_TITLE;

    const parts: string[] = [];

    // Add the item name first
    parts.push(itemName);

    // Add season name for episodes
    if (itemType === 'Episode' && seasonName && seasonName !== itemName) {
        parts.push(seasonName);
    }

    // Add series name for seasons and episodes
    if ((itemType === 'Season' || itemType === 'Episode') && seriesName) {
        parts.push(seriesName);
    }

    // Add site title
    parts.push(SITE_TITLE);

    return parts.join(' - ');
}
