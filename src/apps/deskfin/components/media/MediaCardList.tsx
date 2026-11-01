import React, { type FC } from 'react';
import { GridListItem } from 'react-aria-components';
import type { ItemDto } from 'types/base/models/item-dto';
import { useApi } from 'hooks/useApi';
import {
    buildCardImageUrl,
    canNavigate,
    getCardMeta,
    getOverlayCount,
    getProgressPct
} from 'apps/deskfin/features/home/utils/cardHelpers';
import type { PlaylistContext } from 'apps/deskfin/features/watchlist/hooks/usePlaylistItemActions';
import { CardList } from './CardList';
import { MediaCard, MediaCardStyles, type MediaCardVariant } from './MediaCard';

const noop = () => undefined;

export interface MediaCardListProps {
    'aria-label': string;
    items: ItemDto[];
    variant?: MediaCardVariant;
    className?: string;
    /** Passed to the list element, for styles keyed on it. */
    'data-variant'?: string;
    imageMaxWidth?: number;
    /** How many of the first cards are visible at first paint: their images load immediately at high priority. */
    priorityCount?: number;
    playlistContext?: PlaylistContext;
    onToggleFavorite?: (item: ItemDto) => void;
    onTogglePlayed?: (item: ItemDto) => void;
    onAfterAction?: () => void;
}

const openDetails = (id: string) => {
    if (canNavigate()) window.location.href = `#/details?id=${id}`;
};

/** A {@link CardList} of {@link MediaCard}s: Enter opens the focused item's details. */
export const MediaCardList: FC<MediaCardListProps> = ({
    items,
    variant = 'portrait',
    imageMaxWidth,
    priorityCount = 0,
    playlistContext,
    onToggleFavorite = noop,
    onTogglePlayed = noop,
    onAfterAction = noop,
    ...listProps
}) => {
    const { user } = useApi();

    return (
        <CardList {...listProps}>
            {items.map((item, index) => {
                const id = item.Id ?? `${index}-${item.Name ?? 'item'}`;
                const meta = getCardMeta(item);

                return (
                    <GridListItem
                        key={id}
                        id={id}
                        textValue={item.Name ?? ''}
                        className={MediaCardStyles.gridItem}
                        onAction={item.Id ? () => openDetails(id) : undefined}
                    >
                        {({ isFocused }) => (
                            <MediaCard
                                item={item}
                                user={user}
                                variant={variant}
                                imageUrl={buildCardImageUrl(item, { variant, maxWidth: imageMaxWidth })}
                                isImagePriority={index < priorityCount}
                                overlayCount={getOverlayCount(item)}
                                progressPct={getProgressPct(item)}
                                title={meta.title}
                                titleHref={meta.titleHref}
                                subtitle={meta.subtitle}
                                subtitleHref={meta.subtitleHref}
                                isRovingFocused={isFocused}
                                onAfterAction={onAfterAction}
                                onToggleFavorite={onToggleFavorite}
                                onTogglePlayed={onTogglePlayed}
                                playlistContext={playlistContext}
                            />
                        )}
                    </GridListItem>
                );
            })}
        </CardList>
    );
};
