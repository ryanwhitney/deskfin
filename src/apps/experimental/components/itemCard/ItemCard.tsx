import React from 'react';
import styles from './ItemCard.module.scss';

type Classy = { className?: string };

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

export type ItemCardProps = {
    href: string;
    title: React.ReactNode;
    imageUrl?: string;
    imageFallback?: string;
    badge?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    /**
     * Optional slot class overrides (typically CSS module classes) to adapt this
     * primitive to feature-specific layouts.
     */
    classes?: Partial<{
        root: string;
        image: string;
        title: string;
    }>;
} & Classy;

/**
 * Minimal, reusable “card” primitive for experimental.
 *
 * It intentionally supports passing existing classNames so features can keep
 * their current styling (e.g. Details cards, Home cards) while we migrate.
 */
export function ItemCard({
    href,
    title,
    imageUrl,
    imageFallback = 'rgba(255,255,255,0.08)',
    badge,
    onClick,
    className,
    classes
}: Readonly<ItemCardProps>) {
    return (
        <a
            href={href}
            className={cx(styles.root, classes?.root, className)}
            onClick={onClick}
        >
            <div
                className={cx(styles.image, classes?.image)}
                style={{
                    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                    backgroundColor: imageUrl ? undefined : imageFallback
                }}
            >
                {badge}
            </div>
            <div className={cx(styles.title, classes?.title)}>
                {title}
            </div>
        </a>
    );
}


