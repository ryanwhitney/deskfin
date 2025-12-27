import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import { useTitle } from 'apps/experimental/utils/useTitle';
import { formatLibraryTitle } from 'apps/experimental/utils/titleUtils';
import Page from 'components/Page';
import PageTabContent from '../components/ui/PageTabContent';
import { LibraryViewMenu } from 'apps/experimental/components/library';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';

import layoutStyles from '../components/ui/PageLayout.module.scss';

const photosTabContent: LibraryTabContent = {
    viewType: LibraryTab.Photos,
    collectionType: CollectionType.Homevideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Photo]
};

const photoAlbumsTabContent: LibraryTabContent = {
    viewType: LibraryTab.PhotoAlbums,
    collectionType: CollectionType.Homevideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.PhotoAlbum]
};

const videosTabContent: LibraryTabContent = {
    viewType: LibraryTab.Videos,
    collectionType: CollectionType.Homevideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Video]
};

const homevideosTabMapping: LibraryTabMapping = {
    0: photosTabContent,
    1: photoAlbumsTabContent,
    2: videosTabContent
};

const HomeVideos: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = homevideosTabMapping[activeTab];

    // Set title based on current tab
    const getTitleForTab = () => {
        switch (activeTab) {
            case 0: return undefined; // Default "Home Videos" tab (Photos)
            case 1: return 'Photo Albums';
            case 2: return 'Videos';
            default: return undefined;
        }
    };

    useTitle(formatLibraryTitle('Home Videos', getTitleForTab()));

    return (
        <Page
            id='homevideos'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='video, photo'
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

export default HomeVideos;
