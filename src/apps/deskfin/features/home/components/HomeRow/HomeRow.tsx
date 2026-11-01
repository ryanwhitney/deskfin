import React, { type FC, useEffect, useState } from 'react';
import { MediaCardList } from 'apps/deskfin/components/media/MediaCardList';
import type { ItemDto } from 'types/base/models/item-dto';
import styles from '../../routes/HomeRoute.module.scss';

interface HomeRowProps {
    title: string;
    items: ItemDto[];
    onAfterAction: () => void;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    cardVariant?: 'portrait' | 'landscape';
    /** Row is visible at first paint: its first cards' images load immediately at high priority. */
    isPriority?: boolean;
    linkHref?: string;
    linkText?: string;
    playlistContext?: {
        playlistId: string;
        playlistName: string;
    };
}

/** Landscape cards visible across a wide window; their images are fetched first. */
const PRIORITY_CARDS = 5;

export const HomeRow: FC<HomeRowProps> = ({
    title,
    items,
    onAfterAction,
    onToggleFavorite,
    onTogglePlayed,
    cardVariant = 'portrait',
    isPriority = false,
    linkHref,
    linkText,
    playlistContext
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (items.length > 0) {
            // Small delay to trigger fade animation
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        }
    }, [items.length]);

    if (!items.length) return null;

    return (
        <section className={`${styles.section} ${isVisible ? styles.visible : ''}`}>
            {linkHref ? (
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                    <a href={linkHref} className={styles.sectionLink}>{linkText || 'View all'} &rsaquo;</a>
                </div>
            ) : (
                <h2 className={styles.sectionTitleStandalone}>{title}</h2>
            )}
            <MediaCardList
                aria-label={title}
                className={styles.row}
                items={items}
                variant={cardVariant}
                imageMaxWidth={cardVariant === 'landscape' ? 720 : 420}
                priorityCount={isPriority ? PRIORITY_CARDS : 0}
                onAfterAction={onAfterAction}
                onToggleFavorite={onToggleFavorite}
                onTogglePlayed={onTogglePlayed}
                playlistContext={playlistContext}
            />
        </section>
    );
};
