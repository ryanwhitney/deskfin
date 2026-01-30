import { useQuery } from '@tanstack/react-query';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
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

            const userLibraryApi = getUserLibraryApi(api);
            const response = await userLibraryApi.getSpecialFeatures({
                itemId,
                userId: user?.Id
            });

            return response.data || [];
        },
        enabled: !!api && !!itemId && enabled
    });
};
