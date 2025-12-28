import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        mutations: {
            networkMode: 'always' // network connection is not required if running on localhost
        },
        queries: {
            networkMode: 'always', // network connection is not required if running on localhost
            retry: 1, // Reduce retries to fail faster (default is 3)
            staleTime: 30 * 1000, // Keep data fresh for 30s by default
            refetchOnWindowFocus: false // Don't refetch when window regains focus
        }
    }
});
