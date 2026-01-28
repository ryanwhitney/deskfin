import React, { type FC, useEffect, useState } from 'react';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
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

    const fetchPlaylistItems = async () => {
        if (!api || !user?.Id) return;

        try {
            const response = await getPlaylistsApi(api).getPlaylistItems({
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
    };

    useEffect(() => {
        void fetchPlaylistItems();
    }, [api, playlistId, user?.Id]);

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
            cardVariant="portrait"
            linkHref={linkHref}
            linkText={linkText}
            user={user}
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
