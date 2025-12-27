import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';

import useCurrentTab from 'hooks/useCurrentTab';
import { useTitle } from 'apps/experimental/utils/useTitle';
import { formatLibraryTitle } from 'apps/experimental/utils/titleUtils';
import Page from 'components/Page';
import PageTabContent from '../components/ui/PageTabContent';
import { LibraryViewMenu } from 'apps/experimental/components/library';
import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';

import layoutStyles from '../components/ui/PageLayout.module.scss';

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

    useTitle(formatLibraryTitle('Books'));

    return (
        <Page
            id='booksPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='book'
        >
            <div className={layoutStyles.toolbar}>
                <LibraryViewMenu />
            </div>
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Books;


