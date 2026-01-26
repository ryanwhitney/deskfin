import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import { useTitle } from 'apps/deskfin/utils/useTitle';
import { formatLibraryTitle } from 'apps/deskfin/utils/titleUtils';
import Page from 'components/Page';
import PageTabContent from '../components/ui/PageTabContent';
import { LibraryViewMenu } from 'apps/deskfin/components/library';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { MusicSuggestionsSectionsView } from 'types/sections';

import layoutStyles from '../components/ui/PageLayout.module.scss';

const albumArtistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.AlbumArtists,
    collectionType: CollectionType.Music,
    isBtnSortEnabled: false
};

const albumsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Albums,
    collectionType: CollectionType.Music,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.MusicAlbum]
};

const artistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Artists,
    collectionType: CollectionType.Music,
    isBtnSortEnabled: false
};

const playlistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Playlists,
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false,
    itemType: [BaseItemKind.Playlist]
};

const songsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Songs,
    isBtnShuffleEnabled: true,
    isBtnGridListEnabled: false,
    itemType: [BaseItemKind.Audio]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Music,
    sectionsView: MusicSuggestionsSectionsView
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Music,
    itemType: [BaseItemKind.MusicAlbum]
};

const musicTabMapping: LibraryTabMapping = {
    0: albumsTabContent,
    1: suggestionsTabContent,
    2: albumArtistsTabContent,
    3: artistsTabContent,
    4: playlistsTabContent,
    5: songsTabContent,
    6: genresTabContent
};

const Music: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = musicTabMapping[activeTab];

    // Set title based on current tab
    const getTitleForTab = () => {
        switch (activeTab) {
            case 0: return undefined; // Default "Music" tab (Albums)
            case 1: return 'Suggestions';
            case 2: return 'Album Artists';
            case 3: return 'Artists';
            case 4: return 'Playlists';
            case 5: return 'Songs';
            case 6: return 'Genres';
            default: return undefined;
        }
    };

    useTitle(formatLibraryTitle('Music', getTitleForTab()));

    return (
        <Page
            id='musicPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='musicartist'
        >
            <div className={layoutStyles.toolbar}>
                <LibraryViewMenu />
            </div>
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={
                    // Playlists exist outside of the scope of the library
                    currentTab.viewType === LibraryTab.Playlists ? undefined : libraryId
                }
            />
        </Page>
    );
};

export default Music;
