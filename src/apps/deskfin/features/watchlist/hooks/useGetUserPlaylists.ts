import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { useApi } from 'hooks/useApi';

interface UseGetUserPlaylistsOptions {
    enabled?: boolean;
}

const fetchUserPlaylists = async (
    api: ReturnType<typeof useApi>['api'],
    userId: string | undefined
): Promise<BaseItemDto[]> => {
    if (!api || !userId) return [];

    const response = await getItemsApi(api).getItems({
        userId,
        includeItemTypes: [BaseItemKind.Playlist],
        recursive: true
    });

    return response.data.Items || [];
};

/**
 * Hook to fetch all playlists for the current user.
 * These can be filtered to show only "watchlists" by naming convention.
 */
export const useGetUserPlaylists = (options?: UseGetUserPlaylistsOptions) => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: ['UserPlaylists', user?.Id],
        queryFn: () => fetchUserPlaylists(api, user?.Id),
        enabled: options?.enabled !== false && !!api && !!user?.Id,
        staleTime: 30 * 1000 // 30 seconds
    });
};
