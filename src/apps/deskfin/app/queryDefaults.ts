import { queryClient } from 'utils/query/queryClient';

/*
 * Deskfin's query tuning, layered over upstream's defaults at boot so upstream's queryClient stays untouched:
 * data is fresh for 30s, failures retry once (still never on 401, per upstream), and window focus doesn't refetch.
 */
const STALE_TIME = 30 * 1000;
const MAX_RETRIES = 1;

const defaults = queryClient.getDefaultOptions();
const upstreamRetry = defaults.queries?.retry;

queryClient.setDefaultOptions({
    ...defaults,
    queries: {
        ...defaults.queries,
        staleTime: STALE_TIME,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
            if (failureCount >= MAX_RETRIES) return false;
            if (typeof upstreamRetry === 'function') return upstreamRetry(failureCount, error);
            return upstreamRetry !== false;
        }
    }
});
