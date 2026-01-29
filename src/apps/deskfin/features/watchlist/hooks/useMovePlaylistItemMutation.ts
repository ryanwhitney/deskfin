import { useMutation } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { useApi } from 'hooks/useApi';

interface MovePlaylistItemParams {
    playlistId: string;
    itemId: string;
    newIndex: number;
}

/**
 * Hook to move an item within a playlist to a new position.
 */
export const useMovePlaylistItemMutation = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async ({ playlistId, itemId, newIndex }: MovePlaylistItemParams) => {
            if (!api) throw new Error('API not available');

            const playlistsApi = getPlaylistsApi(api);
            await playlistsApi.moveItem({
                playlistId,
                itemId,
                newIndex
            });
        }
    });
};
