import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import { useTogglePlayedMutation } from 'hooks/useFetchItems';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from '../../../../../assets/icons';
import { IconButton } from 'apps/deskfin/components/button/IconButton';
import { updateItemUserDataCache } from '../utils/updateItemUserDataCache';

interface PlayedButtonProps {
    className?: string;
    isPlayed: boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined;
}

const getTitle = (itemType: string | null | undefined, isPlayed: boolean) => {
    if (itemType !== BaseItemKind.AudioBook) {
        return isPlayed ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
    }
    return isPlayed ? globalize.translate('Played') : globalize.translate('MarkPlayed');
};

const PlayedButton: FC<PlayedButtonProps> = ({ className, isPlayed = false, itemId, itemType }) => {
    const queryClient = useQueryClient();
    const { user } = useApi();
    const { mutateAsync } = useTogglePlayedMutation();

    const onClick = useCallback(async () => {
        if (!itemId) return;

        const optimistic = !isPlayed;
        updateItemUserDataCache(queryClient, user?.Id, itemId, { Played: optimistic });

        try {
            const confirmed = await mutateAsync({ itemId, isPlayed });
            if (typeof confirmed === 'boolean') {
                updateItemUserDataCache(queryClient, user?.Id, itemId, { Played: confirmed });
            } else {
                await queryClient.invalidateQueries({ queryKey: [ 'Items' ], exact: false, refetchType: 'active' });
            }
        } catch (e) {
            console.error('[ExpPlayedButton] toggle failed', e);
            await queryClient.invalidateQueries({ queryKey: [ 'Items' ], exact: false, refetchType: 'active' });
        }
    }, [isPlayed, itemId, mutateAsync, queryClient, user?.Id]);

    return (
        <IconButton
            className={className}
            aria-label={getTitle(itemType, isPlayed)}
            onClick={onClick}
            icon={<SvgIcon svg={IconSvgs.checkmark} size={20} style={{ color: isPlayed ? '#4ade80' : undefined }} />}
        />
    );
};

export default PlayedButton;
