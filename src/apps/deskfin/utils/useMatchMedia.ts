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

        // eslint-disable-next-line compat/compat
        if (typeof mql.addEventListener === 'function') {
            // eslint-disable-next-line compat/compat
            mql.addEventListener('change', onChange);
            return () => {
                // eslint-disable-next-line compat/compat
                mql.removeEventListener('change', onChange);
            };
        }

        // Safari < 14
        // eslint-disable-next-line deprecation/deprecation
        mql.addListener(onChange);
        return () => {
            // eslint-disable-next-line deprecation/deprecation
            mql.removeListener(onChange);
        };
    }, [query]);

    return matches;
}


