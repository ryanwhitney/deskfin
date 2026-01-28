import React, { type FC, useEffect, useState, useMemo } from 'react';
import { Button, Menu, MenuItem, MenuTrigger, Popover, Section, Header } from 'react-aria-components';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ItemDto } from 'types/base/models/item-dto';

import { useApi } from 'hooks/useApi';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import Page from 'components/Page';
import { ItemGrid } from 'apps/deskfin/components/media/ItemGrid';
import { useTitle } from 'apps/deskfin/utils/useTitle';
import { formatLibraryTitle } from 'apps/deskfin/utils/titleUtils';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';

import { ManagePlaylistDialog } from './ManagePlaylistDialog';
import styles from './PlaylistView.module.scss';
import toolbarStyles from 'apps/deskfin/components/library/LibraryToolbar.module.scss';

type SortOption = 'default' | 'name' | 'dateAdded';

interface PlaylistViewProps {
    playlistId: string;
}

/**
 * Full-page view for displaying playlist contents in a grid.
 */
export const PlaylistView: FC<PlaylistViewProps> = ({ playlistId }) => {
    const { api, user } = useApi();
    const [playlist, setPlaylist] = useState<BaseItemDto | null>(null);
    const [items, setItems] = useState<ItemDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [sortAscending, setSortAscending] = useState(true);
    const [isManageOpen, setIsManageOpen] = useState(false);

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    useTitle(playlist?.Name ? formatLibraryTitle(playlist.Name) : 'Playlist');

    const fetchPlaylist = async () => {
        if (!api || !user?.Id) return;

        setIsLoading(true);
        try {
            const userLibraryApi = getUserLibraryApi(api);
            const playlistsApi = getPlaylistsApi(api);

            // Fetch playlist details as BaseItemDto to get the Name
            const playlistResponse = await userLibraryApi.getItem({
                userId: user.Id,
                itemId: playlistId
            });
            setPlaylist(playlistResponse.data);

            // Fetch playlist items
            const itemsResponse = await playlistsApi.getPlaylistItems({
                playlistId,
                userId: user.Id,
                fields: ['PrimaryImageAspectRatio', 'DateCreated'],
                enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
                enableUserData: true
            });

            setItems((itemsResponse.data.Items || []) as ItemDto[]);
        } catch (error) {
            console.error('[PlaylistView] Failed to fetch playlist:', error);
            setPlaylist(null);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchPlaylist();
    }, [api, playlistId, user?.Id]);

    // Sort items based on current sort settings
    const sortedItems = useMemo(() => {
        if (sortBy === 'default') return items;

        const sorted = [...items].sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.Name ?? '').toLowerCase();
                const nameB = (b.Name ?? '').toLowerCase();
                return nameA.localeCompare(nameB);
            }
            if (sortBy === 'dateAdded') {
                const dateA = a.DateCreated ? new Date(a.DateCreated).getTime() : 0;
                const dateB = b.DateCreated ? new Date(b.DateCreated).getTime() : 0;
                return dateA - dateB;
            }
            return 0;
        });

        return sortAscending ? sorted : sorted.reverse();
    }, [items, sortBy, sortAscending]);

    const onToggleFavorite = async (item: ItemDto) => {
        if (!item.Id) return;
        await toggleFavorite({
            itemId: item.Id,
            isFavorite: !!item.UserData?.IsFavorite
        });
    };

    const onTogglePlayed = async (item: ItemDto) => {
        if (!item.Id) return;
        await togglePlayed({
            itemId: item.Id,
            isPlayed: !!item.UserData?.Played
        });
    };

    const onAfterAction = () => {
        void fetchPlaylist();
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'name': return 'Name';
            case 'dateAdded': return 'Date Added';
            default: return 'Playlist Order';
        }
    };

    if (isLoading) {
        return (
            <Page id="playlistPage" className="libraryPage">
                <div className={styles.container}>
                    {globalize.translate('Loading')}...
                </div>
            </Page>
        );
    }

    if (!playlist) {
        return (
            <Page id="playlistPage" className="libraryPage">
                <div className={styles.container}>
                    {globalize.tryTranslate?.('MessageNoItemsAvailable') ?? 'Playlist not found'}
                </div>
            </Page>
        );
    }

    return (
        <Page
            id="playlistPage"
            className="libraryPage backdropPage pageWithAbsoluteTabs withTabs"
            backDropType="movie"
        >
            <div className={styles.container}>
                <h1 className={styles.title}>{playlist.Name ?? 'Unnamed List'}</h1>

                {/* Toolbar: count on left, actions on right */}
                <div className={styles.toolbar}>
                    <div className={styles.itemCount}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </div>
                    <div className={styles.actions}>
                        {/* Sort Menu */}
                        <MenuTrigger>
                            <Button
                                className={toolbarStyles.toolbarButton}
                                aria-label={`Sort: ${getSortLabel()}`}
                            >
                                <SvgIcon
                                    svg={IconSvgs.chevronDown}
                                    size={14}
                                    className={sortAscending ? toolbarStyles.sortArrowUp : toolbarStyles.sortArrowDown}
                                />
                                <span>{getSortLabel()}</span>
                            </Button>
                            <Popover className={toolbarStyles.popover} placement='bottom start' offset={4}>
                                <Menu className={toolbarStyles.menu} aria-label='Sort options'>
                                    <Section>
                                        <Header className={toolbarStyles.sectionHeader}>
                                            {globalize.translate('LabelSortOrder')}
                                        </Header>
                                        <MenuItem
                                            id='sort-order-asc'
                                            className={toolbarStyles.menuItem}
                                            onAction={() => setSortAscending(true)}
                                        >
                                            <span className={toolbarStyles.menuItemText}>{globalize.translate('Ascending')}</span>
                                            {sortAscending && (
                                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={toolbarStyles.menuItemCheck} />
                                            )}
                                        </MenuItem>
                                        <MenuItem
                                            id='sort-order-desc'
                                            className={toolbarStyles.menuItem}
                                            onAction={() => setSortAscending(false)}
                                        >
                                            <span className={toolbarStyles.menuItemText}>{globalize.translate('Descending')}</span>
                                            {!sortAscending && (
                                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={toolbarStyles.menuItemCheck} />
                                            )}
                                        </MenuItem>
                                    </Section>
                                    <Section>
                                        <Header className={toolbarStyles.sectionHeader}>
                                            {globalize.translate('LabelSortBy')}
                                        </Header>
                                        <MenuItem
                                            id='sort-default'
                                            className={toolbarStyles.menuItem}
                                            onAction={() => setSortBy('default')}
                                        >
                                            <span className={toolbarStyles.menuItemText}>Playlist Order</span>
                                            {sortBy === 'default' && (
                                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={toolbarStyles.menuItemCheck} />
                                            )}
                                        </MenuItem>
                                        <MenuItem
                                            id='sort-name'
                                            className={toolbarStyles.menuItem}
                                            onAction={() => setSortBy('name')}
                                        >
                                            <span className={toolbarStyles.menuItemText}>Name</span>
                                            {sortBy === 'name' && (
                                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={toolbarStyles.menuItemCheck} />
                                            )}
                                        </MenuItem>
                                        <MenuItem
                                            id='sort-dateAdded'
                                            className={toolbarStyles.menuItem}
                                            onAction={() => setSortBy('dateAdded')}
                                        >
                                            <span className={toolbarStyles.menuItemText}>Date Added</span>
                                            {sortBy === 'dateAdded' && (
                                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={toolbarStyles.menuItemCheck} />
                                            )}
                                        </MenuItem>
                                    </Section>
                                </Menu>
                            </Popover>
                        </MenuTrigger>

                        {/* Manage Playlist Button */}
                        <Button
                            className={toolbarStyles.toolbarButton}
                            onPress={() => setIsManageOpen(true)}
                        >
                            <SvgIcon svg={IconSvgs.settings} size={16} />
                            <span>Manage</span>
                        </Button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className={styles.empty}>
                        {globalize.tryTranslate?.('MessageNoItemsAvailable') ?? 'No items in this list'}
                    </div>
                ) : (
                    <ItemGrid
                        items={sortedItems}
                        variant="portrait"
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        onAfterAction={onAfterAction}
                        playlistContext={{
                            playlistId,
                            playlistName: playlist.Name ?? 'this list'
                        }}
                    />
                )}
            </div>

            <ManagePlaylistDialog
                isOpen={isManageOpen}
                onClose={() => setIsManageOpen(false)}
                playlist={playlist}
                onPlaylistUpdated={onAfterAction}
            />
        </Page>
    );
};
