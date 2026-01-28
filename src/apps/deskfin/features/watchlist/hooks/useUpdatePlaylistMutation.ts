import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { useApi } from 'hooks/useApi';

interface UpdatePlaylistParams {
    playlistId: string;
    name?: string;
    isPublic?: boolean;
}

export const useUpdatePlaylistMutation = () => {
    const { api, user } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, name, isPublic }: UpdatePlaylistParams) => {
            if (!api || !user?.Id) {
                throw new Error('API or user not available');
            }

            const playlistsApi = getPlaylistsApi(api);

            await playlistsApi.updatePlaylist({
                playlistId,
                updatePlaylistDto: {
                    Name: name,
                    IsPublic: isPublic
                }
            });

            return { playlistId, name, isPublic };
        },
        onSuccess: () => {
            // Invalidate playlists queries to refresh data
            void queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
        }
    });
};
