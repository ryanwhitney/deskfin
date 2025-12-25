import React, { type FC, useCallback } from 'react';
import { Button } from 'react-aria-components';

import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { playbackManager } from 'components/playback/playbackmanager';
import { getFiltersQuery } from 'utils/items';
import type { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';

import styles from './LibraryToolbar.module.scss';

interface PlayAllButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
    showText?: boolean;
}

export const PlayAllButton: FC<PlayAllButtonProps> = ({
    item,
    items,
    viewType,
    hasFilters,
    libraryViewSettings,
    showText = true
}) => {
    const onPlay = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.play({
                items: [item],
                autoplay: true,
                queryOptions: {
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            }).catch((err) => {
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
            }).catch((err) => {
                console.error('[PlayAllButton] failed to play', err);
            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <Button
            className={`${styles.toolbarButton} ${styles.toolbarButtonPrimary}`}
            onPress={onPlay}
            aria-label={globalize.translate('HeaderPlayAll')}
        >
            <SvgIcon svg={IconSvgs.play} size={16} />
            {showText && <span>{globalize.translate('HeaderPlayAll')}</span>}
        </Button>
    );
};

interface ShuffleButtonProps {
    item: ItemDto | undefined;
    items: ItemDto[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
    showText?: boolean;
}

export const ShuffleButton: FC<ShuffleButtonProps> = ({
    item,
    items,
    viewType,
    hasFilters,
    libraryViewSettings,
    showText = false
}) => {
    const onShuffle = useCallback(() => {
        if (item && !hasFilters) {
            playbackManager.shuffle(item);
        } else {
            playbackManager.play({
                items,
                autoplay: true,
                shuffle: true,
                queryOptions: {
                    ParentId: item?.Id ?? undefined,
                    ...getFiltersQuery(viewType, libraryViewSettings),
                    SortBy: [libraryViewSettings.SortBy],
                    SortOrder: [libraryViewSettings.SortOrder]
                }
            }).catch((err) => {
                console.error('[ShuffleButton] failed to shuffle', err);
            });
        }
    }, [hasFilters, item, items, libraryViewSettings, viewType]);

    return (
        <Button
            className={`${styles.toolbarButton} ${styles.toolbarButtonPrimary}`}
            onPress={onShuffle}
            aria-label={globalize.translate('Shuffle')}
        >
            <SvgIcon svg={IconSvgs.shuffle} size={16} />
            {showText && <span>{globalize.translate('Shuffle')}</span>}
        </Button>
    );
};

interface NewCollectionButtonProps {
    showText?: boolean;
}

export const NewCollectionButton: FC<NewCollectionButtonProps> = ({ showText = true }) => {
    const onClick = useCallback(() => {
        import('components/collectionEditor/collectionEditor').then(({ default: CollectionEditor }) => {
            const editor = new CollectionEditor();
            editor.show({ items: [], serverId: '' });
        }).catch((err) => {
            console.error('[NewCollectionButton] failed to open editor', err);
        });
    }, []);

    return (
        <Button
            className={styles.toolbarButton}
            onPress={onClick}
            aria-label={globalize.translate('NewCollection')}
        >
            <SvgIcon svg={IconSvgs.addTo} size={16} />
            {showText && <span>{globalize.translate('NewCollection')}</span>}
        </Button>
    );
};
