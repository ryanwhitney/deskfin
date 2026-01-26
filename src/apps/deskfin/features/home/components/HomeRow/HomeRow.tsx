import React, { type FC, useEffect, useState } from 'react';
import { GridList, GridListItem } from 'react-aria-components';
import { MediaCard, MediaCardStyles } from 'apps/deskfin/components/media/MediaCard';
import type { ItemDto } from 'types/base/models/item-dto';
import {
    buildCardImageUrl,
    getCardMeta,
    getProgressPct,
    getOverlayCount,
    canNavigate
} from '../../utils/cardHelpers';
import styles from '../../routes/HomeRoute.module.scss';

interface HomeRowProps {
    title: string;
    items: ItemDto[];
    user: any;
    onAfterAction: () => void;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    cardVariant?: 'portrait' | 'landscape';
    linkHref?: string;
    linkText?: string;
}

export const HomeRow: FC<HomeRowProps> = ({
    title,
    items,
    user,
    onAfterAction,
    onToggleFavorite,
    onTogglePlayed,
    cardVariant = 'portrait',
    linkHref,
    linkText
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

    const openDetailsById = (id: string) => {
        if (!canNavigate()) return;
        window.location.href = `#/details?id=${id}`;
    };

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
            <GridList
                aria-label={title}
                className={styles.row}
                selectionMode="none"
                onAction={(key) => openDetailsById(String(key))}
            >
                {items.map(it => {
                    const id = it.Id ?? `${title}-${it.Name ?? 'item'}`;
                    const meta = getCardMeta(it);
                    const img = buildCardImageUrl(it, {
                        variant: cardVariant,
                        maxWidth: cardVariant === 'landscape' ? 720 : 420
                    });

                    return (
                        <GridListItem
                            key={id}
                            id={id}
                            textValue={it.Name ?? ''}
                            className={MediaCardStyles.gridItem}
                        >
                            {({ isFocused }) => (
                                <MediaCard
                                    item={it}
                                    user={user}
                                    variant={cardVariant}
                                    imageUrl={img}
                                    overlayCount={getOverlayCount(it)}
                                    progressPct={getProgressPct(it)}
                                    title={meta.title}
                                    titleHref={meta.titleHref}
                                    subtitle={meta.subtitle}
                                    subtitleHref={meta.subtitleHref}
                                    isRovingFocused={isFocused}
                                    onAfterAction={onAfterAction}
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                />
                            )}
                        </GridListItem>
                    );
                })}
            </GridList>
        </section>
    );
};
