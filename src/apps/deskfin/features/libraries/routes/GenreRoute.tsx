import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import Page from 'components/Page';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import globalize from 'lib/globalize';
import { useItem } from 'hooks/useItem';
import {
    useToggleFavoriteMutation,
    useTogglePlayedMutation
} from 'hooks/useFetchItems';
import { useGetItems } from 'apps/deskfin/hooks/api/useGetItems';
import { useTitle } from 'apps/deskfin/hooks/useTitle';
import { formatItemTitle } from 'apps/deskfin/utils/titleUtils';

import type { ItemDto } from 'types/base/models/item-dto';

import { MediaCardList } from 'apps/deskfin/components/media/MediaCardList';
import styles from 'apps/deskfin/components/library/LibraryToolbar.module.scss';

const getIncludeItemTypesForGenre = (
    genre: ItemDto | undefined
): BaseItemKind[] | undefined => {
    const t = genre?.Type;
    if (t === 'MusicGenre') return [BaseItemKind.MusicAlbum];

    const ct = genre?.CollectionType;
    if (ct === CollectionType.Movies) return [BaseItemKind.Movie];
    if (ct === CollectionType.Tvshows) return [BaseItemKind.Series];

    // General genre: show the usual mix.
    return [BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Video];
};

export default function GenrePage() {
    const [params] = useSearchParams();
    const genreId = params.get('id') || params.get('genreId') || '';
    const parentId =
        params.get('parentId') || params.get('topParentId') || undefined;

    const { data: genre } = useItem(genreId || undefined);

    useTitle(genre ? formatItemTitle(genre.Name, genre.Type) : undefined);

    const queryKey = useMemo(
        () => ['Genre', genreId, parentId] as string[],
        [genreId, parentId]
    );
    const includeItemTypes = useMemo(
        () => getIncludeItemTypesForGenre(genre),
        [genre]
    );

    const {
        data: itemsResult,
        isLoading,
        refetch
    } = useGetItems({
        genreIds: genreId ? [genreId] : undefined,
        parentId,
        recursive: true,
        includeItemTypes,
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSourceCount
        ],
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop]
    });

    const items = (itemsResult?.Items || []) as ItemDto[];

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const onAfterAction = useCallback(() => {
        void refetch();
    }, [refetch]);

    const onToggleFavorite = useCallback(
        async (cardItem: ItemDto) => {
            await toggleFavorite({
                itemId: cardItem.Id!,
                isFavorite: !!cardItem.UserData?.IsFavorite
            });
            onAfterAction();
        },
        [onAfterAction, toggleFavorite]
    );

    const onTogglePlayed = useCallback(
        async (cardItem: ItemDto) => {
            await togglePlayed({
                itemId: cardItem.Id!,
                isPlayed: !!cardItem.UserData?.Played
            });
            onAfterAction();
        },
        [onAfterAction, togglePlayed]
    );

    return (
        <Page
            id='genrePage'
            className='mainAnimatedPage libraryPage backdropPage'
            isBackButtonEnabled
            backDropType={[BaseItemKind.Movie, BaseItemKind.Series]}
        >
            {isLoading ? (
                <Loading />
            ) : (
                <ItemsContainer queryKey={queryKey}>
                    {items.length ? (
                        <div className={styles.gridContainer}>
                            <h1 className={styles.sectionHeader}>
                                {genre?.Name || globalize.translate('Genres')}
                            </h1>
                            <MediaCardList
                                aria-label={genre?.Name || globalize.translate('Genres')}
                                className={styles.grid}
                                items={items}
                                onToggleFavorite={onToggleFavorite}
                                onTogglePlayed={onTogglePlayed}
                                onAfterAction={onAfterAction}
                            />
                        </div>
                    ) : (
                        <NoItemsMessage message='MessageNoItemsAvailable' />
                    )}
                </ItemsContainer>
            )}
        </Page>
    );
}
