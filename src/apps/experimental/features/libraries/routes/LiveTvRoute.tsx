import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import { useTitle } from 'apps/experimental/utils/useTitle';
import { formatLibraryTitle } from 'apps/experimental/utils/titleUtils';
import Page from 'components/Page';
import PageTabContent from '../components/ui/PageTabContent';
import { LibraryViewMenu } from 'apps/experimental/components/library';
import { LibraryTab } from 'types/libraryTab';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { ProgramSectionsView, RecordingsSectionsView, ScheduleSectionsView } from 'types/sections';

import layoutStyles from '../components/ui/PageLayout.module.scss';

const seriestimersTabContent: LibraryTabContent = {
    viewType: LibraryTab.SeriesTimers,
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false
};

const scheduleTabContent: LibraryTabContent = {
    viewType: LibraryTab.Schedule,
    sectionsView: ScheduleSectionsView
};

const recordingsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Recordings,
    sectionsView: RecordingsSectionsView
};

const channelsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Channels,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false
};

const programsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Programs,
    sectionsView: ProgramSectionsView
};

const guideTabContent: LibraryTabContent = {
    viewType: LibraryTab.Guide
};

const liveTvTabMapping: LibraryTabMapping = {
    0: programsTabContent,
    1: guideTabContent,
    2: channelsTabContent,
    3: recordingsTabContent,
    4: scheduleTabContent,
    5: seriestimersTabContent
};

const LiveTv: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = liveTvTabMapping[activeTab];

    // Set title based on current tab
    const getTitleForTab = () => {
        switch (activeTab) {
            case 0: return undefined; // Default "Live TV" tab (Programs)
            case 1: return 'Guide';
            case 2: return 'Channels';
            case 3: return 'Recordings';
            case 4: return 'Schedule';
            case 5: return 'Series Timers';
            default: return undefined;
        }
    };

    useTitle(formatLibraryTitle('Live TV', getTitleForTab()));

    return (
        <Page
            id='liveTvPage'
            className='mainAnimatedPage libraryPage collectionEditorPage pageWithAbsoluteTabs withTabs'
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

export default LiveTv;
