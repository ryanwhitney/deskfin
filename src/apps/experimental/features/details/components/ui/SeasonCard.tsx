import React from 'react';

import type { ItemDto } from 'types/base/models/item-dto';
import { ItemCard } from 'apps/experimental/components/itemCard/ItemCard';

import styles from './SeasonCard.module.scss';

export type SeasonCardProps = {
    season: ItemDto;
    imageUrl?: string;
    episodeCount?: number;
};

export function SeasonCard({ season, imageUrl, episodeCount }: Readonly<SeasonCardProps>) {
    return (
        <ItemCard
            href={`#/details?id=${season.Id}`}
            title={season.Name}
            imageUrl={imageUrl}
            imageFallback={'rgba(255,255,255,0.1)'}
            badge={
                typeof episodeCount === 'number' && Number.isFinite(episodeCount) && episodeCount > 0 ? (
                    <div className={styles.badge} aria-hidden='true'>{episodeCount}</div>
                ) : null
            }
            classes={{
                root: styles.root,
                image: styles.image,
                title: styles.title
            }}
        />
    );
}


