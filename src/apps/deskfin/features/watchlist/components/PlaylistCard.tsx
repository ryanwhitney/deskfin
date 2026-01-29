import React, { type FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Squircle } from '@squircle-js/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import {
    Button as RacButton,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    Separator,
    Dialog,
    DialogTrigger,
    Modal,
    Heading
} from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import { useApi } from 'hooks/useApi';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { buildCardImageUrl } from 'apps/deskfin/features/home/utils/cardHelpers';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { ActionMenuStyles } from 'apps/deskfin/components/menu/ActionMenu';
import { useDeletePlaylistMutation } from '../hooks/useDeletePlaylistMutation';
import { ManagePlaylistDialog } from './ManagePlaylistDialog';

import styles from './PlaylistCard.module.scss';

interface PlaylistCardProps {
    playlist: BaseItemDto;
    serverId?: string;
    onDeleted?: () => void;
}

interface ThumbContentProps {
    previewImages: string[];
}

const ThumbContent: FC<ThumbContentProps> = ({ previewImages }) => {
    if (previewImages.length === 0) {
        return (
            <div className={styles.placeholder}>
                <SvgIcon svg={IconSvgs.listBullet} size={48} />
            </div>
        );
    }

    if (previewImages.length === 1) {
        return (
            <img
                src={previewImages[0]}
                alt=''
                className={styles.singleImage}
            />
        );
    }

    return (
        <div className={styles.collage}>
            {previewImages.slice(0, 4).map((url) => (
                <div
                    key={url}
                    className={styles.collageItem}
                    style={{ backgroundImage: `url(${url})` }}
                />
            ))}
        </div>
    );
};

export const PlaylistCard: FC<PlaylistCardProps> = ({ playlist, serverId, onDeleted }) => {
    const { api, user } = useApi();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: deletePlaylist, isPending: isDeleting } = useDeletePlaylistMutation();

    // Fetch first few items from the playlist for preview images
    const { data: previewItems = [] } = useQuery({
        queryKey: ['PlaylistPreview', playlist.Id],
        queryFn: async () => {
            if (!api || !user?.Id || !playlist.Id) return [];

            const response = await getItemsApi(api).getItems({
                userId: user.Id,
                parentId: playlist.Id,
                limit: 4,
                fields: [ItemFields.PrimaryImageAspectRatio],
                enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop]
            });

            return response.data.Items || [];
        },
        enabled: !!api && !!user?.Id && !!playlist.Id,
        staleTime: 60 * 1000 // 1 minute
    });

    const href = `/list?id=${playlist.Id}&serverId=${serverId || user?.ServerId}`;
    const itemCount = playlist.ChildCount || 0;
    const isFavorite = !!playlist.UserData?.IsFavorite;

    // Get preview image URLs
    const previewImages = previewItems
        .slice(0, 4)
        .map(item => buildCardImageUrl(item, { variant: 'portrait', maxWidth: 200 }))
        .filter(Boolean);

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, [role="menu"], [role="menuitem"]')) return;

        if (e.metaKey || e.ctrlKey) {
            window.open(href, '_blank');
        } else {
            navigate(href);
        }
    };

    const handleToggleFavorite = async () => {
        if (!playlist.Id) return;
        await toggleFavorite({
            itemId: playlist.Id,
            isFavorite
        });
        void queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
    };

    const handleDelete = async () => {
        if (!playlist.Id) return;
        try {
            await deletePlaylist({ playlistId: playlist.Id });
            setIsDeleteConfirmOpen(false);
            onDeleted?.();
        } catch (error) {
            console.error('[PlaylistCard] Failed to delete playlist:', error);
        }
    };

    const handleManageClose = () => {
        setIsManageOpen(false);
        void queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
    };

    return (
        <div className={styles.card} onClick={handleCardClick}>
            <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className={styles.thumbBorder}
            >
                <Squircle
                    cornerRadius={14}
                    cornerSmoothing={1}
                    className={styles.thumbWrap}
                >
                    <div className={styles.thumb}>
                        <ThumbContent previewImages={previewImages} />

                        {itemCount > 0 && (
                            <div className={styles.countBadge} aria-hidden='true'>
                                {itemCount}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <MenuTrigger
                                isOpen={isMenuOpen}
                                onOpenChange={setIsMenuOpen}
                            >
                                <FocusRing focusRingClass='focus-ring'>
                                    <RacButton
                                        className={styles.iconBtn}
                                        aria-label='More options'
                                    >
                                        <SvgIcon svg={IconSvgs.ellipsis} size={18} />
                                    </RacButton>
                                </FocusRing>
                                <Popover className={ActionMenuStyles.popover}>
                                    <Menu
                                        className={ActionMenuStyles.menu}
                                        aria-label='Playlist options'
                                    >
                                        <MenuItem
                                            className={ActionMenuStyles.item}
                                            textValue={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            onAction={() => void handleToggleFavorite()}
                                        >
                                            <span
                                                className={ActionMenuStyles.icon}
                                                aria-hidden='true'
                                                style={{ color: isFavorite ? '#ff4d6d' : undefined }}
                                            >
                                                <SvgIcon svg={IconSvgs.heart} size={18} />
                                            </span>
                                            <span className={ActionMenuStyles.text}>
                                                {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            </span>
                                        </MenuItem>

                                        <Separator className={ActionMenuStyles.divider} />

                                        <MenuItem
                                            className={ActionMenuStyles.item}
                                            textValue='Manage playlist'
                                            onAction={() => {
                                                setIsMenuOpen(false);
                                                setIsManageOpen(true);
                                            }}
                                        >
                                            <span className={ActionMenuStyles.icon} aria-hidden='true'>
                                                <SvgIcon svg={IconSvgs.settings} size={18} />
                                            </span>
                                            <span className={ActionMenuStyles.text}>
                                                Manage playlist
                                            </span>
                                        </MenuItem>

                                        <MenuItem
                                            className={ActionMenuStyles.item}
                                            textValue='Delete playlist'
                                            onAction={() => {
                                                setIsMenuOpen(false);
                                                setIsDeleteConfirmOpen(true);
                                            }}
                                        >
                                            <span
                                                className={ActionMenuStyles.icon}
                                                aria-hidden='true'
                                                style={{ color: '#ff4d6d' }}
                                            >
                                                <SvgIcon svg={IconSvgs.delete} size={18} />
                                            </span>
                                            <span className={ActionMenuStyles.text}>
                                                Delete playlist
                                            </span>
                                        </MenuItem>
                                    </Menu>
                                </Popover>
                            </MenuTrigger>
                        </div>
                    </div>
                </Squircle>
            </Squircle>

            <div className={styles.meta}>
                <h3 className={styles.title}>{playlist.Name || 'Unnamed Playlist'}</h3>
                <p className={styles.subtitle}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
            </div>

            <ManagePlaylistDialog
                isOpen={isManageOpen}
                onClose={handleManageClose}
                playlist={playlist}
            />

            <DialogTrigger isOpen={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <Modal className={styles.deleteModal}>
                    <Dialog className={styles.deleteDialog}>
                        {({ close }) => (
                            <>
                                <Heading slot='title' className={styles.deleteTitle}>
                                    Delete Playlist
                                </Heading>
                                <p className={styles.deleteMessage}>
                                    Are you sure you want to delete "{playlist.Name}"? This action cannot be undone.
                                </p>
                                <div className={styles.deleteActions}>
                                    <RacButton
                                        className={styles.cancelBtn}
                                        onPress={close}
                                    >
                                        Cancel
                                    </RacButton>
                                    <RacButton
                                        className={styles.deleteBtn}
                                        onPress={() => void handleDelete()}
                                        isDisabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </RacButton>
                                </div>
                            </>
                        )}
                    </Dialog>
                </Modal>
            </DialogTrigger>
        </div>
    );
};
