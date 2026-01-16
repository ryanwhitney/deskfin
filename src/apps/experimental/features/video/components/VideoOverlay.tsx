import React, { type FC, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { playbackManager } from 'components/playback/playbackmanager';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import styles from './VideoOverlay.module.scss';

interface NowPlayingItem {
    Name?: string;
    SeriesName?: string;
    ParentIndexNumber?: number;
    IndexNumber?: number;
    Type?: string;
}

/**
 * Gets display title for the current playing item
 */
function getDisplayTitle(item: NowPlayingItem | null): string {
    if (!item) return '';

    // For episodes, show "Series Name - S1:E2 Episode Name"
    if (item.Type === 'Episode' && item.SeriesName) {
        let title = item.SeriesName;
        if (item.ParentIndexNumber !== undefined && item.IndexNumber !== undefined) {
            title += ` - S${item.ParentIndexNumber}:E${item.IndexNumber}`;
        }
        if (item.Name) {
            title += ` ${item.Name}`;
        }
        return title;
    }

    return item.Name || '';
}

export const VideoOverlay: FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [title, setTitle] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    const updateNowPlaying = useCallback(() => {
        const player = playbackManager.getCurrentPlayer();
        if (player) {
            const state = playbackManager.getPlayerState(player);
            const item = state?.NowPlayingItem as NowPlayingItem | null;
            setTitle(getDisplayTitle(item));
        }
    }, []);

    const handleBack = useCallback(() => {
        // Stop playback
        playbackManager.stop();

        // Check if there's history to go back to within the app
        // location.key is 'default' when there's no previous navigation (new tab, external link)
        const hasHistory = location.key !== 'default';

        if (hasHistory) {
            // Navigate back to the previous page in the app
            navigate(-1);
        } else {
            // No app history - navigate to home
            navigate('/home');
        }
    }, [navigate, location.key]);

    const handleVideoClick = useCallback(() => {
        playbackManager.playPause();
    }, []);

    useEffect(() => {
        // Initial state
        updateNowPlaying();

        // Subscribe to playback events
        const onPlaybackStart = () => {
            updateNowPlaying();
        };

        const onStateChange = () => {
            updateNowPlaying();
        };

        // Sync visibility with video OSD
        const onOsdVisibilityChange = (_e: any, visible: boolean) => {
            setIsVisible(visible);
        };

        Events.on(playbackManager, 'playbackstart', onPlaybackStart);
        Events.on(playbackManager, 'statechange', onStateChange);
        Events.on(document, EventType.SHOW_VIDEO_OSD, onOsdVisibilityChange);

        return () => {
            Events.off(playbackManager, 'playbackstart', onPlaybackStart);
            Events.off(playbackManager, 'statechange', onStateChange);
            Events.off(document, EventType.SHOW_VIDEO_OSD, onOsdVisibilityChange);
        };
    }, [updateNowPlaying]);

    return (
        <>
            <button
                type="button"
                className={styles.clickArea}
                onClick={handleVideoClick}
                aria-label="Toggle play/pause"
            />
            <div className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}>
                <button
                    type="button"
                    className={styles.backButton}
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <span className={styles.backIcon}>
                        <SvgIcon svg={IconSvgs.chevronDown} size={20} />
                    </span>
                </button>
                <div className={styles.title}>{title}</div>
            </div>
        </>
    );
};

export default VideoOverlay;
