import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import React, { FC } from "react";
import useCurrentTab from "hooks/useCurrentTab";
import { useTitle } from "apps/deskfin/utils/useTitle";
import { formatLibraryTitle } from "apps/deskfin/utils/titleUtils";
import Page from "components/Page";
import PageTabContent from "../components/ui/PageTabContent";
import { LibraryViewMenu } from "apps/deskfin/components/library";
import { LibraryTab } from "types/libraryTab";
import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import { LibraryTabContent, LibraryTabMapping } from "types/libraryTabContent";
import { MovieSuggestionsSectionsView } from "types/sections";

import layoutStyles from "../components/ui/PageLayout.module.scss";
import globalize from "lib/globalize";

const moviesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Movies,
    collectionType: CollectionType.Movies,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Movie],
};

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Movies,
    isBtnFilterEnabled: false,
    isBtnNewCollectionEnabled: true,
    itemType: [BaseItemKind.BoxSet],
    noItemsMessage: "MessageNoCollectionsAvailable",
};

const favoritesTabContent: LibraryTabContent = {
    viewType: LibraryTab.Favorites,
    collectionType: CollectionType.Movies,
    itemType: [BaseItemKind.Movie],
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Movies,
    sectionsView: MovieSuggestionsSectionsView,
};

const genresTabContent: LibraryTabContent = {
    viewType: LibraryTab.Genres,
    collectionType: CollectionType.Movies,
    itemType: [BaseItemKind.Movie],
};

const moviesTabMapping: LibraryTabMapping = {
    0: moviesTabContent,
    1: suggestionsTabContent,
    2: favoritesTabContent,
    3: collectionsTabContent,
    4: genresTabContent,
};

const Movies: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = moviesTabMapping[activeTab];

    // Set title based on current tab
    const getTitleForTab = () => {
        switch (activeTab) {
            case 0:
                return undefined; // Default "Movies" tab
            case 1:
                return "Suggestions";
            case 2:
                return "Favorites";
            case 3:
                return "Collections";
            case 4:
                return "Genres";
            default:
                return undefined;
        }
    };

    useTitle(formatLibraryTitle("Movies", getTitleForTab()));

    return (
        <Page
            id="moviesPage"
            className="mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs"
            backDropType="movie"
        >
            <h1>{globalize.translate("Movies")}</h1>
            {/* Tab bar stays mounted - never re-renders on tab change */}
            <div className={layoutStyles.toolbar}>
                <LibraryViewMenu />
            </div>
            {/* Content remounts on tab change */}
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default Movies;
