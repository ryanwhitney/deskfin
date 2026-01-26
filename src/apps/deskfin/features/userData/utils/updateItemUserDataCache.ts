import type { QueryClient } from '@tanstack/react-query';

import type { ItemDto } from 'types/base/models/item-dto';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

type UserDataPatch = Partial<NonNullable<ItemDto['UserData']>>;

const patchItem = (item: ItemDto, patch: UserDataPatch): ItemDto => {
    return {
        ...item,
        UserData: {
            ...(item.UserData ?? {}),
            ...patch
        }
    };
};

/**
 * Best-effort “realtime” update:
 * - Updates the `useItem` cache entry: ['User', userId, 'Items', itemId]
 * - Updates any `useGetItems` list caches: ['Items', { ... }]
 *
 * This avoids relying on callers to pass the right query keys.
 */
export function updateItemUserDataCache(
    queryClient: QueryClient,
    userId: string | undefined,
    itemId: string,
    patch: UserDataPatch
) {
    if (!itemId) return;

    // 1) Details item cache
    if (userId) {
        queryClient.setQueryData<ItemDto | undefined>(
            [ 'User', userId, 'Items', itemId ],
            (old) => (old ? patchItem(old, patch) : old)
        );
    }

    // 2) Any lists that include this item
    queryClient.setQueriesData<ItemDtoQueryResult | undefined>(
        { queryKey: [ 'Items' ], exact: false },
        (old) => {
            if (!old?.Items?.length) return old;
            const idx = old.Items.findIndex(i => i?.Id === itemId);
            if (idx < 0) return old;

            const nextItems = old.Items.slice();
            const existing = nextItems[idx] as ItemDto;
            nextItems[idx] = patchItem(existing, patch);

            return {
                ...old,
                Items: nextItems
            };
        }
    );
}

