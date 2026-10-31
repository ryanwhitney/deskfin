import type { UserViewApiGetUserViewsRequest } from '@jellyfin/sdk/lib/generated-client/api/user-view-api';
import { useQuery } from '@tanstack/react-query';

import { getUserViewsQuery } from 'hooks/api/useUserViews';
import { useApi } from 'hooks/useApi';

/** User views rarely change, so deskfin caches them for 5 minutes to avoid refetching on navigation. */
const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export const useUserViews = (params?: UserViewApiGetUserViewsRequest) => {
    const { api, user } = useApi();
    return useQuery({
        ...getUserViewsQuery(api, {
            ...params,
            userId: params?.userId || user?.Id
        }),
        staleTime: STALE_TIME,
        gcTime: GC_TIME
    });
};
