import React, { type FC } from 'react';

import ViewManagerPage from 'components/viewManager/ViewManagerPage';
import VideoOverlay from '../components/VideoOverlay';

/**
 * Video player page component that renders the legacy video OSD view.
 * Uses the same approach as the stable app for maximum compatibility.
 */
const VideoPage: FC = () => {
    return (
        <>
            <VideoOverlay />
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
