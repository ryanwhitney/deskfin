import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

/**
 * Upstream's `useGetItems` (hooks/useFetchItems) plus an `enabled` option for dependent queries.
 * Uses the same query key, so it shares the cache and invalidations with upstream's screens.
 */
export const useGetItems = (
    parametersOptions: LibraryApiGetItemsRequest,
    options?: { enabled?: boolean }
) => {
    const { api, user } = useApi();
    const isRandom = Boolean(parametersOptions.sortBy?.includes(ItemSortBy.Random));

    return useQuery({
        queryKey: [ 'Items', { ...parametersOptions } ],
        queryFn: async ({ signal }) => {
            const response = await getLibraryApi(api!).getItems(
                { userId: user!.Id, ...parametersOptions },
                { signal }
            );
            return response.data as ItemDtoQueryResult;
        },
        gcTime: isRandom ? Infinity : undefined,
        refetchOnMount: isRandom ? false : undefined,
        refetchOnWindowFocus: isRandom ? false : undefined,
        enabled: (options?.enabled ?? true) && !!api && !!user?.Id
    });
};
