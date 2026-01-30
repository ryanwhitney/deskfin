import React, { type FC, type PropsWithChildren, useEffect } from 'react';

import { useMatchMedia } from 'apps/deskfin/hooks/useMatchMedia';

import styles from './ResponsiveDrawer.module.scss';

export interface ResponsiveDrawerProps {
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
}

export const ResponsiveDrawer: FC<PropsWithChildren<ResponsiveDrawerProps>> = ({
    children,
    open,
    onClose
}) => {
    const isDesktop = useMatchMedia('(min-width: 900px)');

    // Escape to close on mobile
    useEffect(() => {
        if (!open || isDesktop) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isDesktop, onClose, open]);

    if (isDesktop) {
        return (
            <aside className={styles.panel}>
                {children}
            </aside>
        );
    }

    return (
        <>
            <div
                className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
                {/* Close drawer when content is clicked (match previous behavior) */}
                <div onClick={onClose} onKeyDown={onClose} role="presentation">
                    {children}
                </div>
            </aside>
        </>
    );
};


