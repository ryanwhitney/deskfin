import React, { type FC, useCallback } from 'react';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Shuffle from '@mui/icons-material/Shuffle';
import Add from '@mui/icons-material/Add';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';

import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import { getFiltersQuery } from 'utils/items';
import type { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

import styles from './GridActionButton.module.scss';

interface PlayAllButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
}

export const PlayAllButton: FC<PlayAllButtonProps> = ({
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
            type='button'
            className={styles.actionButton}
            title={globalize.translate('HeaderPlayAll')}
            onClick={play}
        >
            <PlayArrow sx={{ fontSize: 18 }} />
            <span>{globalize.translate('HeaderPlayAll')}</span>
        </button>
    );
};

interface ShuffleButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
}

export const ShuffleButton: FC<ShuffleButtonProps> = ({
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
            type='button'
            className={styles.actionButton}
            title={globalize.translate('Shuffle')}
            onClick={shuffle}
        >
            <Shuffle sx={{ fontSize: 18 }} />
            <span>{globalize.translate('Shuffle')}</span>
        </button>
    );
};

export const NewCollectionButton: FC = () => {
    const showCollectionEditor = useCallback(() => {
        import('components/collectionEditor/collectionEditor').then(
            ({ default: CollectionEditor }) => {
                const serverId = window.ApiClient.serverId();
                const collectionEditor = new CollectionEditor();
                collectionEditor.show({
                    items: [],
                    serverId: serverId
                }).catch(() => {
                    // closed collection editor
                });
            }).catch(err => {
            console.error('[NewCollection] failed to load collection editor', err);
        });
    }, []);

    return (
        <button
            type='button'
            className={styles.actionButton}
            title={globalize.translate('NewCollection')}
            onClick={showCollectionEditor}
        >
            <Add sx={{ fontSize: 18 }} />
            <span>{globalize.translate('NewCollection')}</span>
        </button>
    );
};
