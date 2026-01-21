import { useRef, useCallback, useEffect } from 'react';

// Track globally whether the last pointer interaction was mouse/touch
// This is needed because focus can be restored to elements that weren't
// directly involved in the interaction (e.g., menu trigger after modal closes)
let lastGlobalPointerType: string | null = null;

if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', (e) => {
        lastGlobalPointerType = e.pointerType;
    }, true);
    document.addEventListener('keydown', (e) => {
        // Only reset for navigation/activation keys, not modifier keys
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            lastGlobalPointerType = 'keyboard';
        }
    }, true);
}

/**
 * Hook to blur a button after mouse/touch press (but not keyboard press).
 * This prevents spacebar from re-triggering recently clicked buttons,
 * while preserving keyboard accessibility (Tab + Spacebar still works).
 *
 * For menu triggers, also call `blurOnMenuClose()` in onOpenChange when
 * the menu closes, to handle the case where clicking the button to close
 * the menu causes React Aria to refocus it.
 */
export function useBlurOnMousePress<T extends HTMLElement = HTMLButtonElement>() {
    const ref = useRef<T>(null);

    // Blur when this element receives focus after a mouse/touch interaction
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleFocus = () => {
            // If focus was restored after a mouse/touch interaction, blur it
            if (lastGlobalPointerType === 'mouse' || lastGlobalPointerType === 'touch') {
                // Small delay to let React Aria finish its focus management
                setTimeout(() => {
                    if (document.activeElement === element) {
                        element.blur();
                    }
                }, 0);
            }
        };

        element.addEventListener('focus', handleFocus);
        return () => element.removeEventListener('focus', handleFocus);
    }, []);

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

    // Call this when a menu/modal closes - kept for compatibility but
    // the focus listener above should handle most cases now
    const blurOnMenuClose = useCallback(() => {
        if ((lastGlobalPointerType === 'mouse' || lastGlobalPointerType === 'touch') && ref.current) {
            setTimeout(() => {
                if (ref.current && document.activeElement === ref.current) {
                    ref.current.blur();
                }
            }, 50);
        }
    }, []);

    return { ref, handlePress, blurOnMenuClose };
}
