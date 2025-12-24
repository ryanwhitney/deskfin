import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../components/ui/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';

const booksTabContent: LibraryTabContent = {
    viewType: LibraryTab.Books,
    collectionType: CollectionType.Books,
    isBtnPlayAllEnabled: false,
    isBtnQueueEnabled: false,
    isBtnShuffleEnabled: false,
    itemType: [ BaseItemKind.Book ]
};

const booksTabMapping: LibraryTabMapping = {
    0: booksTabContent
};

const Books: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = booksTabMapping[activeTab] ?? booksTabMapping[0];

    return (
        <Page
            id='booksPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='book'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Books;


