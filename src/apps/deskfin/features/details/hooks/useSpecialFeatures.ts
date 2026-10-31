import { useQuery } from '@tanstack/react-query';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useApi } from 'hooks/useApi';

/**
 * Hook to fetch special features/extras for an item.
 */
export const useSpecialFeatures = (itemId: string | null | undefined, enabled = true) => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: ['SpecialFeatures', itemId],
        queryFn: async () => {
            if (!api || !itemId) return [];

            const userLibraryApi = getLibraryApi(api);
            const response = await userLibraryApi.getSpecialFeatures({
                itemId,
                userId: user?.Id
            });

            return response.data || [];
        },
        enabled: !!api && !!itemId && enabled
    });
};
