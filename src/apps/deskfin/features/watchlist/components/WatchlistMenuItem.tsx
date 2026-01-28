import React, { type FC } from 'react';
import { MenuItem, Menu, SubmenuTrigger, Popover, Separator } from 'react-aria-components';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import { useGetUserPlaylists } from '../hooks/useGetUserPlaylists';
import { useAddToPlaylistMutation } from '../hooks/useAddToPlaylistMutation';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { ActionMenuStyles } from 'apps/deskfin/components/menu/ActionMenu';
import globalize from 'lib/globalize';

interface WatchlistMenuItemProps {
    item: BaseItemDto;
    onCreateNew: () => void;
}

/**
 * Menu item with submenu flyout showing user's playlists.
 * Uses React Aria's SubmenuTrigger for proper accessible nested menus.
 */
export const WatchlistMenuItem: FC<WatchlistMenuItemProps> = ({ item, onCreateNew }) => {
    const { data: playlists = [], isPending } = useGetUserPlaylists();
    const { mutateAsync: addToPlaylist, isPending: isAdding } = useAddToPlaylistMutation();

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!item.Id) return;

        try {
            await addToPlaylist({
                playlistId,
                itemIds: [item.Id]
            });
        } catch (error) {
            console.error('[WatchlistMenuItem] Failed to add to playlist:', error);
        }
    };

    return (
        <SubmenuTrigger>
            <MenuItem className={ActionMenuStyles.item} textValue="Add to list">
                <span className={ActionMenuStyles.icon} aria-hidden="true">
                    <SvgIcon svg={IconSvgs.addTo} size={18} />
                </span>
                <span className={ActionMenuStyles.text}>
                    {globalize.translate('AddToPlaylist')}
                </span>
                <span className={ActionMenuStyles.endAdornment} aria-hidden="true">
                    ›
                </span>
            </MenuItem>
            <Popover className={ActionMenuStyles.popover}>
                <Menu
                    className={ActionMenuStyles.menu}
                    aria-label="Select playlist"
                    onAction={(key) => {
                        if (key === 'create-new') {
                            onCreateNew();
                        } else {
                            void handleAddToPlaylist(key as string);
                        }
                    }}
                >
                    <MenuItem
                        key="create-new"
                        id="create-new"
                        className={ActionMenuStyles.item}
                        textValue="Create new list"
                    >
                        <span className={ActionMenuStyles.icon} aria-hidden="true">
                            <SvgIcon svg={IconSvgs.addTo} size={18} />
                        </span>
                        <span className={ActionMenuStyles.text}>
                            Create new list
                        </span>
                    </MenuItem>

                    {isPending && (
                        <MenuItem
                            className={ActionMenuStyles.item}
                            textValue="Loading..."
                        >
                            <span className={ActionMenuStyles.text}>
                                Loading...
                            </span>
                        </MenuItem>
                    )}

                    {!isPending && playlists.length > 0 && (
                        <Separator className={ActionMenuStyles.divider} />
                    )}

                    {!isPending && playlists.length === 0 && (
                        <MenuItem
                            className={ActionMenuStyles.item}
                            textValue="No lists yet"
                        >
                            <span className={ActionMenuStyles.text}>
                                No lists yet
                            </span>
                        </MenuItem>
                    )}

                    {!isPending && playlists.map((playlist) => (
                        <MenuItem
                            key={playlist.Id}
                            id={playlist.Id}
                            className={ActionMenuStyles.item}
                            textValue={playlist.Name ?? 'Unnamed list'}
                            isDisabled={isAdding}
                        >
                            <span className={ActionMenuStyles.icon} aria-hidden="true">
                                <SvgIcon svg={IconSvgs.listBullet} size={18} />
                            </span>
                            <span className={ActionMenuStyles.text}>
                                {playlist.Name ?? 'Unnamed list'}
                            </span>
                        </MenuItem>
                    ))}
                </Menu>
            </Popover>
        </SubmenuTrigger>
    );
};
