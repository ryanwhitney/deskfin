import { useEffect, useState } from 'react';

/**
 * Lightweight `matchMedia` hook (experimental-only) to avoid pulling MUI's
 * `useMediaQuery` into the app shell.
 */
export function useMatchMedia(query: string) {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);

        onChange();

        mql.addEventListener('change', onChange);
        return () => {
            mql.removeEventListener('change', onChange);
        };
    }, [query]);

    return matches;
}

