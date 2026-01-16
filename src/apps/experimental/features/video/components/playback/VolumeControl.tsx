import React, { type FC, useState, useEffect, useCallback } from "react";
import {
    Button as RacButton,
    MenuTrigger,
    Popover,
} from "react-aria-components";
import { FocusRing } from "@react-aria/focus";
import VolumeUp from "@mui/icons-material/VolumeUp";
import VolumeOff from "@mui/icons-material/VolumeOff";
import VolumeMute from "@mui/icons-material/VolumeMute";

import { playbackManager } from "components/playback/playbackmanager";
import Events from "utils/events";

import styles from "./VolumeControl.module.scss";

interface VolumeControlProps {
    player: any;
}

export const VolumeControl: FC<VolumeControlProps> = ({ player }) => {
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);

    const updateVolume = useCallback(() => {
        if (!player) return;

        const vol = playbackManager.getVolume(player);
        setVolume(Math.round((vol ?? 1) * 100));
        setIsMuted(playbackManager.isMuted(player) || false);
    }, [player]);

    useEffect(() => {
        updateVolume();

        const onVolumeChange = () => updateVolume();

        if (player) {
            Events.on(player, "volumechange", onVolumeChange);
        }

        return () => {
            if (player) {
                Events.off(player, "volumechange", onVolumeChange);
            }
        };
    }, [player, updateVolume]);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!player) return;

        const newVolume = parseInt(e.target.value, 10);
        setVolume(newVolume);
        playbackManager.setVolume(newVolume / 100, player);

        // Unmute if muted
        if (isMuted && newVolume > 0) {
            playbackManager.setMute(false, player);
            setIsMuted(false);
        }
    };

    const handleToggleMute = () => {
        if (!player) return;

        playbackManager.toggleMute(player);
        setIsMuted(!isMuted);
    };

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) {
            return <VolumeOff />;
        }
        if (volume < 50) {
            return <VolumeMute />;
        }
        return <VolumeUp />;
    };

    return (
        <MenuTrigger>
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    className={styles.iconButton}
                    onPress={handleToggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {getVolumeIcon()}
                </RacButton>
            </FocusRing>

            <Popover className={styles.popover} placement="top" offset={8}>
                <div className={styles.sliderContainer}>
                    <input
                        type="range"
                        min="0"
                        max="10000"
                        step="1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className={styles.slider}
                        aria-label="Volume"
                    />
                    <div className={styles.volumeLabel}>{volume / 100}%</div>
                </div>
            </Popover>
        </MenuTrigger>
    );
};
