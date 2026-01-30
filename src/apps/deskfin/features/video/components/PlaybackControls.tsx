import React, { type FC, useState, useEffect, useCallback } from 'react';
import { Button as RacButton } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import { playbackManager } from 'components/playback/playbackmanager';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import { IconSvgs } from 'assets/icons';
import SvgIcon from 'components/SvgIcon';

import { SubtitlesMenu } from './playback/SubtitlesMenu';
import { AudioTrackMenu } from './playback/AudioTrackMenu';
import { VolumeControl } from './playback/VolumeControl';
import { SettingsMenu } from './playback/SettingsMenu';
import { EpisodeMenu } from './playback/EpisodeMenu';
import { TrackPreview } from './playback/TrackPreview';
import { useBlurOnMousePress } from './playback/useBlurOnMousePress';
import styles from './PlaybackControls.module.scss';

export const PlaybackControls: FC = () => {
    const [player, setPlayer] = useState(playbackManager.getCurrentPlayer());
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Conditional button visibility states
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [hasSubtitles, setHasSubtitles] = useState(false);
    const [hasMultipleAudio, setHasMultipleAudio] = useState(false);
    const [supportsPiP, setSupportsPiP] = useState(false);

    // Track preview states
    const [showPreviousPreview, setShowPreviousPreview] = useState(false);
    const [showNextPreview, setShowNextPreview] = useState(false);

    // Ref to track visibility for event handlers (avoids stale closure)
    const isVisibleRef = React.useRef(isVisible);
    React.useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    // Ref to the controls container for focusing
    const controlsRef = React.useRef<HTMLDivElement>(null);

    // Blur on mouse press for all transport buttons
    const previousBlur = useBlurOnMousePress();
    const rewindBlur = useBlurOnMousePress();
    const playPauseBlur = useBlurOnMousePress();
    const fastForwardBlur = useBlurOnMousePress();
    const nextBlur = useBlurOnMousePress();
    const pipBlur = useBlurOnMousePress();
    const fullscreenBlur = useBlurOnMousePress();

    // Update player state
    const updatePlayerState = useCallback(() => {
        const currentPlayer = playbackManager.getCurrentPlayer();
        setPlayer(currentPlayer);

        if (!currentPlayer) return;

        // Update pause state
        setIsPaused(playbackManager.paused(currentPlayer));

        // Update fullscreen state
        setIsFullscreen(playbackManager.isFullscreen(currentPlayer));

        // Check for previous item
        const currentIndex = playbackManager.getCurrentPlaylistIndex(currentPlayer);
        setHasPrevious(currentIndex > 0);

        // Check for next item
        const nextItem = playbackManager.getNextItem();
        setHasNext(!!nextItem);

        // Check for subtitle tracks
        const subtitleTracks = playbackManager.subtitleTracks(currentPlayer);
        setHasSubtitles(subtitleTracks && subtitleTracks.length > 0);

        // Check for multiple audio tracks
        const audioTracks = playbackManager.audioTracks(currentPlayer);
        setHasMultipleAudio(audioTracks && audioTracks.length > 1);

        // Check PiP support (most modern browsers support this)
        setSupportsPiP(true); // Will be handled by playbackManager
    }, []);

    useEffect(() => {
        // Initial state
        updatePlayerState();

        // Handle focus on any control button to show OSD
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            // If a button in our controls gets focus and OSD is hidden, show it
            if (controlsRef.current?.contains(target) && !isVisibleRef.current) {
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

        // Handle Escape key to blur focused controls
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const activeElement = document.activeElement as HTMLElement;
                // Blur any focused button or menu trigger
                if (activeElement && (
                    activeElement.tagName === 'BUTTON' ||
                    activeElement.getAttribute('role') === 'button'
                )) {
                    activeElement.blur();
                }
            }
        };

        // Subscribe to OSD visibility
        const onOsdVisibilityChange = (_e: any, visible: boolean) => {
            setIsVisible(visible);

            // When hiding controls, blur any focused button to prevent
            // spacebar from triggering it when controls are hidden
            if (!visible) {
                const activeElement = document.activeElement as HTMLElement;
                // Blur any focused button or menu trigger
                if (activeElement && (
                    activeElement.tagName === 'BUTTON' ||
                    activeElement.getAttribute('role') === 'button'
                )) {
                    activeElement.blur();
                }
            }
        };

        // Subscribe to playback events
        const onPlaybackStart = () => updatePlayerState();
        const onStateChange = () => updatePlayerState();
        const onPause = () => setIsPaused(true);
        const onUnpause = () => setIsPaused(false);
        const onFullscreenChange = () => {
            const currentPlayer = playbackManager.getCurrentPlayer();
            if (currentPlayer) {
                setIsFullscreen(playbackManager.isFullscreen(currentPlayer));
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('keydown', handleEscape);
        Events.on(document, EventType.SHOW_VIDEO_OSD, onOsdVisibilityChange);
        Events.on(playbackManager, 'playbackstart', onPlaybackStart);
        Events.on(playbackManager, 'statechange', onStateChange);

        const currentPlayer = playbackManager.getCurrentPlayer();
        if (currentPlayer) {
            Events.on(currentPlayer, 'pause', onPause);
            Events.on(currentPlayer, 'unpause', onUnpause);
            Events.on(currentPlayer, 'fullscreenchange', onFullscreenChange);
        }

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('keydown', handleEscape);
            Events.off(document, EventType.SHOW_VIDEO_OSD, onOsdVisibilityChange);
            Events.off(playbackManager, 'playbackstart', onPlaybackStart);
            Events.off(playbackManager, 'statechange', onStateChange);

            if (currentPlayer) {
                Events.off(currentPlayer, 'pause', onPause);
                Events.off(currentPlayer, 'unpause', onUnpause);
                Events.off(currentPlayer, 'fullscreenchange', onFullscreenChange);
            }
        };
    }, [updatePlayerState]);

    // Transport controls
    const handlePrevious = useCallback((e: any) => {
        if (player) {
            playbackManager.previousTrack(player);
        }
        previousBlur.handlePress(e);
    }, [player, previousBlur]);

    const handleRewind = useCallback((e: any) => {
        if (player) {
            playbackManager.rewind(player);
        }
        rewindBlur.handlePress(e);
    }, [player, rewindBlur]);

    const handlePlayPause = useCallback((e: any) => {
        if (player) {
            playbackManager.playPause(player);
        }
        playPauseBlur.handlePress(e);
    }, [player, playPauseBlur]);

    const handleFastForward = useCallback((e: any) => {
        if (player) {
            playbackManager.fastForward(player);
        }
        fastForwardBlur.handlePress(e);
    }, [player, fastForwardBlur]);

    const handleNext = useCallback((e: any) => {
        if (player) {
            playbackManager.nextTrack(player);
        }
        nextBlur.handlePress(e);
    }, [player, nextBlur]);

    const handleToggleFullscreen = useCallback((e: any) => {
        if (player) {
            playbackManager.toggleFullscreen(player);
        }
        fullscreenBlur.handlePress(e);
    }, [player, fullscreenBlur]);

    const handleTogglePiP = useCallback((e: any) => {
        if (player) {
            playbackManager.togglePictureInPicture(player);
        }
        pipBlur.handlePress(e);
    }, [player, pipBlur]);

    // Track preview handlers
    const showPrevPreview = useCallback(() => setShowPreviousPreview(true), []);
    const hidePrevPreview = useCallback(() => setShowPreviousPreview(false), []);
    const showNextPrev = useCallback(() => setShowNextPreview(true), []);
    const hideNextPrev = useCallback(() => setShowNextPreview(false), []);

    if (!player) {
        return null;
    }

    return (
        <div ref={controlsRef} className={`${styles.controls} ${isVisible ? styles.visible : styles.hidden}`}>
            {/* Previous Track */}
            {hasPrevious && (
                <div
                    className={styles.trackButtonWrapper}
                    onMouseEnter={showPrevPreview}
                    onMouseLeave={hidePrevPreview}
                >
                    <FocusRing focusRingClass='focus-ring'>
                        <RacButton
                            ref={previousBlur.ref}
                            className={styles.iconButton}
                            onPress={handlePrevious}
                            onFocus={showPrevPreview}
                            onBlur={hidePrevPreview}
                            aria-label='Previous track'
                        >
                            <SvgIcon svg={IconSvgs.backwardEnd} size={16} />
                        </RacButton>
                    </FocusRing>
                    <TrackPreview direction='previous' isVisible={showPreviousPreview} />
                </div>
            )}

            {/* Rewind 10s */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={rewindBlur.ref}
                    className={styles.iconButton}
                    onPress={handleRewind}
                    aria-label="Rewind"
                >
                    <SvgIcon svg={IconSvgs.backward} size={20} />
                </RacButton>
            </FocusRing>

            {/* Play/Pause */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={playPauseBlur.ref}
                    className={styles.iconButton}
                    onPress={handlePlayPause}
                    aria-label={isPaused ? 'Play' : 'Pause'}
                >
                    {isPaused ? <SvgIcon svg={IconSvgs.play} size={20} /> : <SvgIcon svg={IconSvgs.pause} size={15} />}
                </RacButton>
            </FocusRing>

            {/* Fast Forward 10s */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={fastForwardBlur.ref}
                    className={styles.iconButton}
                    onPress={handleFastForward}
                    aria-label="Fast forward"
                >
                    <SvgIcon svg={IconSvgs.forward} size={20} />
                </RacButton>
            </FocusRing>

            {/* Next Track */}
            {hasNext && (
                <div
                    className={styles.trackButtonWrapper}
                    onMouseEnter={showNextPrev}
                    onMouseLeave={hideNextPrev}
                >
                    <FocusRing focusRingClass='focus-ring'>
                        <RacButton
                            ref={nextBlur.ref}
                            className={styles.iconButton}
                            onPress={handleNext}
                            onFocus={showNextPrev}
                            onBlur={hideNextPrev}
                            aria-label='Next track'
                        >
                            <SvgIcon svg={IconSvgs.forwardEnd} size={16} />
                        </RacButton>
                    </FocusRing>
                    <TrackPreview direction='next' isVisible={showNextPreview} />
                </div>
            )}

            {/* Episode Menu - only for TV episodes */}
            <EpisodeMenu player={player} />

            {/* Spacer */}
            <div className={styles.spacer} />

            {/* Subtitles Menu */}
            {hasSubtitles && (
                <SubtitlesMenu player={player} onUpdate={updatePlayerState} />
            )}

            {/* Audio Track Menu */}
            {hasMultipleAudio && (
                <AudioTrackMenu player={player} onUpdate={updatePlayerState} />
            )}

            {/* Volume Control */}
            <VolumeControl player={player} />

            {/* Settings Menu */}
            <SettingsMenu player={player} onUpdate={updatePlayerState} />

            {/* Picture-in-Picture */}
            {supportsPiP && (
                <FocusRing focusRingClass="focus-ring">
                    <RacButton
                        ref={pipBlur.ref}
                        className={styles.iconButton}
                        onPress={handleTogglePiP}
                        aria-label="Picture in Picture"
                    >
                        <SvgIcon svg={IconSvgs.pip} size={20} />
                    </RacButton>
                </FocusRing>
            )}

            {/* Fullscreen */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={fullscreenBlur.ref}
                    className={styles.iconButton}
                    onPress={handleToggleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    <SvgIcon svg={IconSvgs.fullscreen} size={20} />
                </RacButton>
            </FocusRing>
        </div>
    );
};

export default PlaybackControls;
