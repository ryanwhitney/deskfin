import React, { type FC } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useItem } from 'hooks/useItem';
import { PlaylistView } from 'apps/deskfin/features/watchlist/components/PlaylistView';
import { translateOr } from 'apps/deskfin/utils/translate';
import { getLibraryPath } from 'apps/deskfin/utils/libraryPaths';

const currentServerId = () => ServerConnections.currentApiClient()?.serverId() || '';

/** Builds a query string from the non-empty params, in order, with encoded values. */
const toQuery = (params: [string, string][]) => params
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

/** Redirects a library folder to its deskfin page, or to the legacy list for other library types. */
const LibraryRedirect: FC<{ parentId: string }> = ({ parentId }) => {
    // isPending (not isLoading): the query also counts as pending while it waits for the API client and user
    const { data: parent, isPending } = useItem(parentId);

    if (isPending) {
        return <Page id='listPage' className='mainAnimatedPage libraryPage'></Page>;
    }

    const libraryPath = getLibraryPath(parent?.CollectionType, parentId);
    if (libraryPath) {
        return <Navigate replace to={libraryPath} />;
    }

    // Unknown / legacy library type: fall back to the legacy list ViewManager route.
    // (We can add a generic React "folder browser" later once we inventory remaining collection types.)
    const query = toQuery([[ 'parentId', parentId ], [ 'serverId', currentServerId() ]]);
    return <Navigate replace to={`/legacylist?${query}`} />;
};

/**
 * Compatibility route for legacy `#/list?parentId=...`.
 * Also handles playlist viewing via `?id=...`.
 * Redirects into the correct modern library page whenever possible.
 */
export default function ListRoute() {
    const [params] = useSearchParams();
    const playlistId = params.get('id') || '';
    const parentId = params.get('topParentId') || params.get('parentId') || '';
    const genreId = params.get('genreId') || '';
    const musicGenreId = params.get('musicGenreId') || '';
    const studioId = params.get('studioId') || '';

    // If we have a playlist ID, show the playlist view
    if (playlistId) {
        return <PlaylistView playlistId={playlistId} />;
    }

    // Genre/studio links go to the legacy list controller, which handles these special item types properly
    if (genreId || musicGenreId || studioId) {
        const query = toQuery([
            [ 'parentId', parentId ],
            [ 'genreId', genreId ],
            [ 'musicGenreId', musicGenreId ],
            [ 'studioId', studioId ],
            [ 'serverId', params.get('serverId') || currentServerId() ]
        ]);
        return <Navigate replace to={`/legacylist?${query}`} />;
    }

    if (!parentId) {
        return (
            <Page id='listPage' className='mainAnimatedPage libraryPage'>
                {translateOr('MessageNoItemsAvailable', 'No items available')}
            </Page>
        );
    }

    return <LibraryRedirect parentId={parentId} />;
}
