import React, { type FC, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button as RacButton } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import { playbackManager } from 'components/playback/playbackmanager';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import { useBlurOnMousePress } from './playback/useBlurOnMousePress';
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

    // Ref to track visibility for event handlers (avoids stale closure)
    const isVisibleRef = useRef(isVisible);
    useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    // Ref to the overlay for focus detection
    const overlayRef = useRef<HTMLDivElement>(null);

    // Blur on mouse press for back button
    const backButtonBlur = useBlurOnMousePress();

    const updateNowPlaying = useCallback(() => {
        const player = playbackManager.getCurrentPlayer();
        if (player) {
            const state = playbackManager.getPlayerState(player);
            const item = state?.NowPlayingItem as NowPlayingItem | null;
            setTitle(getDisplayTitle(item));
        }
    }, []);

    const handleBack = useCallback((e: any) => {
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

        backButtonBlur.handlePress(e);
    }, [navigate, location.key, backButtonBlur]);

    const handleVideoClick = useCallback(() => {
        playbackManager.playPause();
    }, []);

    useEffect(() => {
        // Initial state
        updateNowPlaying();

        // Handle focus on back button to show OSD
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            // If focus came to our overlay and OSD is hidden, show it
            if (overlayRef.current?.contains(target) && !isVisibleRef.current) {
                // Dispatch synthetic pointer moves to trigger legacy OSD's showOsd()
                // The legacy handler requires: pointerType='mouse', and 10px movement
                // First event initializes tracking, second triggers showOsd()
                const baseX = window.innerWidth / 2;
                const baseY = window.innerHeight / 2;

                document.dispatchEvent(new PointerEvent('pointermove', {
                    bubbles: true,
                    pointerType: 'mouse',
                    clientX: baseX,
                    clientY: baseY,
                    screenX: baseX,
                    screenY: baseY
                }));

                document.dispatchEvent(new PointerEvent('pointermove', {
                    bubbles: true,
                    pointerType: 'mouse',
                    clientX: baseX + 20,
                    clientY: baseY + 20,
                    screenX: baseX + 20,
                    screenY: baseY + 20
                }));
            }
        };

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

        document.addEventListener('focusin', handleFocusIn);
        Events.on(playbackManager, 'playbackstart', onPlaybackStart);
        Events.on(playbackManager, 'statechange', onStateChange);
        Events.on(document, EventType.SHOW_VIDEO_OSD, onOsdVisibilityChange);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
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
            <div ref={overlayRef} className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}>
                <FocusRing focusRingClass="focus-ring">
                    <RacButton
                        ref={backButtonBlur.ref}
                        className={styles.backButton}
                        onPress={handleBack}
                        aria-label="Go back"
                    >
                        <span className={styles.backIcon}>
                            <SvgIcon svg={IconSvgs.chevronDown} size={20} />
                        </span>
                    </RacButton>
                </FocusRing>
                <div className={styles.title}>{title}</div>
            </div>
        </>
    );
};

export default VideoOverlay;
