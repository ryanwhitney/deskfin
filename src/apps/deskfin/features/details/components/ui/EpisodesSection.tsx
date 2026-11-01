import React, { type FC } from 'react';
import { GridListItem } from 'react-aria-components';
import { CardList } from 'apps/deskfin/components/media/CardList';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { EpisodeRow, EpisodeRowStyles } from './EpisodeRow';
import styles from '../../routes/DetailsRoute.module.scss';

interface EpisodesSectionProps {
    episodes: ItemDto[];
    queryKey: string[];
    showSeriesAndSeason?: boolean;
    title?: string;
}

export const EpisodesSection: FC<EpisodesSectionProps> = ({
    episodes,
    queryKey,
    showSeriesAndSeason = true,
    title
}) => {
    const filteredEpisodes = episodes.filter(ep => !!ep.Id);

    if (!filteredEpisodes.length) return null;

    const sectionTitle = title ?? globalize.translate('Episodes');

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
            <CardList
                className={styles.episodeList}
                aria-label={sectionTitle}
                onAction={(key) => { window.location.href = `#/details?id=${String(key)}`; }}
            >
                {filteredEpisodes.map(ep => (
                    <GridListItem
                        key={ep.Id!}
                        id={ep.Id!}
                        textValue={ep.Name ?? ''}
                        className={EpisodeRowStyles.gridItem}
                    >
                        {({ isFocused }) => (
                            <EpisodeRow
                                episode={ep}
                                queryKey={queryKey}
                                showSeriesAndSeason={showSeriesAndSeason}
                                isRovingFocused={isFocused}
                            />
                        )}
                    </GridListItem>
                ))}
            </CardList>
        </div>
    );
};
