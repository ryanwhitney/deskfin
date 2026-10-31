import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';

import { useApi } from 'hooks/useApi';
import type { ItemDto } from 'types/base/models/item-dto';

import { useMovePlaylistItemMutation } from './useMovePlaylistItemMutation';
import { useRemoveFromPlaylistMutation } from './useRemoveFromPlaylistMutation';

export interface PlaylistContext {
    playlistId: string;
    playlistName: string;
}

/** Reorder/remove actions for an item shown inside a playlist. Each calls `onAfterAction` on success. */
export const usePlaylistItemActions = (
    item: ItemDto,
    playlistContext: PlaylistContext | undefined,
    onAfterAction: () => void
) => {
    const { api, user } = useApi();
    const { mutateAsync: removeFromPlaylist } = useRemoveFromPlaylistMutation();
    const { mutateAsync: movePlaylistItem } = useMovePlaylistItemMutation();
    const entryId = item.PlaylistItemId;

    const remove = async () => {
        if (!playlistContext || !entryId) return;
        try {
            await removeFromPlaylist({ playlistId: playlistContext.playlistId, entryIds: [ entryId ] });
            onAfterAction();
        } catch (error) {
            console.error('[Playlist] Failed to remove from playlist:', error);
        }
    };

    const moveToFront = async () => {
        if (!playlistContext || !entryId) return;
        try {
            await movePlaylistItem({ playlistId: playlistContext.playlistId, itemId: entryId, newIndex: 0 });
            onAfterAction();
        } catch (error) {
            console.error('[Playlist] Failed to move to front:', error);
        }
    };

    const moveToBack = async () => {
        if (!playlistContext || !entryId || !api || !user?.Id) return;
        try {
            // Fetch the playlist item count to get the correct last index
            const response = await getPlaylistApi(api).getPlaylistItems({
                playlistId: playlistContext.playlistId,
                userId: user.Id,
                limit: 1
            });
            const totalCount = response.data.TotalRecordCount ?? 0;
            if (totalCount === 0) return;

            await movePlaylistItem({ playlistId: playlistContext.playlistId, itemId: entryId, newIndex: totalCount - 1 });
            onAfterAction();
        } catch (error) {
            console.error('[Playlist] Failed to move to back:', error);
        }
    };

    return { remove, moveToFront, moveToBack };
};
