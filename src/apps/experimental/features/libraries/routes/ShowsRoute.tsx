import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import { useTitle } from 'apps/experimental/utils/useTitle';
import { formatLibraryTitle } from 'apps/experimental/utils/titleUtils';
import Page from 'components/Page';
import PageTabContent from '../components/ui/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { TvShowSuggestionsSectionsView } from 'types/sections';

const episodesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Episodes,
    itemType: [BaseItemKind.Episode],
    collectionType: CollectionType.Tvshows,
    noItemsMessage: 'MessageNoEpisodesFound'
};

const seriesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Series,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.Tvshows,
    isBtnShuffleEnabled: true
};

const networksTabContent: LibraryTabContent = {
    viewType: LibraryTab.Networks,
    itemType: [BaseItemKind.Series],
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false
};

const upcomingTabContent: LibraryTabContent = {
    viewType: LibraryTab.Upcoming
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Tvshows,
    sectionsView: TvShowSuggestionsSectionsView
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    itemType: [BaseItemKind.Series],
    collectionType: CollectionType.Tvshows
};

const tvShowsTabMapping: LibraryTabMapping = {
    0: seriesTabContent,
    1: suggestionsTabContent,
    2: upcomingTabContent,
    3: genresTabContent,
    4: networksTabContent,
    5: episodesTabContent
};

const Shows: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = tvShowsTabMapping[activeTab];

    // Set title based on current tab
    const getTitleForTab = () => {
        switch (activeTab) {
            case 0: return undefined; // Default "TV Shows" tab
            case 1: return 'Suggestions';
            case 2: return 'Upcoming';
            case 3: return 'Genres';
            case 4: return 'Networks';
            case 5: return 'Episodes';
            default: return undefined;
        }
    };

    useTitle(formatLibraryTitle('TV Shows', getTitleForTab()));

    return (
        <Page
            id='tvshowsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='series'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Shows;
