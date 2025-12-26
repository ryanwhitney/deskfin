import classNames from 'classnames';
import React, { useRef, type FC, useEffect, useState } from 'react';

import AppToolbar from 'components/toolbar/AppToolbar';
import ViewManagerPage from 'components/viewManager/ViewManagerPage';
import { EventType } from 'constants/eventType';
import Events, { type Event } from 'utils/events';

import styles from './VideoRoute.module.scss';

/**
 * Video player page component that renders mui controls for the top controls and the legacy view for everything else.
 */
const VideoPage: FC = () => {
    const documentRef = useRef<Document>(document);
    const [ isVisible, setIsVisible ] = useState(true);

    const onShowVideoOsd = (_e: Event, isShowing: boolean) => {
        setIsVisible(isShowing);
    };

    useEffect(() => {
        const doc = documentRef.current;

        if (doc) Events.on(doc, EventType.SHOW_VIDEO_OSD, onShowVideoOsd);

        return () => {
            if (doc) Events.off(doc, EventType.SHOW_VIDEO_OSD, onShowVideoOsd);
        };
    }, []);

    return (
        <>
            <div className={classNames(styles.toolbar, { [styles.toolbarHidden]: !isVisible })}>
                <AppToolbar
                    isDrawerAvailable={false}
                    isDrawerOpen={false}
                    isBackButtonAvailable
                    isUserMenuAvailable={false}
                />
            </div>

            <ViewManagerPage
                controller='playback/video/index'
                view='playback/video/index.html'
                type='video-osd'
                isFullscreen
                isNowPlayingBarEnabled={false}
                isThemeMediaSupported
            />
        </>
    );
};

export default VideoPage;
