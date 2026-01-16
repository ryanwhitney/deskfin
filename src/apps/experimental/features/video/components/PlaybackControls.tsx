import React, { type FC, useState, useEffect, useCallback } from 'react';
import { Button as RacButton } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';
import SkipPrevious from '@mui/icons-material/SkipPrevious';
import FastRewind from '@mui/icons-material/FastRewind';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import FastForward from '@mui/icons-material/FastForward';
import SkipNext from '@mui/icons-material/SkipNext';
import Audiotrack from '@mui/icons-material/Audiotrack';
import PictureInPictureAlt from '@mui/icons-material/PictureInPictureAlt';
import Fullscreen from '@mui/icons-material/Fullscreen';
import FullscreenExit from '@mui/icons-material/FullscreenExit';

import { playbackManager } from 'components/playback/playbackmanager';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import { IconSvgs } from 'assets/icons';
import SvgIcon from 'components/SvgIcon';

import { SubtitlesMenu } from './playback/SubtitlesMenu';
import { AudioTrackMenu } from './playback/AudioTrackMenu';
import { VolumeControl } from './playback/VolumeControl';
import { SettingsMenu } from './playback/SettingsMenu';
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

        // Subscribe to OSD visibility
        const onOsdVisibilityChange = (_e: any, visible: boolean) => {
            setIsVisible(visible);
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
    const handlePrevious = useCallback(() => {
        if (player) {
            playbackManager.previousTrack(player);
        }
    }, [player]);

    const handleRewind = useCallback(() => {
        if (player) {
            playbackManager.rewind(player);
        }
    }, [player]);

    const handlePlayPause = useCallback(() => {
        if (player) {
            playbackManager.playPause(player);
        }
    }, [player]);

    const handleFastForward = useCallback(() => {
        if (player) {
            playbackManager.fastForward(player);
        }
    }, [player]);

    const handleNext = useCallback(() => {
        if (player) {
            playbackManager.nextTrack(player);
        }
    }, [player]);

    const handleToggleFullscreen = useCallback(() => {
        if (player) {
            playbackManager.toggleFullscreen(player);
        }
    }, [player]);

    const handleTogglePiP = useCallback(() => {
        if (player) {
            playbackManager.togglePictureInPicture(player);
        }
    }, [player]);

    if (!player) {
        return null;
    }

    return (
        <div className={`${styles.controls} ${isVisible ? styles.visible : styles.hidden}`}>
            {/* Previous Track */}
            {hasPrevious && (
                <FocusRing focusRingClass="focus-ring">
                    <RacButton
                        className={styles.iconButton}
                        onPress={handlePrevious}
                        aria-label="Previous track"
                    >
                        <SkipPrevious />
                    </RacButton>
                </FocusRing>
            )}

            {/* Rewind 10s */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    className={styles.iconButton}
                    onPress={handleRewind}
                    aria-label="Rewind"
                >
                    <FastRewind />
                </RacButton>
            </FocusRing>

            {/* Play/Pause */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    className={styles.iconButton}
                    onPress={handlePlayPause}
                    aria-label={isPaused ? 'Play' : 'Pause'}
                >
                    {isPaused ? <PlayArrow /> : <Pause />}
                </RacButton>
            </FocusRing>

            {/* Fast Forward 10s */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    className={styles.iconButton}
                    onPress={handleFastForward}
                    aria-label="Fast forward"
                >
                    <FastForward />
                </RacButton>
            </FocusRing>

            {/* Next Track */}
            {hasNext && (
                <FocusRing focusRingClass="focus-ring">
                    <RacButton
                        className={styles.iconButton}
                        onPress={handleNext}
                        aria-label="Next track"
                    >
                        <SkipNext />
                    </RacButton>
                </FocusRing>
            )}

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
                        className={styles.iconButton}
                        onPress={handleTogglePiP}
                        aria-label="Picture in Picture"
                    >
                        <PictureInPictureAlt />
                    </RacButton>
                </FocusRing>
            )}

            {/* Fullscreen */}
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    className={styles.iconButton}
                    onPress={handleToggleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </RacButton>
            </FocusRing>
        </div>
    );
};

export default PlaybackControls;
