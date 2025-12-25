import React, { type FC } from 'react';
import SuggestionsSectionView from './SuggestionsSectionView';
import UpcomingView from './UpcomingView';
import GenresView from './GenresView';
import NetworksView from './NetworksView';
import ItemsView from './ItemsView';
import GuideView from './GuideView';
import ProgramsSectionView from './ProgramsSectionView';
import { LibraryTab } from 'types/libraryTab';
import type { ParentId } from 'types/library';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { LibraryViewMenu } from 'apps/experimental/components/library';

import styles from './PageLayout.module.scss';

interface PageTabContentProps {
    parentId: ParentId;
    currentTab: LibraryTabContent;
}

const PageTabContent: FC<PageTabContentProps> = ({ parentId, currentTab }) => {
    if (currentTab.viewType === LibraryTab.Suggestions) {
        return (
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <LibraryViewMenu />
                </div>
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
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Programs || currentTab.viewType === LibraryTab.Recordings || currentTab.viewType === LibraryTab.Schedule) {
        return (
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <LibraryViewMenu />
                </div>
                <div className={styles.content}>
                    <ProgramsSectionView
                        parentId={parentId}
                        sectionType={
                            currentTab.sectionsView?.programSections ?? []
                        }
                        isUpcomingRecordingsEnabled={currentTab.sectionsView?.isLiveTvUpcomingRecordings}
                    />
                </div>
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Upcoming) {
        return (
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <LibraryViewMenu />
                </div>
                <div className={styles.content}>
                    <UpcomingView parentId={parentId} />
                </div>
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Genres) {
        return (
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <LibraryViewMenu />
                </div>
                <div className={styles.content}>
                    <GenresView
                        parentId={parentId}
                        collectionType={currentTab.collectionType}
                        itemType={currentTab.itemType || []}
                    />
                </div>
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Guide) {
        return (
            <div className={styles.page}>
                <div className={styles.toolbar} style={{ position: 'relative', zIndex: 2 }}>
                    <LibraryViewMenu />
                </div>
                <div className={styles.content}>
                    <GuideView />
                </div>
            </div>
        );
    }

    if (currentTab.viewType === LibraryTab.Networks) {
        return (
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <LibraryViewMenu />
                </div>
                <div className={styles.content}>
                    <NetworksView
                        parentId={parentId}
                        itemType={currentTab.itemType || []}
                    />
                </div>
            </div>
        );
    }

    return (
        <ItemsView
            viewType={currentTab.viewType}
            parentId={parentId}
            collectionType={currentTab.collectionType}
            isPaginationEnabled={currentTab.isPaginationEnabled}
            isBtnPlayAllEnabled={currentTab.isBtnPlayAllEnabled}
            isBtnQueueEnabled={currentTab.isBtnQueueEnabled}
            isBtnShuffleEnabled={currentTab.isBtnShuffleEnabled}
            isBtnNewCollectionEnabled={currentTab.isBtnNewCollectionEnabled}
            isBtnFilterEnabled={currentTab.isBtnFilterEnabled}
            isBtnSortEnabled={currentTab.isBtnSortEnabled}
            isAlphabetPickerEnabled={currentTab.isAlphabetPickerEnabled}
            itemType={currentTab.itemType || []}
            noItemsMessage={
                currentTab.noItemsMessage || 'MessageNoItemsAvailable'
            }
        />
    );
};

export default PageTabContent;
