import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';

import { ItemAction } from 'constants/itemAction';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';
import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../assets/icons';

interface FavoriteButtonProps {
    className?: string;
    isFavorite: boolean | undefined;
    itemId: string | null | undefined;
    queryKey?: string[]
}

const FavoriteButton: FC<FavoriteButtonProps> = ({
    className,
    isFavorite = false,
    itemId,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            await toggleFavoriteMutation({
                itemId,
                isFavorite
            },
            { onSuccess: async() => {
                await queryClient.invalidateQueries({
                    queryKey,
                    type: 'all',
                    refetchType: 'active'
                });
            } });
        } catch (e) {
            console.error(e);
        }
    }, [isFavorite, itemId, queryClient, queryKey, toggleFavoriteMutation]);

    return (
        <IconButton
            data-action={ItemAction.None}
            className={className}
            title={isFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            size='small'
            onClick={onClick}
        >
            <span style={{ color: isFavorite ? '#ff4d6d' : undefined }}>
                <JfIcon svg={IconSvgs.heart} />
            </span>
        </IconButton>
    );
};

export default FavoriteButton;
