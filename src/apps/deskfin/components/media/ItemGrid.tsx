import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'lib/globalize';

import type { PlaylistContext } from 'apps/deskfin/features/watchlist/hooks/usePlaylistItemActions';
import type { MediaCardVariant } from './MediaCard';
import { MediaCardList } from './MediaCardList';
import styles from './ItemGrid.module.scss';

export interface ItemGridProps {
    'aria-label': string;
    items: ItemDto[];
    variant?: MediaCardVariant;
    isLoading?: boolean;
    emptyMessage?: string;
    onToggleFavorite?: (item: ItemDto) => void;
    onTogglePlayed?: (item: ItemDto) => void;
    onAfterAction?: () => void;
    playlistContext?: PlaylistContext;
}

/** A wrapping grid of media cards. */
export const ItemGrid: FC<ItemGridProps> = ({
    items,
    variant = 'portrait',
    isLoading = false,
    emptyMessage,
    ...listProps
}) => {
    if (isLoading) {
        return (
            <div className={styles.loading}>
                <Loading />
            </div>
        );
    }

    if (!items.length && emptyMessage) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyText}>
                    {globalize.translate(emptyMessage) || emptyMessage}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.gridContainer}>
            <MediaCardList
                className={styles.grid}
                data-variant={variant}
                items={items}
                variant={variant}
                {...listProps}
            />
        </div>
    );
};

export default ItemGrid;
