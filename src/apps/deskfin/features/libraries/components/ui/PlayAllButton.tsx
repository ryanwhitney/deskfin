import React, { FC, useCallback } from 'react';
import PlayArrow from '@mui/icons-material/PlayArrow';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import { getFiltersQuery } from 'utils/items';
import { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

import styles from './GridActionButton.module.scss';

interface PlayAllButtonProps {
    item: ItemDto | undefined
    items: ItemDto[]
    viewType: LibraryTab
    hasFilters: boolean
    libraryViewSettings: LibraryViewSettings
}

const PlayAllButton: FC<PlayAllButtonProps> = ({
    item,
    items,
    viewType,
    hasFilters,
    libraryViewSettings
}) => {
    const play = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.play({
                items: [item],
                autoplay: true,
                queryOptions: {
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            }).catch(err => {
                console.error('[PlayAllButton] failed to play', err);
            });
        } else {
            playbackManager.play({
                items,
                autoplay: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            }).catch(err => {
                console.error('[PlayAllButton] failed to play', err);
            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <button
            type="button"
            className={styles.actionButton}
            title={globalize.translate('HeaderPlayAll')}
            onClick={play}
        >
            <PlayArrow sx={{ fontSize: 18 }} />
            <span>{globalize.translate('HeaderPlayAll')}</span>
        </button>
    );
};

export default PlayAllButton;
