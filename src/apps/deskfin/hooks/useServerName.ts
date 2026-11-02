import { useQuery } from '@tanstack/react-query';
import type { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models/public-system-info';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

import { useApi } from 'hooks/useApi';
import { ServerConnections } from 'lib/jellyfin-apiclient';

/** The name saved with this server's connection details on the last visit, available before any request. */
const getSavedServerInfo = (): PublicSystemInfo | undefined => {
    const serverId = ServerConnections.currentApiClient()?.serverId();
    const servers = ServerConnections.getSavedServers() as { Id?: string; Name?: string }[];
    const name = (servers.find(server => server.Id === serverId) ?? servers[0])?.Name;
    return name ? { ServerName: name } : undefined;
};

/**
 * The server name set in the Jellyfin dashboard (General › Server name), shown as the site title. Read from the
 * public system info, so it works before signing in and for every user. Until that loads it's the name saved from
 * the last visit, so titles are right on first render; empty on a first visit, and "Jellyfin" if the server has none.
 */
export const useServerName = () => {
    const { api } = useApi();
    const { data, isPending } = useQuery<PublicSystemInfo>({
        queryKey: [ 'PublicSystemInfo' ],
        queryFn: async ({ signal }) => (await getSystemApi(api!).getPublicSystemInfo({ signal })).data,
        enabled: !!api,
        staleTime: Infinity,
        placeholderData: getSavedServerInfo
    });

    return data?.ServerName || (isPending ? '' : 'Jellyfin');
};
