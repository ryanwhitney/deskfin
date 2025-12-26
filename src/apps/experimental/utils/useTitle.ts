import { useEffect } from 'react';

/**
 * Hook to set the HTML document title and header title for experimental routes
 * @param title - The title to set. If null or undefined, sets to default title
 * @param fallback - Optional fallback title if title is not provided
 */
export function useTitle(title?: string | null, fallback?: string) {
    useEffect(() => {
        const finalTitle = title || fallback;

        // Import libraryMenu dynamically to avoid circular dependencies
        void import('scripts/libraryMenu').then((libraryMenu) => {
            if (finalTitle) {
                libraryMenu.default.setTitle(finalTitle);
            } else {
                libraryMenu.default.setDefaultTitle();
            }
        });
    }, [title, fallback]);
}
