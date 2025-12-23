import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import { useItem } from 'hooks/useItem';

/**
 * Compatibility route for legacy `#/list?parentId=...`.
 * Redirects into the correct modern library page whenever possible.
 */
export default function ListRoute() {
    const [ params ] = useSearchParams();
    const parentId = params.get('topParentId') || params.get('parentId') || '';

    const { data: parent, isLoading } = useItem(parentId || undefined);

    if (!parentId) {
        return (
            <Page id='listPage' className='mainAnimatedPage libraryPage'>
                <div className='padded-left padded-right padded-top'>
                    {globalize.tryTranslate?.('MessageNoItemsAvailable') ?? 'No items available'}
                </div>
            </Page>
        );
    }

    if (isLoading) {
        return (
            <Page id='listPage' className='mainAnimatedPage libraryPage'>
                <div className='padded-left padded-right padded-top'>Loading…</div>
            </Page>
        );
    }

    const collectionType = parent?.CollectionType;

    if (collectionType === CollectionType.Movies) {
        return <Navigate replace to={`/movies?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Tvshows) {
        return <Navigate replace to={`/tv?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Music) {
        return <Navigate replace to={`/music?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Homevideos) {
        return <Navigate replace to={`/homevideos?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Books) {
        return <Navigate replace to={`/books?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Livetv) {
        return <Navigate replace to={'/livetv'} />;
    }

    // Unknown / legacy library type: fall back to the legacy list ViewManager route.
    // (We can add a generic React "folder browser" later once we inventory remaining collection types.)
    return <Navigate replace to={`/legacylist?parentId=${parentId}`} />;
}


