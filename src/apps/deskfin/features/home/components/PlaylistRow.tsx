import React, { type FC, useCallback, useEffect, useState } from 'react';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';
import type { ItemDto } from 'types/base/models/item-dto';
import { useApi } from 'hooks/useApi';
import { HomeRow } from './HomeRow';

interface PlaylistRowProps {
    playlistId: string;
    title: string;
    linkHref?: string;
    linkText?: string;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    onAfterAction: () => void;
}

/**
 * HomeRow that fetches and displays items from a specific playlist.
 */
export const PlaylistRow: FC<PlaylistRowProps> = ({
    playlistId,
    title,
    linkHref,
    linkText,
    onToggleFavorite,
    onTogglePlayed,
    onAfterAction
}) => {
    const { api, user } = useApi();
    const [items, setItems] = useState<ItemDto[]>([]);

    const fetchPlaylistItems = useCallback(async () => {
        if (!api || !user?.Id) return;

        try {
            const response = await getPlaylistApi(api).getPlaylistItems({
                playlistId,
                userId: user.Id,
                limit: 12,
                fields: ['PrimaryImageAspectRatio'],
                enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
                enableUserData: true
            });

            setItems((response.data.Items || []) as ItemDto[]);
        } catch (error) {
            console.error('[PlaylistRow] Failed to fetch playlist items:', error);
            setItems([]);
        }
    }, [api, playlistId, user?.Id]);

    useEffect(() => {
        void fetchPlaylistItems();
    }, [fetchPlaylistItems]);

    const handleAfterAction = () => {
        // Refetch playlist items to reflect changes
        void fetchPlaylistItems();
        // Also call parent's onAfterAction
        onAfterAction();
    };

    // Don't render if no items
    if (items.length === 0) return null;

    return (
        <HomeRow
            title={title}
            items={items}
            cardVariant='portrait'
            linkHref={linkHref}
            linkText={linkText}
            onToggleFavorite={onToggleFavorite}
            onTogglePlayed={onTogglePlayed}
            onAfterAction={handleAfterAction}
            playlistContext={{
                playlistId,
                playlistName: title
            }}
        />
    );
};
