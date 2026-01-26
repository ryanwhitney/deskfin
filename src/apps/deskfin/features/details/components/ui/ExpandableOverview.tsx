import React, { type FC, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components';

import styles from './ExpandableOverview.module.scss';

interface ExpandableOverviewProps {
    text: string;
    maxLines?: number;
}

export const ExpandableOverview: FC<ExpandableOverviewProps> = ({
    text,
    maxLines = 2
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (el) {
            setIsTruncated(el.scrollHeight > el.clientHeight);
        }
    }, [text]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const lineHeight = 14 * 1.5; // fontSize * lineHeight
    const containerHeight = lineHeight * maxLines;

    return (
        <div className={styles.wrapper}>
            <div
                ref={containerRef}
                className={`${styles.container} ${isTruncated ? styles.truncated : ''}`}
                style={{
                    maxHeight: containerHeight,
                    // @ts-expect-error CSS custom property
                    '--line-height': `${lineHeight}px`
                }}
            >
                <p className={styles.text}>{text}</p>
            </div>

            {isTruncated && (
                <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
                    <Button className={styles.moreButton}>
                        more
                    </Button>
                    <ModalOverlay className={styles.modalOverlay} isDismissable>
                        <Modal className={styles.modal}>
                            <Dialog className={styles.dialog}>
                                <Heading slot='title' className={styles.modalTitle}>
                                    Overview
                                </Heading>
                                <p className={styles.fullText}>{text}</p>
                                <Button
                                    className={styles.closeButton}
                                    onPress={handleClose}
                                >
                                    Close
                                </Button>
                            </Dialog>
                        </Modal>
                    </ModalOverlay>
                </DialogTrigger>
            )}
        </div>
    );
};
