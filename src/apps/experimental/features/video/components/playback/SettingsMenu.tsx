import React, { type FC, useState, useEffect } from 'react';
import {
    Button as RacButton,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    SubmenuTrigger
} from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import { playbackManager } from 'components/playback/playbackmanager';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';
import qualityoptions from 'components/qualityOptions';

import { SubtitleOffsetControl } from './SubtitleOffsetControl';
import { useBlurOnMousePress } from './useBlurOnMousePress';
import styles from './SettingsMenu.module.scss';

interface SettingsMenuProps {
    player: any;
    onUpdate: () => void;
}

let statsOverlay: any = null;

export const SettingsMenu: FC<SettingsMenuProps> = ({ player, onUpdate }) => {
    const [supportedCommands, setSupportedCommands] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showSubtitleOffset, setShowSubtitleOffset] = useState(false);
    const { ref: buttonRef, handlePress } = useBlurOnMousePress();

    useEffect(() => {
        if (!player) return;

        const commands = playbackManager.getSupportedCommands(player);
        setSupportedCommands(commands || []);
    }, [player]);

    // Force refresh menu content when it opens
    useEffect(() => {
        if (isOpen) {
            setRefreshKey(prev => prev + 1);
        }
    }, [isOpen]);

    const handleAspectRatioSelect = (id: string) => {
        if (!player) return;
        playbackManager.setAspectRatio(id, player);
        onUpdate();
    };

    const handlePlaybackRateSelect = (id: string) => {
        if (!player) return;
        playbackManager.setPlaybackRate(id, player);
        onUpdate();
    };

    const handleRepeatModeSelect = (mode: string) => {
        if (!player) return;
        playbackManager.setRepeatMode(mode, player);
        onUpdate();
    };

    const handleQualitySelect = (bitrate: number, isAuto: boolean) => {
        if (!player) return;
        playbackManager.setMaxStreamingBitrate({
            enableAutomaticBitrateDetection: isAuto,
            maxBitrate: bitrate
        }, player);
        onUpdate();
    };

    const toggleStats = async () => {
        const PlayerStats = (await import('components/playerstats/playerstats')).default;

        if (player) {
            if (statsOverlay) {
                statsOverlay.toggle();
            } else {
                statsOverlay = new PlayerStats({
                    player: player
                });
            }
        }
    };

    const handleSubtitleOffset = () => {
        setShowSubtitleOffset(true);
    };

    const renderAspectRatioSubmenu = () => {
        const currentId = playbackManager.getAspectRatio(player);
        const ratios = playbackManager.getSupportedAspectRatios(player);

        return (
            <Menu className={styles.menu}>
                {ratios.map((ratio: any) => (
                    <MenuItem
                        key={ratio.id}
                        id={ratio.id}
                        textValue={ratio.name}
                        className={styles.menuItem}
                        onAction={() => handleAspectRatioSelect(ratio.id)}
                    >
                        <span className={styles.itemText}>{ratio.name}</span>
                        {currentId === ratio.id && (
                            <SvgIcon svg={IconSvgs.checkmark} size={18} className={styles.checkmark} />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        );
    };

    const renderPlaybackRateSubmenu = () => {
        const currentId = playbackManager.getPlaybackRate(player);
        const rates = playbackManager.getSupportedPlaybackRates(player);

        return (
            <Menu className={styles.menu}>
                {rates.map((rate: any) => (
                    <MenuItem
                        key={rate.id}
                        id={rate.id}
                        textValue={rate.name}
                        className={styles.menuItem}
                        onAction={() => handlePlaybackRateSelect(rate.id)}
                    >
                        <span className={styles.itemText}>{rate.name}</span>
                        {currentId === rate.id && (
                            <SvgIcon svg={IconSvgs.checkmark} size={18} className={styles.checkmark} />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        );
    };

    const renderRepeatModeSubmenu = () => {
        const currentMode = playbackManager.getRepeatMode(player);
        const modes = [
            { id: 'RepeatAll', name: globalize.translate('RepeatAll') },
            { id: 'RepeatOne', name: globalize.translate('RepeatOne') },
            { id: 'RepeatNone', name: globalize.translate('None') }
        ];

        return (
            <Menu className={styles.menu}>
                {modes.map((mode) => (
                    <MenuItem
                        key={mode.id}
                        id={mode.id}
                        textValue={mode.name}
                        className={styles.menuItem}
                        onAction={() => handleRepeatModeSelect(mode.id)}
                    >
                        <span className={styles.itemText}>{mode.name}</span>
                        {currentMode === mode.id && (
                            <SvgIcon svg={IconSvgs.checkmark} size={18} className={styles.checkmark} />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        );
    };

    const renderQualitySubmenu = () => {
        const mediaSource = playbackManager.currentMediaSource(player);
        const videoStream = mediaSource?.MediaStreams?.filter((s: any) => s.Type === 'Video')[0];

        const options = qualityoptions.getVideoQualityOptions({
            currentMaxBitrate: playbackManager.getMaxStreamingBitrate(player),
            isAutomaticBitrateEnabled: playbackManager.enableAutomaticBitrateDetection(player),
            videoCodec: videoStream?.Codec,
            videoBitRate: videoStream?.BitRate,
            enableAuto: true
        });

        return (
            <Menu className={styles.menu}>
                {options.map((option: any) => (
                    <MenuItem
                        key={option.bitrate || 'auto'}
                        id={String(option.bitrate || 'auto')}
                        textValue={option.name}
                        className={styles.menuItem}
                        onAction={() => handleQualitySelect(option.bitrate, !option.bitrate)}
                    >
                        <span className={styles.itemText}>{option.name}</span>
                        {option.secondaryText && (
                            <span className={styles.itemSecondary}>{option.secondaryText}</span>
                        )}
                        {option.selected && (
                            <SvgIcon svg={IconSvgs.checkmark} size={18} className={styles.checkmark} />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        );
    };

    // Get current values for display (re-computed on refreshKey change)
    const getCurrentAspectRatioName = () => {
        if (!supportedCommands.includes('SetAspectRatio')) return '';
        const currentId = playbackManager.getAspectRatio(player);
        return playbackManager.getSupportedAspectRatios(player)
            .find((i: any) => i.id === currentId)?.name || '';
    };

    const getCurrentPlaybackRateName = () => {
        if (!supportedCommands.includes('PlaybackRate')) return '';
        const currentId = playbackManager.getPlaybackRate(player);
        return playbackManager.getSupportedPlaybackRates(player)
            .find((i: any) => i.id === currentId)?.name || '';
    };

    const getCurrentRepeatModeName = () => {
        if (!supportedCommands.includes('SetRepeatMode')) return '';
        const repeatMode = playbackManager.getRepeatMode(player);
        return repeatMode === 'RepeatNone'
            ? globalize.translate('None')
            : globalize.translate(repeatMode);
    };

    return (
        <>
            <MenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
                <FocusRing focusRingClass="focus-ring">
                    <RacButton
                        ref={buttonRef}
                        className={styles.iconButton}
                        aria-label={globalize.translate('Settings')}
                        onPress={handlePress}
                    >
                        <SvgIcon svg={IconSvgs.settings} size={20} />
                    </RacButton>
                </FocusRing>

                <Popover
                    className={styles.popover}
                    placement="top end"
                    offset={8}
                >
                <Menu className={styles.menu} key={refreshKey}>
                    {/* Aspect Ratio */}
                    {supportedCommands.includes('SetAspectRatio') && (
                        <SubmenuTrigger>
                            <MenuItem
                                textValue={globalize.translate('AspectRatio')}
                                className={styles.menuItem}
                            >
                                <span className={styles.itemText}>
                                    {globalize.translate('AspectRatio')}
                                </span>
                                <span className={styles.itemSecondary}>
                                    {getCurrentAspectRatioName()}
                                </span>
                            </MenuItem>
                            <Popover className={styles.submenuPopover} offset={-2} crossOffset={-4}>
                                {renderAspectRatioSubmenu()}
                            </Popover>
                        </SubmenuTrigger>
                    )}

                    {/* Playback Speed */}
                    {supportedCommands.includes('PlaybackRate') && (
                        <SubmenuTrigger>
                            <MenuItem
                                textValue={globalize.translate('PlaybackRate')}
                                className={styles.menuItem}
                            >
                                <span className={styles.itemText}>
                                    {globalize.translate('PlaybackRate')}
                                </span>
                                <span className={styles.itemSecondary}>
                                    {getCurrentPlaybackRateName()}
                                </span>
                            </MenuItem>
                            <Popover className={styles.submenuPopover} offset={-2} crossOffset={-4}>
                                {renderPlaybackRateSubmenu()}
                            </Popover>
                        </SubmenuTrigger>
                    )}

                    {/* Quality */}
                    {supportedCommands.includes('SetMaxStreamingBitrate') &&
                        playbackManager.currentMediaSource(player)?.SupportsTranscoding && (
                        <SubmenuTrigger>
                            <MenuItem
                                textValue={globalize.translate('Quality')}
                                className={styles.menuItem}
                            >
                                <span className={styles.itemText}>
                                    {globalize.translate('Quality')}
                                </span>
                            </MenuItem>
                            <Popover className={styles.submenuPopover} offset={-2} crossOffset={-4}>
                                {renderQualitySubmenu()}
                            </Popover>
                        </SubmenuTrigger>
                    )}

                    {/* Repeat Mode */}
                    {supportedCommands.includes('SetRepeatMode') && (
                        <SubmenuTrigger>
                            <MenuItem
                                textValue={globalize.translate('RepeatMode')}
                                className={styles.menuItem}
                            >
                                <span className={styles.itemText}>
                                    {globalize.translate('RepeatMode')}
                                </span>
                                <span className={styles.itemSecondary}>
                                    {getCurrentRepeatModeName()}
                                </span>
                            </MenuItem>
                            <Popover className={styles.submenuPopover} offset={-2} crossOffset={-4}>
                                {renderRepeatModeSubmenu()}
                            </Popover>
                        </SubmenuTrigger>
                    )}

                    {/* Subtitle Offset */}
                    {playbackManager.supportSubtitleOffset &&
                        playbackManager.supportSubtitleOffset(player) &&
                        playbackManager.canHandleOffsetOnCurrentSubtitle &&
                        playbackManager.canHandleOffsetOnCurrentSubtitle(player) && (
                        <MenuItem
                            textValue={globalize.translate('SubtitleOffset')}
                            className={styles.menuItem}
                            onAction={handleSubtitleOffset}
                        >
                            <span className={styles.itemText}>
                                {globalize.translate('SubtitleOffset')}
                            </span>
                        </MenuItem>
                    )}

                    {/* Playback Data / Stats */}
                    <MenuItem
                        textValue={globalize.translate('PlaybackData')}
                        className={styles.menuItem}
                        onAction={toggleStats}
                    >
                        <span className={styles.itemText}>
                            {globalize.translate('PlaybackData')}
                        </span>
                    </MenuItem>
                </Menu>
            </Popover>
        </MenuTrigger>

        <SubtitleOffsetControl
            player={player}
            isOpen={showSubtitleOffset}
            onOpenChange={setShowSubtitleOffset}
        />
        </>
    );
};
