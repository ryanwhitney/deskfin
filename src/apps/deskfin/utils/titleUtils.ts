// useTitle adds the server name to these, e.g. "Favorites - Movies - Jellyfin"

/**
 * Formats a library title
 * @param libraryName - The library name (e.g., "Movies", "TV Shows")
 * @param tabName - Optional tab name (e.g., "Favorites", "Genres")
 * @returns Formatted title like "Movies" or "Favorites - Movies"
 */
export function formatLibraryTitle(libraryName: string, tabName?: string): string {
    if (tabName && tabName !== libraryName) {
        return `${tabName} - ${libraryName}`;
    }
    return libraryName;
}

/**
 * Formats an item title with proper context
 * @param itemName - The item name
 * @param itemType - The item type (Movie, Series, Season, Episode, etc.)
 * @param seriesName - Optional series name (for seasons/episodes)
 * @param seasonName - Optional season name (for episodes)
 * @returns Formatted title with proper hierarchy, or an empty string without a name
 */
export function formatItemTitle(
    itemName: string | null | undefined,
    itemType?: string,
    seriesName?: string | null,
    seasonName?: string | null
): string {
    if (!itemName) return '';

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

    return parts.join(' - ');
}
