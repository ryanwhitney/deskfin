import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import { LibraryTab } from 'types/libraryTab';
import ItemsView from 'apps/experimental/components/library/ItemsView';

export default function CollectionsRoute() {
    const [ params ] = useSearchParams();
    const parentId = params.get('topParentId') || params.get('parentId') || '';

    if (!parentId) {
        return (
            <Page id='collectionsPage' className='mainAnimatedPage libraryPage'>
                <div className='padded-left padded-right padded-top'>
                    {globalize.tryTranslate?.('MessageNoCollectionsAvailable') ?? 'No collections available'}
                </div>
            </Page>
        );
    }

    return (
        <Page
            id='collectionsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='movie'
        >
            <ItemsView
                viewType={LibraryTab.Collections}
                parentId={parentId}
                collectionType={CollectionType.Boxsets}
                isBtnFilterEnabled={false}
                isBtnNewCollectionEnabled={true}
                itemType={[ BaseItemKind.BoxSet ]}
                noItemsMessage='MessageNoCollectionsAvailable'
            />
        </Page>
    );
}


