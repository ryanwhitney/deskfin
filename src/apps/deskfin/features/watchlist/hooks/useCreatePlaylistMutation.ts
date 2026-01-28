import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import type { PlaylistCreationResult } from '@jellyfin/sdk/lib/generated-client/models/playlist-creation-result';
import { useApi } from 'hooks/useApi';

interface CreatePlaylistParams {
    name: string;
    isPublic?: boolean;
    itemIds?: string[];
}

const createPlaylist = async (
    api: ReturnType<typeof useApi>['api'],
    userId: string | undefined,
    params: CreatePlaylistParams
): Promise<PlaylistCreationResult> => {
    if (!api || !userId) {
        throw new Error('API or user not available');
    }

    const { name, isPublic = false, itemIds = [] } = params;

    const response = await getPlaylistsApi(api).createPlaylist({
        createPlaylistDto: {
            Name: name,
            Ids: itemIds,
            UserId: userId,
            MediaType: 'Video',
            IsPublic: isPublic
        }
    });

    return response.data;
};

/**
 * Mutation hook to create a new playlist.
 * Invalidates playlist queries on success.
 */
export const useCreatePlaylistMutation = () => {
    const { api, user } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreatePlaylistParams) =>
            createPlaylist(api, user?.Id, params),
        onSuccess: () => {
            // Invalidate playlists to show new list
            queryClient.invalidateQueries({ queryKey: ['UserPlaylists'] });
        }
    });
};
