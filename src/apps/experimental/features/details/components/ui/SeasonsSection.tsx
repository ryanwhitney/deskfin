import React, { type FC } from 'react';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { SeasonCard } from './SeasonCard';
import { buildImageUrl } from '../../utils/imageUrl';
import styles from '../../routes/DetailsRoute.module.scss';

interface SeasonsSectionProps {
    seasons: ItemDto[];
}

export const SeasonsSection: FC<SeasonsSectionProps> = ({ seasons }) => {
    if (!seasons.length) return null;

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{globalize.translate('HeaderSeasons')}</h2>
            <div className={styles.cardRow}>
                {seasons.map(s => {
                    const sImg = buildImageUrl(s, 'Primary', 400);
                    const sCountRaw = (s as any).ChildCount ?? (s as any).EpisodeCount;
                    const sCount = typeof sCountRaw === 'number'
                        ? sCountRaw
                        : (typeof sCountRaw === 'string' ? parseInt(sCountRaw, 10) : 0);

                    return (
                        <SeasonCard
                            key={s.Id}
                            imageUrl={sImg}
                            season={s}
                            episodeCount={Number.isFinite(sCount) ? sCount : undefined}
                        />
                    );
                })}
            </div>
        </div>
    );
};
