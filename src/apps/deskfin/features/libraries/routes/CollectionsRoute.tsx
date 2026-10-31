import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import { LibraryTab } from 'apps/deskfin/types/libraryTab';
import { useTitle } from 'apps/deskfin/hooks/useTitle';
import { formatLibraryTitle } from 'apps/deskfin/utils/titleUtils';
import ItemsView from '../components/ui/ItemsView';
import { translateOr } from 'apps/deskfin/utils/translate';

export default function CollectionsRoute() {
    const [params] = useSearchParams();
    const parentId = params.get('topParentId') || params.get('parentId') || '';

    useTitle(formatLibraryTitle('Collections'));

    if (!parentId) {
        return (
            <Page id='collectionsPage' className='libraryPage'>
                {translateOr('MessageNoCollectionsAvailable', 'No collections available')}
            </Page>
        );
    }

    return (
        <Page
            id='collectionsPage'
            className='libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType={[BaseItemKind.Movie]}
        >
            <h1>{globalize.translate('Collections')}</h1>
            <ItemsView
                viewType={LibraryTab.Collections}
                parentId={parentId}
                collectionType={CollectionType.Boxsets}
                isBtnFilterEnabled={false}
                isBtnNewCollectionEnabled={true}
                itemType={[BaseItemKind.BoxSet]}
                noItemsMessage='MessageNoCollectionsAvailable'
            />
        </Page>
    );
}
