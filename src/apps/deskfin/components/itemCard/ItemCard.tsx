import React from 'react';
import { Squircle } from 'apps/deskfin/components/squircle/Squircle';
import styles from './ItemCard.module.scss';

type Classy = { className?: string };

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

export type ItemCardProps = {
    /** Renders the card as a link; without it the card is a plain element (e.g. inside a list item that links). */
    href?: string;
    title: React.ReactNode;
    imageUrl?: string;
    imageFallback?: string;
    badge?: React.ReactNode;
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
 * Minimal, reusable "card" primitive for experimental.
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
    className,
    classes
}: Readonly<ItemCardProps>) {
    const Root = href ? 'a' : 'div';

    return (
        <Root
            href={href}
            className={cx(styles.root, classes?.root, className)}
        >
            <Squircle
                radius={16}
                className={cx(styles.image, classes?.image)}
                style={{ backgroundColor: imageUrl ? undefined : imageFallback }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt='' // title is shown below
                        className={styles.img}
                    />
                ) : null}
                {badge}
            </Squircle>
            <div className={cx(styles.title, classes?.title)}>
                {title}
            </div>
        </Root>
    );
}

