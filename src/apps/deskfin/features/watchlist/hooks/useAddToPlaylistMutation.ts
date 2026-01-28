import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { useApi } from 'hooks/useApi';

interface AddToPlaylistParams {
    playlistId: string;
    itemIds: string[];
}

const addToPlaylist = async (
    api: ReturnType<typeof useApi>['api'],
    userId: string | undefined,
    params: AddToPlaylistParams
) => {
    if (!api || !userId) {
        throw new Error('API or user not available');
    }

    const { playlistId, itemIds } = params;

    const response = await getPlaylistsApi(api).addItemToPlaylist({
        playlistId,
        ids: itemIds,
        userId
    });

    return response.data;
};

/**
 * Mutation hook to add items to a playlist.
 * Invalidates playlist queries on success.
 */
export const useAddToPlaylistMutation = () => {
    const { api, user } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: AddToPlaylistParams) =>
            addToPlaylist(api, user?.Id, params),
        onSuccess: () => {
            // Invalidate playlists to refresh counts/contents
            queryClient.invalidateQueries({ queryKey: ['UserPlaylists'] });
            queryClient.invalidateQueries({ queryKey: ['PlaylistItems'] });
        }
    });
};
