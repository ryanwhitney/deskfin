import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { type FC, useCallback } from 'react';

import { useGetItems, useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import type { ParentId } from 'types/library';
import type { ItemDto } from 'types/base/models/item-dto';

import { Section } from 'apps/deskfin/components/media/Section';
import { ItemGrid } from 'apps/deskfin/components/media/ItemGrid';

interface GenresSectionContainerProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
    genre: ItemDto;
}

const GenresSectionContainer: FC<GenresSectionContainerProps> = ({
    parentId,
    collectionType,
    itemType,
    genre
}) => {
    const getParametersOptions = () => {
        return {
            sortBy: [ItemSortBy.Random],
            sortOrder: [SortOrder.Ascending],
            includeItemTypes: itemType,
            recursive: true,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.MediaSourceCount
            ],
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary],
            limit: 25,
            genreIds: genre.Id ? [genre.Id] : undefined,
            enableTotalRecordCount: false,
            parentId: parentId ?? undefined
        };
    };

    const { isLoading, data: itemsResult, refetch } = useGetItems(getParametersOptions());

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const onAfterAction = useCallback(() => {
        void refetch();
    }, [refetch]);

    const onToggleFavorite = useCallback(async (item: ItemDto) => {
        await toggleFavorite({ itemId: item.Id!, isFavorite: !!item.UserData?.IsFavorite });
        onAfterAction();
    }, [onAfterAction, toggleFavorite]);

    const onTogglePlayed = useCallback(async (item: ItemDto) => {
        await togglePlayed({ itemId: item.Id!, isPlayed: !!item.UserData?.Played });
        onAfterAction();
    }, [onAfterAction, togglePlayed]);

    const getGenreUrl = () => {
        const serverId = window.ApiClient?.serverId?.() || '';
        const isMusic = collectionType === CollectionType.Music;
        const genreParam = isMusic ? 'musicGenreId' : 'genreId';
        const parentParam = parentId ? `&parentId=${parentId}` : '';
        return `#/list?${genreParam}=${genre.Id}${parentParam}&serverId=${serverId}`;
    };

    if (isLoading) {
        return <Loading />;
    }

    // Determine variant based on collection type
    const variant = collectionType === CollectionType.Music ? 'square' : 'portrait';

    return (
        <Section
            title={genre.Name || ''}
            titleHref={getGenreUrl()}
        >
            <ItemGrid
                items={itemsResult?.Items || []}
                variant={variant}
                onToggleFavorite={onToggleFavorite}
                onTogglePlayed={onTogglePlayed}
                onAfterAction={onAfterAction}
            />
        </Section>
    );
};

export default GenresSectionContainer;
