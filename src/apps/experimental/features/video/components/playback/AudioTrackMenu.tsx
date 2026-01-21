import React, { type FC, useState, useEffect } from 'react';
import {
    Button as RacButton,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover
} from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';
import Audiotrack from '@mui/icons-material/Audiotrack';

import { playbackManager } from 'components/playback/playbackmanager';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';

import { useBlurOnMousePress } from './useBlurOnMousePress';
import styles from './TrackMenu.module.scss';

interface AudioTrackMenuProps {
    player: any;
    onUpdate: () => void;
}

export const AudioTrackMenu: FC<AudioTrackMenuProps> = ({ player, onUpdate }) => {
    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number | undefined>();
    const [isOpen, setIsOpen] = useState(false);
    const { ref: buttonRef, handlePress } = useBlurOnMousePress();

    useEffect(() => {
        if (!player) return;

        const tracks = playbackManager.audioTracks(player) || [];
        setAudioTracks(tracks);

        const index = playbackManager.getAudioStreamIndex(player);
        setCurrentIndex(index);
    }, [player]);

    const handleSelectTrack = (index: number) => {
        if (!player) return;

        playbackManager.setAudioStreamIndex(index, player);
        setCurrentIndex(index);
        onUpdate();
    };

    return (
        <MenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={buttonRef}
                    className={styles.iconButton}
                    aria-label={globalize.translate('Audio')}
                    onPress={handlePress}
                >
                    <Audiotrack />
                </RacButton>
            </FocusRing>

            <Popover
                className={styles.popover}
                placement="top end"
                offset={8}
            >
                <Menu className={styles.menu} onAction={(key) => handleSelectTrack(Number(key))}>
                    {audioTracks.map((track) => (
                        <MenuItem
                            key={track.Index}
                            id={String(track.Index)}
                            textValue={track.DisplayTitle || `Track ${track.Index}`}
                            className={styles.menuItem}
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
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};
