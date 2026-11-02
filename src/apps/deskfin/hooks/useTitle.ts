import { useEffect } from 'react';

import { useServerName } from './useServerName';

/**
 * Hook to set the HTML document title and header title for experimental routes, followed by the server name
 * (e.g. "Movies - Jellyfin")
 * @param title - The title to set. If null or undefined, the title is just the server name
 * @param fallback - Optional fallback title if title is not provided
 */
export function useTitle(title?: string | null, fallback?: string) {
    const serverName = useServerName();

    useEffect(() => {
        const pageTitle = title || fallback;
        const finalTitle = pageTitle && serverName ? `${pageTitle} - ${serverName}` : pageTitle || serverName;

        // Import libraryMenu dynamically to avoid circular dependencies
        void import('scripts/libraryMenu').then((libraryMenu) => {
            if (finalTitle) {
                libraryMenu.default.setTitle(finalTitle);
            } else {
                libraryMenu.default.setDefaultTitle();
            }
        });
    }, [title, fallback, serverName]);
}
