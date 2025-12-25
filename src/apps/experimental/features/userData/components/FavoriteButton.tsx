import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from '../../../../../assets/icons';
import { IconButton } from 'apps/experimental/components/shared';
import { updateItemUserDataCache } from '../utils/updateItemUserDataCache';

interface FavoriteButtonProps {
    className?: string;
    isFavorite: boolean | undefined;
    itemId: string | null | undefined;
}

const FavoriteButton: FC<FavoriteButtonProps> = ({ className, isFavorite = false, itemId }) => {
    const queryClient = useQueryClient();
    const { user } = useApi();
    const { mutateAsync } = useToggleFavoriteMutation();

    const onClick = useCallback(async () => {
        if (!itemId) return;

        // Optimistic update
        const optimistic = !isFavorite;
        updateItemUserDataCache(queryClient, user?.Id, itemId, { IsFavorite: optimistic });

        try {
            const confirmed = await mutateAsync({ itemId, isFavorite });
            if (typeof confirmed === 'boolean') {
                updateItemUserDataCache(queryClient, user?.Id, itemId, { IsFavorite: confirmed });
            } else {
                // Fallback: refetch lists if server didn't return a boolean
                await queryClient.invalidateQueries({ queryKey: [ 'Items' ], exact: false, refetchType: 'active' });
            }
        } catch (e) {
            console.error('[ExpFavoriteButton] toggle failed', e);
            // Fallback: refetch lists (and details) if something went wrong
            await queryClient.invalidateQueries({ queryKey: [ 'Items' ], exact: false, refetchType: 'active' });
        }
    }, [isFavorite, itemId, mutateAsync, queryClient, user?.Id]);

    return (
        <IconButton
            className={className}
            title={isFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            aria-label={isFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            onClick={onClick}
            icon={<SvgIcon svg={IconSvgs.heart} size={18} style={{ color: isFavorite ? '#ff4d6d' : undefined }} />}
        />
    );
};

export default FavoriteButton;
