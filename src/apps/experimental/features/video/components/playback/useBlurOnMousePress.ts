import { useRef, useCallback } from 'react';

/**
 * Hook to blur a button after mouse/touch press (but not keyboard press).
 * This prevents spacebar from re-triggering recently clicked buttons,
 * while preserving keyboard accessibility (Tab + Spacebar still works).
 */
export function useBlurOnMousePress<T extends HTMLElement = HTMLButtonElement>() {
    const ref = useRef<T>(null);

    const handlePress = useCallback((e: any) => {
        // Only blur if this was a mouse or touch interaction
        // Keyboard interactions (pointerType === undefined or 'keyboard') keep focus
        if ((e.pointerType === 'mouse' || e.pointerType === 'touch') && ref.current) {
            // Blur after a short delay to allow the press action to complete
            setTimeout(() => {
                ref.current?.blur();
            }, 0);
        }
    }, []);

    return { ref, handlePress };
}
