import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { useApi } from 'hooks/useApi';

interface RemoveFromPlaylistParams {
    playlistId: string;
    entryIds: string[];
}

const removeFromPlaylist = async (
    api: ReturnType<typeof useApi>['api'],
    params: RemoveFromPlaylistParams
) => {
    if (!api) {
        throw new Error('API not available');
    }

    const { playlistId, entryIds } = params;

    const response = await getPlaylistsApi(api).removeItemFromPlaylist({
        playlistId,
        entryIds
    });

    return response.data;
};

/**
 * Mutation hook to remove items from a playlist.
 * Invalidates playlist queries on success.
 */
export const useRemoveFromPlaylistMutation = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: RemoveFromPlaylistParams) =>
            removeFromPlaylist(api, params),
        onSuccess: () => {
            // Invalidate playlists to refresh counts/contents
            queryClient.invalidateQueries({ queryKey: ['UserPlaylists'] });
            queryClient.invalidateQueries({ queryKey: ['PlaylistItems'] });
        }
    });
};
