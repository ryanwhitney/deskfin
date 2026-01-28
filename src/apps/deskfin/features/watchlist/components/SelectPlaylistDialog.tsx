import React, { type FC } from 'react';
import {
    Dialog,
    Modal,
    ModalOverlay,
    Heading,
    Button
} from 'react-aria-components';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import { useGetUserPlaylists } from '../hooks/useGetUserPlaylists';
import { useAddToPlaylistMutation } from '../hooks/useAddToPlaylistMutation';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';

import styles from './SelectPlaylistDialog.module.scss';

interface SelectPlaylistDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: BaseItemDto;
    onCreateNew: () => void;
}

/**
 * Modal dialog for selecting a playlist to add an item to.
 */
export const SelectPlaylistDialog: FC<SelectPlaylistDialogProps> = ({
    isOpen,
    onClose,
    item,
    onCreateNew
}) => {
    const { data: playlists = [], isPending } = useGetUserPlaylists({ enabled: isOpen });
    const { mutateAsync: addToPlaylist, isPending: isAdding } = useAddToPlaylistMutation();

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!item.Id) return;

        try {
            await addToPlaylist({
                playlistId,
                itemIds: [item.Id]
            });
            onClose();
        } catch (error) {
            console.error('[SelectPlaylistDialog] Failed to add to playlist:', error);
            // TODO: Show error toast
        }
    };

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={styles.overlay}
        >
            <Modal className={styles.modal}>
                <Dialog className={styles.dialog}>
                    <Heading slot="title" className={styles.title}>
                        {globalize.translate('AddToPlaylist')}
                    </Heading>

                    <div className={styles.content}>
                        <Button
                            className={styles.createButton}
                            onPress={onCreateNew}
                        >
                            <SvgIcon svg={IconSvgs.addTo} size={18} />
                            <span>Create new list</span>
                        </Button>

                        {isPending && (
                            <div className={styles.loading}>
                                {globalize.translate('Loading')}...
                            </div>
                        )}

                        {!isPending && playlists.length === 0 && (
                            <div className={styles.empty}>
                                No lists yet. Create your first list above.
                            </div>
                        )}

                        {!isPending && playlists.length > 0 && (
                            <div className={styles.list}>
                                {playlists.map((playlist) => (
                                    <button
                                        key={playlist.Id}
                                        type="button"
                                        className={styles.item}
                                        onClick={() => void handleAddToPlaylist(playlist.Id!)}
                                        disabled={isAdding}
                                    >
                                        <span className={styles.itemIcon}>
                                            <SvgIcon svg={IconSvgs.listBullet} size={20} />
                                        </span>
                                        <span className={styles.itemText}>
                                            {playlist.Name ?? 'Unnamed list'}
                                        </span>
                                        {playlist.ChildCount !== undefined && (
                                            <span className={styles.itemCount}>
                                                {playlist.ChildCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
