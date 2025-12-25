import React, { type ReactNode } from 'react';

import styles from './ActionMenu.module.scss';

export const ActionMenuStyles = styles;

export function ActionMenuIcon({ children }: Readonly<{ children?: ReactNode }>) {
    return (
        <span className={styles.icon} aria-hidden="true">
            {children}
        </span>
    );
}



