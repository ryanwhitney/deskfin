import React, { type FC, type ReactNode } from 'react';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import styles from './Section.module.scss';

export interface SectionProps {
    title: string;
    titleHref?: string;
    compact?: boolean;
    padded?: boolean;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    variant?: 'portrait' | 'landscape';
}

export const Section: FC<SectionProps> = ({
    title,
    titleHref,
    compact = false,
    padded = false,
    actions,
    children,
    className,
    variant
}) => {
    return (
        <section
            className={[styles.section, className].filter(Boolean).join(' ')}
            data-compact={compact || undefined}
            data-padded={padded || undefined}
        >
            <div className={styles.header}>
                {titleHref ? (
                    <a href={titleHref} className={styles.titleLink}>
                        <h2 className={styles.title}>{title}</h2>
                        <SvgIcon svg={IconSvgs.chevronDown} size={20} className={styles.chevron} />
                    </a>
                ) : (
                    <h2 className={styles.titleStatic}>{title}</h2>
                )}

                {actions ? (
                    <div className={styles.actions}>
                        {actions}
                    </div>
                ) : null}
            </div>

            <div className={styles.content} data-variant={variant}>
                {children}
            </div>
        </section>
    );
};

export default Section;
