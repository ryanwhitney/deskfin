import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useApi } from 'hooks/useApi';

interface DeletePlaylistParams {
    playlistId: string;
}

export const useDeletePlaylistMutation = () => {
    const { api, user } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId }: DeletePlaylistParams) => {
            if (!api || !user?.Id) {
                throw new Error('API or user not available');
            }

            const libraryApi = getLibraryApi(api);

            await libraryApi.deleteItem({
                itemId: playlistId
            });

            return { playlistId };
        },
        onSuccess: () => {
            // Invalidate playlists queries to refresh data
            void queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
        }
    });
};
