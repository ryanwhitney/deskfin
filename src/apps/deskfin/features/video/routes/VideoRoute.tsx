import React, { type FC } from 'react';

import ViewManagerPage from 'components/viewManager/ViewManagerPage';
import VideoOverlay from '../components/VideoOverlay';
import PlaybackControls from '../components/PlaybackControls';

/**
 * Video player page component that renders the legacy video OSD view.
 * Uses the same approach as the stable app for maximum compatibility.
 */
const VideoPage: FC = () => {
    return (
        <>
            <VideoOverlay />
            <PlaybackControls />
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
