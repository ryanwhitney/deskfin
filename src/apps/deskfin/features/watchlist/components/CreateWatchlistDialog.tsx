import React, { type FC, useState } from 'react';
import {
    Dialog,
    DialogTrigger,
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

import { useCreatePlaylistMutation } from '../hooks/useCreatePlaylistMutation';
import globalize from 'lib/globalize';

import styles from './CreateWatchlistDialog.module.scss';

interface CreateWatchlistDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialItem?: BaseItemDto;
}

/**
 * Modal dialog for creating a new watchlist/playlist.
 * Optionally adds an initial item to the list on creation.
 */
export const CreateWatchlistDialog: FC<CreateWatchlistDialogProps> = ({
    isOpen,
    onClose,
    initialItem
}) => {
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const { mutateAsync: createPlaylist, isPending } = useCreatePlaylistMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            await createPlaylist({
                name: name.trim(),
                isPublic,
                itemIds: initialItem?.Id ? [initialItem.Id] : []
            });

            // Reset form and close
            setName('');
            setIsPublic(false);
            onClose();
        } catch (error) {
            console.error('[CreateWatchlistDialog] Failed to create playlist:', error);
            // TODO: Show error message
        }
    };

    const handleCancel = () => {
        setName('');
        setIsPublic(false);
        onClose();
    };

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && handleCancel()}
            isDismissable
            className={styles.overlay}
        >
            <Modal className={styles.modal}>
                <Dialog className={styles.dialog}>
                    {({ close }) => (
                        <form onSubmit={handleSubmit}>
                            <Heading slot="title" className={styles.title}>
                                Create New List
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

                            <div className={styles.actions}>
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
                                    {isPending ? 'Creating...' : 'Create List'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
