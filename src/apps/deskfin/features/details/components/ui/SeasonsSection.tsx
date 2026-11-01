import React, { type FC } from 'react';
import { GridListItem } from 'react-aria-components';
import globalize from 'lib/globalize';
import { CardList } from 'apps/deskfin/components/media/CardList';
import type { ItemDto } from 'types/base/models/item-dto';
import { SeasonCard } from './SeasonCard';
import { buildImageUrl } from '../../utils/imageUrl';
import { toCount } from 'apps/deskfin/utils/count';
import styles from '../../routes/DetailsRoute.module.scss';

interface SeasonsSectionProps {
    seasons: ItemDto[];
}

export const SeasonsSection: FC<SeasonsSectionProps> = ({ seasons }) => {
    if (!seasons.length) return null;

    return (
        <div className={styles.scrollSection}>
            <h2 className={styles.sectionTitle}>{globalize.translate('HeaderSeasons')}</h2>
            <CardList aria-label={globalize.translate('HeaderSeasons')} className={styles.cardRow}>
                {seasons.map(s => {
                    const sImg = buildImageUrl(s, 'Primary', 400);
                    const sCount = toCount(s.ChildCount ?? s.EpisodeCount);

                    return (
                        <GridListItem
                            key={s.Id}
                            id={s.Id ?? s.Name ?? ''}
                            textValue={s.Name ?? ''}
                            className={styles.seasonItem}
                            href={`#/details?id=${s.Id}`}
                        >
                            <SeasonCard
                                imageUrl={sImg}
                                season={s}
                                episodeCount={Number.isFinite(sCount) ? sCount : undefined}
                            />
                        </GridListItem>
                    );
                })}
            </CardList>
        </div>
    );
};
