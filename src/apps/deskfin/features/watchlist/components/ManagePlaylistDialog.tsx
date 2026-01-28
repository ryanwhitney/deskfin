import React, { type FC, useState, useEffect } from 'react';
import {
    Dialog,
    Modal,
    ModalOverlay,
    Heading,
    Button,
    Label,
    TextField,
    Input,
    Checkbox
} from 'react-aria-components';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { useNavigate } from 'react-router-dom';

import { useUpdatePlaylistMutation } from '../hooks/useUpdatePlaylistMutation';
import { useDeletePlaylistMutation } from '../hooks/useDeletePlaylistMutation';
import globalize from 'lib/globalize';

import styles from './CreateWatchlistDialog.module.scss';

interface ManagePlaylistDialogProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: BaseItemDto;
    onPlaylistUpdated?: () => void;
}

/**
 * Modal dialog for managing a playlist - edit name, public setting, or delete.
 */
export const ManagePlaylistDialog: FC<ManagePlaylistDialogProps> = ({
    isOpen,
    onClose,
    playlist,
    onPlaylistUpdated
}) => {
    const navigate = useNavigate();
    const [name, setName] = useState(playlist.Name ?? '');
    const [isPublic, setIsPublic] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { mutateAsync: updatePlaylist, isPending: isUpdating } = useUpdatePlaylistMutation();
    const { mutateAsync: deletePlaylist, isPending: isDeleting } = useDeletePlaylistMutation();

    // Reset form when playlist changes
    useEffect(() => {
        setName(playlist.Name ?? '');
        // Note: We'd need to fetch playlist details to get IsPublic
        // For now, default to false
        setIsPublic(false);
        setShowDeleteConfirm(false);
    }, [playlist]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !playlist.Id) return;

        try {
            await updatePlaylist({
                playlistId: playlist.Id,
                name: name.trim(),
                isPublic
            });

            onPlaylistUpdated?.();
            onClose();
        } catch (error) {
            console.error('[ManagePlaylistDialog] Failed to update playlist:', error);
        }
    };

    const handleDelete = async () => {
        if (!playlist.Id) return;

        try {
            await deletePlaylist({
                playlistId: playlist.Id
            });

            onClose();
            // Navigate away since the playlist no longer exists
            navigate('/home');
        } catch (error) {
            console.error('[ManagePlaylistDialog] Failed to delete playlist:', error);
        }
    };

    const handleCancel = () => {
        setName(playlist.Name ?? '');
        setIsPublic(false);
        setShowDeleteConfirm(false);
        onClose();
    };

    const isPending = isUpdating || isDeleting;

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && handleCancel()}
            isDismissable={!isPending}
            className={styles.overlay}
        >
            <Modal className={styles.modal}>
                <Dialog className={styles.dialog}>
                    {() => (
                        <>
                            {showDeleteConfirm ? (
                                <>
                                    <Heading slot="title" className={styles.title}>
                                        Delete List?
                                    </Heading>

                                    <div className={styles.content}>
                                        <p style={{ margin: 0 }}>
                                            Are you sure you want to delete "{playlist.Name}"? This action cannot be undone.
                                        </p>
                                    </div>

                                    <div className={styles.actions}>
                                        <Button
                                            type="button"
                                            className={styles.button}
                                            onPress={() => setShowDeleteConfirm(false)}
                                            isDisabled={isPending}
                                        >
                                            {globalize.translate('Cancel')}
                                        </Button>
                                        <Button
                                            type="button"
                                            className={[styles.button, styles.buttonDanger].join(' ')}
                                            onPress={() => void handleDelete()}
                                            isDisabled={isPending}
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete List'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <Heading slot="title" className={styles.title}>
                                        Manage List
                                    </Heading>

                                    <div className={styles.content}>
                                        <TextField
                                            className={styles.field}
                                            isRequired
                                            autoFocus
                                        >
                                            <Label className={styles.label}>List name</Label>
                                            <Input
                                                className={styles.input}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter list name"
                                            />
                                        </TextField>

                                        <Checkbox
                                            className={styles.checkbox}
                                            isSelected={isPublic}
                                            onChange={setIsPublic}
                                        >
                                            <div className={styles.checkboxBox} />
                                            <span className={styles.checkboxLabel}>
                                                Make this list public (visible to all users)
                                            </span>
                                        </Checkbox>
                                    </div>

                                    <div className={styles.actionsSpread}>
                                        <Button
                                            type="button"
                                            className={[styles.button, styles.buttonDangerOutline].join(' ')}
                                            onPress={() => setShowDeleteConfirm(true)}
                                            isDisabled={isPending}
                                        >
                                            Delete List
                                        </Button>
                                        <div className={styles.actionsRight}>
                                            <Button
                                                type="button"
                                                className={styles.button}
                                                onPress={handleCancel}
                                                isDisabled={isPending}
                                            >
                                                {globalize.translate('Cancel')}
                                            </Button>
                                            <Button
                                                type="submit"
                                                className={[styles.button, styles.buttonPrimary].join(' ')}
                                                isDisabled={isPending || !name.trim()}
                                            >
                                                {isUpdating ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
