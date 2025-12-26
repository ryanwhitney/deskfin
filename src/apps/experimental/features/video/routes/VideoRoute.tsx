import React, { type FC } from 'react';

import ViewManagerPage from 'components/viewManager/ViewManagerPage';

/**
 * Video player page component that renders the legacy video OSD view.
 * Uses the same approach as the stable app for maximum compatibility.
 */
const VideoPage: FC = () => {
    return (
        <ViewManagerPage
            controller='playback/video/index'
            view='playback/video/index.html'
            type='video-osd'
            isFullscreen
            isNowPlayingBarEnabled={false}
            isThemeMediaSupported
        />
    );
};

export default VideoPage;
