import React, { type FC, type PropsWithChildren, useEffect } from 'react';

import { useMatchMedia } from 'apps/deskfin/utils/useMatchMedia';

import styles from './ExperimentalResponsiveDrawer.module.scss';

export interface ExperimentalResponsiveDrawerProps {
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
}

export const ExperimentalResponsiveDrawer: FC<PropsWithChildren<ExperimentalResponsiveDrawerProps>> = ({
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


