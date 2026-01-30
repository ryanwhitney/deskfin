import React, { type FC } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import { Squircle } from '@squircle-js/react';
import datetime from 'scripts/datetime';
import { buildCardImageUrl } from 'apps/deskfin/features/home/utils/cardHelpers';

import styles from './ExtrasSection.module.scss';

interface ExtrasSectionProps {
    extras: BaseItemDto[];
}

/**
 * Displays special features/extras for a movie or series.
 */
export const ExtrasSection: FC<ExtrasSectionProps> = ({ extras }) => {
    if (!extras.length) return null;

    const handlePlay = (item: BaseItemDto) => {
        void playbackManager.play({
            items: [item]
        });
    };

    // Format runtime to human-readable
    const formatRuntime = (ticks: number | null | undefined) => {
        if (!ticks) return null;
        return datetime.getDisplayRunningTime(ticks);
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>
                {globalize.translate('Extras')}
            </h2>
            <div className={styles.row}>
                {extras.map((extra) => {
                    const imageUrl = buildCardImageUrl(extra, { variant: 'landscape', maxWidth: 400 });
                    const runtime = formatRuntime(extra.RunTimeTicks);

                    return (
                        <button
                            key={extra.Id}
                            type="button"
                            className={styles.card}
                            onClick={() => handlePlay(extra)}
                        >
                            <Squircle
                                cornerRadius={10}
                                cornerSmoothing={1}
                                className={styles.thumbWrap}
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={extra.Name || ''}
                                        className={styles.thumb}
                                    />
                                ) : (
                                    <div className={styles.thumbPlaceholder} />
                                )}
                                <div className={styles.playOverlay}>
                                    <svg viewBox="0 0 24 24" className={styles.playIcon}>
                                        <path d="M8 5v14l11-7z" fill="currentColor" />
                                    </svg>
                                </div>
                            </Squircle>
                            <div className={styles.meta}>
                                <div className={styles.name}>{extra.Name}</div>
                                {runtime && (
                                    <div className={styles.info}>{runtime}</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};
