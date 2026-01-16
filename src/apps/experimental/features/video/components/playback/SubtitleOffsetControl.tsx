import React, { type FC, useState, useEffect, useCallback } from 'react';
import { Button as RacButton, Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import { playbackManager } from 'components/playback/playbackmanager';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';

import styles from './SubtitleOffsetControl.module.scss';

interface SubtitleOffsetControlProps {
    player: any;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export const SubtitleOffsetControl: FC<SubtitleOffsetControlProps> = ({ player, isOpen, onOpenChange }) => {
    const [offset, setOffset] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>('0');

    // Load current offset when dialog opens
    useEffect(() => {
        if (isOpen && player) {
            const currentOffset = playbackManager.getPlayerSubtitleOffset?.(player) || 0;
            setOffset(currentOffset);
            setInputValue(String(currentOffset));
        }
    }, [isOpen, player]);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setOffset(value);
        setInputValue(String(value));
        if (player) {
            playbackManager.setSubtitleOffset(value, player);
        }
    }, [player]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }, []);

    const handleInputBlur = useCallback(() => {
        const value = parseFloat(inputValue);
        if (!isNaN(value) && value >= -30 && value <= 30) {
            setOffset(value);
            setInputValue(String(value));
            if (player) {
                playbackManager.setSubtitleOffset(value, player);
            }
        } else {
            // Reset to current offset if invalid
            setInputValue(String(offset));
        }
    }, [inputValue, offset, player]);

    const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // Stop propagation to prevent video player keyboard shortcuts from firing
        e.stopPropagation();

        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    }, []);

    const handleReset = useCallback(() => {
        setOffset(0);
        setInputValue('0');
        if (player) {
            playbackManager.setSubtitleOffset(0, player);
        }
    }, [player]);

    const handleClose = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className={styles.modalOverlay}
            isDismissable
        >
            <Modal className={styles.modal}>
                <Dialog className={styles.dialog}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>
                            {globalize.translate('SubtitleOffset')}
                        </h2>
                        <FocusRing focusRingClass="focus-ring">
                            <RacButton
                                className={styles.closeButton}
                                onPress={handleClose}
                                aria-label="Close"
                            >
                                <SvgIcon svg={IconSvgs.close} size={20} />
                            </RacButton>
                        </FocusRing>
                    </div>

                    <div className={styles.content}>
                        <div className={styles.sliderContainer}>
                            <span className={styles.label}>-30s</span>
                            <input
                                type="range"
                                min="-30"
                                max="30"
                                step="0.1"
                                value={offset}
                                onChange={handleSliderChange}
                                className={styles.slider}
                                aria-label="Subtitle offset slider"
                            />
                            <span className={styles.label}>+30s</span>
                        </div>

                        <div className={styles.inputContainer}>
                            <label htmlFor="offset-input" className={styles.inputLabel}>
                                {globalize.translate('Offset')}:
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="offset-input"
                                    type="text"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onBlur={handleInputBlur}
                                    onKeyDown={handleInputKeyDown}
                                    className={styles.input}
                                    aria-label="Subtitle offset input"
                                />
                                <span className={styles.inputSuffix}>s</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <FocusRing focusRingClass="focus-ring">
                                <RacButton
                                    className={styles.resetButton}
                                    onPress={handleReset}
                                >
                                    {globalize.translate('Reset')}
                                </RacButton>
                            </FocusRing>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
