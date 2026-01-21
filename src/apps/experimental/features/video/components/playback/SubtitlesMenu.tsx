import React, { type FC, useState, useEffect } from 'react';
import {
    Button as RacButton,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    Separator,
    SubmenuTrigger
} from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import { playbackManager } from 'components/playback/playbackmanager';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';

import { SubtitleOffsetControl } from './SubtitleOffsetControl';
import { useBlurOnMousePress } from './useBlurOnMousePress';
import styles from './TrackMenu.module.scss';

interface SubtitlesMenuProps {
    player: any;
    onUpdate: () => void;
}

export const SubtitlesMenu: FC<SubtitlesMenuProps> = ({ player, onUpdate }) => {
    const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [secondaryIndex, setSecondaryIndex] = useState<number>(-1);
    const [isOpen, setIsOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showSubtitleOffset, setShowSubtitleOffset] = useState(false);
    const { ref: buttonRef, handlePress, blurOnMenuClose } = useBlurOnMousePress();

    useEffect(() => {
        if (!player) return;

        const tracks = playbackManager.subtitleTracks(player) || [];
        setSubtitleTracks(tracks);

        const index = playbackManager.getSubtitleStreamIndex(player);
        setCurrentIndex(index ?? -1);

        const secIndex = playbackManager.getSecondarySubtitleStreamIndex?.(player);
        setSecondaryIndex(secIndex ?? -1);
    }, [player]);

    // Refresh when menu opens
    useEffect(() => {
        if (isOpen && player) {
            const tracks = playbackManager.subtitleTracks(player) || [];
            setSubtitleTracks(tracks);

            const index = playbackManager.getSubtitleStreamIndex(player);
            setCurrentIndex(index ?? -1);

            const secIndex = playbackManager.getSecondarySubtitleStreamIndex?.(player);
            setSecondaryIndex(secIndex ?? -1);

            setRefreshKey(prev => prev + 1);
        }
    }, [isOpen, player]);

    const handleSelectTrack = (index: number) => {
        if (!player) return;

        playbackManager.setSubtitleStreamIndex(index, player);
        setCurrentIndex(index);
        onUpdate();
    };

    const handleSelectSecondaryTrack = (index: number) => {
        if (!player) return;

        playbackManager.setSecondarySubtitleStreamIndex(index, player);
        setSecondaryIndex(index);
        onUpdate();
    };

    const renderSecondarySubtitlesMenu = () => {
        const secondaryTracks = playbackManager.secondarySubtitleTracks?.(player) || [];

        return (
            <Menu className={styles.menu}>
                {/* Off option */}
                <MenuItem
                    key={-1}
                    id="-1"
                    textValue={globalize.translate('Off')}
                    className={styles.menuItem}
                    onAction={() => handleSelectSecondaryTrack(-1)}
                >
                    <span className={styles.itemText}>
                        {globalize.translate('Off')}
                    </span>
                    {secondaryIndex === -1 && (
                        <SvgIcon
                            svg={IconSvgs.checkmark}
                            size={18}
                            className={styles.checkmark}
                        />
                    )}
                </MenuItem>

                {/* Secondary subtitle tracks */}
                {secondaryTracks.map((track: any) => (
                    <MenuItem
                        key={track.Index}
                        id={String(track.Index)}
                        textValue={track.DisplayTitle || `Track ${track.Index}`}
                        className={styles.menuItem}
                        onAction={() => handleSelectSecondaryTrack(track.Index)}
                    >
                        <span className={styles.itemText}>
                            {track.DisplayTitle || `Track ${track.Index}`}
                        </span>
                        {secondaryIndex === track.Index && (
                            <SvgIcon
                                svg={IconSvgs.checkmark}
                                size={18}
                                className={styles.checkmark}
                            />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        );
    };

    // Check if secondary subtitles are available
    const hasSecondarySubtitleSupport = () => {
        if (!player) return false;
        if (!playbackManager.playerHasSecondarySubtitleSupport?.(player)) return false;
        if (currentIndex === -1) return false;

        const currentTrack = subtitleTracks.find((t: any) => t.Index === currentIndex);
        if (!currentTrack) return false;

        return playbackManager.trackHasSecondarySubtitleSupport?.(currentTrack, player) || false;
    };

    const showSecondarySubtitles = hasSecondarySubtitleSupport();
    const secondaryTracks = showSecondarySubtitles
        ? (playbackManager.secondarySubtitleTracks?.(player) || [])
        : [];

    // Get current secondary subtitle display name
    const getSecondarySubtitleName = () => {
        if (secondaryIndex === -1) {
            return globalize.translate('Off');
        }
        const track = secondaryTracks.find((t: any) => t.Index === secondaryIndex);
        return track?.DisplayTitle || `Track ${secondaryIndex}`;
    };

    const handleSubtitleOffset = () => {
        setShowSubtitleOffset(true);
    };

    // Check if subtitle offset is supported
    const supportsSubtitleOffset = player &&
        playbackManager.supportSubtitleOffset?.(player) &&
        playbackManager.canHandleOffsetOnCurrentSubtitle?.(player);

    return (
        <>
        <MenuTrigger isOpen={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) blurOnMenuClose(); }}>
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={buttonRef}
                    className={styles.iconButton}
                    aria-label={globalize.translate('Subtitles')}
                    onPress={handlePress}
                >
                    <SvgIcon svg={IconSvgs.closedCaptioning} size={20} />
                </RacButton>
            </FocusRing>

            <Popover
                className={styles.popover}
                placement="top end"
                offset={8}
            >
                <Menu className={styles.menu} key={refreshKey}>
                    {/* Off option */}
                    <MenuItem
                        key={-1}
                        id="-1"
                        textValue={globalize.translate('Off')}
                        className={styles.menuItem}
                        onAction={() => handleSelectTrack(-1)}
                    >
                        <span className={styles.itemText}>
                            {globalize.translate('Off')}
                        </span>
                        {currentIndex === -1 && (
                            <SvgIcon
                                svg={IconSvgs.checkmark}
                                size={18}
                                className={styles.checkmark}
                            />
                        )}
                    </MenuItem>

                    {/* Subtitle tracks */}
                    {subtitleTracks.map((track) => (
                        <MenuItem
                            key={track.Index}
                            id={String(track.Index)}
                            textValue={track.DisplayTitle || `Track ${track.Index}`}
                            className={styles.menuItem}
                            onAction={() => handleSelectTrack(track.Index)}
                        >
                            <span className={styles.itemText}>
                                {track.DisplayTitle || `Track ${track.Index}`}
                            </span>
                            {currentIndex === track.Index && (
                                <SvgIcon
                                    svg={IconSvgs.checkmark}
                                    size={18}
                                    className={styles.checkmark}
                                />
                            )}
                        </MenuItem>
                    ))}

                    {/* Subtitle Offset */}
                    {supportsSubtitleOffset && (
                        <>
                            <Separator className={styles.separator} />
                            <MenuItem
                                textValue={globalize.translate('SubtitleOffset')}
                                className={styles.menuItem}
                                onAction={handleSubtitleOffset}
                            >
                                <span className={styles.itemText}>
                                    {globalize.translate('SubtitleOffset')}
                                </span>
                            </MenuItem>
                        </>
                    )}

                    {/* Secondary Subtitles submenu */}
                    {showSecondarySubtitles && secondaryTracks.length > 0 && (
                        <>
                            <Separator className={styles.separator} />
                            <SubmenuTrigger>
                                <MenuItem
                                    textValue={globalize.translate('SecondarySubtitles')}
                                    className={styles.menuItem}
                                >
                                    <span className={styles.itemText}>
                                        {globalize.translate('SecondarySubtitles')}
                                    </span>
                                    <span className={styles.itemSecondary}>
                                        {getSecondarySubtitleName()}
                                    </span>
                                </MenuItem>
                                <Popover className={styles.submenuPopover} offset={-2} crossOffset={-4}>
                                    {renderSecondarySubtitlesMenu()}
                                </Popover>
                            </SubmenuTrigger>
                        </>
                    )}
                </Menu>
            </Popover>
        </MenuTrigger>

        <SubtitleOffsetControl
            player={player}
            isOpen={showSubtitleOffset}
            onOpenChange={(open) => { setShowSubtitleOffset(open); if (!open) blurOnMenuClose(); }}
        />
        </>
    );
};
