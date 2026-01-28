import React, { type FC } from "react";
import SuggestionsSectionView from "./SuggestionsSectionView";
import UpcomingView from "./UpcomingView";
import GenresView from "./GenresView";
import YearsView from "./YearsView";
import NetworksView from "./NetworksView";
import ItemsView from "./ItemsView";
import GuideView from "./GuideView";
import ProgramsSectionView from "./ProgramsSectionView";
import { LibraryTab } from "types/libraryTab";
import type { ParentId } from "types/library";
import type { LibraryTabContent } from "types/libraryTabContent";

import styles from "./PageLayout.module.scss";

interface PageTabContentProps {
    parentId: ParentId;
    currentTab: LibraryTabContent;
}

const PageTabContent: FC<PageTabContentProps> = ({ parentId, currentTab }) => {
    if (currentTab.viewType === LibraryTab.Suggestions) {
        return (
            <div className={styles.content}>
                <SuggestionsSectionView
                    parentId={parentId}
                    sectionType={
                        currentTab.sectionsView?.suggestionSections ?? []
                    }
                    isMovieRecommendationEnabled={
                        currentTab.sectionsView?.isMovieRecommendations
                    }
                />
            </div>
        );
    }

    if (
        currentTab.viewType === LibraryTab.Programs ||
        currentTab.viewType === LibraryTab.Recordings ||
        currentTab.viewType === LibraryTab.Schedule
    ) {
        return (
            <div className={styles.content}>
                <ProgramsSectionView
                    parentId={parentId}
                    sectionType={currentTab.sectionsView?.programSections ?? []}
                    isUpcomingRecordingsEnabled={
                        currentTab.sectionsView?.isLiveTvUpcomingRecordings
                    }
                />
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Upcoming) {
        return (
            <div className={styles.content}>
                <UpcomingView parentId={parentId} />
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Genres) {
        return (
            <div className={styles.content}>
                <GenresView
                    parentId={parentId}
                    collectionType={currentTab.collectionType}
                    itemType={currentTab.itemType || []}
                />
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Years) {
        return (
            <div className={styles.content}>
                <YearsView
                    parentId={parentId}
                    collectionType={currentTab.collectionType}
                    itemType={currentTab.itemType || []}
                />
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Guide) {
        return (
            <div className={styles.content}>
                <GuideView />
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Networks) {
        return (
            <div className={styles.content}>
                <NetworksView
                    parentId={parentId}
                    itemType={currentTab.itemType || []}
                />
            </div>
        );
    }

    return (
        <ItemsView
            viewType={currentTab.viewType}
            parentId={parentId}
            collectionType={currentTab.collectionType}
            isBtnPlayAllEnabled={false} // currentTab.isBtnPlayAllEnabled
            isBtnQueueEnabled={currentTab.isBtnQueueEnabled}
            isBtnShuffleEnabled={false} // currentTab.isBtnShuffleEnabled
            isBtnNewCollectionEnabled={currentTab.isBtnNewCollectionEnabled}
            isBtnFilterEnabled={currentTab.isBtnFilterEnabled}
            isBtnSortEnabled={currentTab.isBtnSortEnabled}
            itemType={currentTab.itemType || []}
            noItemsMessage={
                currentTab.noItemsMessage || "MessageNoItemsAvailable"
            }
        />
    );
};

export default PageTabContent;
