import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import React, { FC, useCallback } from 'react';
import Shuffle from '@mui/icons-material/Shuffle';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

import styles from './GridActionButton.module.scss';

interface ShuffleButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    viewType: LibraryTab
    hasFilters: boolean
    libraryViewSettings: LibraryViewSettings
}

const ShuffleButton: FC<ShuffleButtonProps> = ({
    item,
    items,
    viewType,
    hasFilters,
    libraryViewSettings
}) => {
    const shuffle = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.shuffle(item);
        } else {
            playbackManager.play({
                items,
                autoplay: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [ItemSortBy.Random]
                }
            }).catch(err => {
                console.error('[ShuffleButton] failed to play', err);
            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <button
            type="button"
            className={styles.actionButton}
            title={globalize.translate('Shuffle')}
            onClick={shuffle}
        >
            <Shuffle sx={{ fontSize: 18 }} />
            <span>{globalize.translate('Shuffle')}</span>
        </button>
    );
};

export default ShuffleButton;
