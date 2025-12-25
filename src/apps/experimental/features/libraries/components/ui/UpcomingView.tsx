import React, { type FC, useCallback } from 'react';

import { useGetGroupsUpcomingEpisodes, useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import type { LibraryViewProps } from 'types/library';
import type { ItemDto } from 'types/base/models/item-dto';

import { Section } from 'apps/experimental/components/media/Section';
import { ItemGrid } from 'apps/experimental/components/media/ItemGrid';

const UpcomingView: FC<LibraryViewProps> = ({ parentId }) => {
    const { isLoading, data: groupsUpcomingEpisodes, refetch } =
        useGetGroupsUpcomingEpisodes(parentId);

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

    if (isLoading) return <Loading />;

    if (!groupsUpcomingEpisodes?.length) {
        return <NoItemsMessage message='MessagePleaseEnsureInternetMetadata' />;
    }

    return (
        <>
            {groupsUpcomingEpisodes.map((group) => (
                <Section key={group.name} title={group.name}>
                    <ItemGrid
                        items={group.items}
                        variant="landscape"
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        onAfterAction={onAfterAction}
                    />
                </Section>
            ))}
        </>
    );
};

export default UpcomingView;
