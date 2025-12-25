import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import React, { type FC, useCallback } from 'react';

import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItemsViewByType } from 'hooks/useFetchItems';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import Loading from 'components/loading/LoadingComponent';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import NoItemsMessage from 'components/common/NoItemsMessage';
import { LibraryTab } from 'types/libraryTab';
import { type LibraryViewSettings, type ParentId } from 'types/library';
import { useItem } from 'hooks/useItem';
import type { ItemDto } from 'types/base/models/item-dto';

import { LibraryViewMenu } from 'apps/experimental/components/library/LibraryViewMenu';
import { SortMenu } from 'apps/experimental/components/library/SortMenu';
import { FilterMenu } from 'apps/experimental/components/library/FilterMenu';
import { Pagination } from 'apps/experimental/components/library/Pagination';
import { PlayAllButton, ShuffleButton, NewCollectionButton } from 'apps/experimental/components/library/ActionButtons';
import styles from 'apps/experimental/components/library/LibraryToolbar.module.scss';

import { ItemGrid } from 'apps/experimental/components/media/ItemGrid';

import AlphabetPicker from './AlphabetPicker';

interface ItemsViewProps {
    viewType: LibraryTab;
    parentId: ParentId;
    itemType: BaseItemKind[];
    collectionType?: CollectionType;
    isPaginationEnabled?: boolean;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage: string;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType,
    parentId,
    collectionType,
    isPaginationEnabled = true,
    isBtnPlayAllEnabled = false,
    isBtnShuffleEnabled = false,
    isBtnSortEnabled = true,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isAlphabetPickerEnabled = true,
    itemType,
    noItemsMessage
}) => {
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(viewType, parentId),
            getDefaultLibraryViewSettings(viewType)
        );

    const {
        isPending,
        data: itemsResult,
        isPlaceholderData,
        refetch
    } = useGetItemsViewByType(
        viewType,
        parentId,
        itemType,
        libraryViewSettings
    );
    const { data: item } = useItem(parentId || undefined);

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const onAfterAction = useCallback(() => {
        void refetch();
    }, [refetch]);

    const onToggleFavorite = useCallback(async (cardItem: ItemDto) => {
        await toggleFavorite({ itemId: cardItem.Id!, isFavorite: !!cardItem.UserData?.IsFavorite });
        onAfterAction();
    }, [onAfterAction, toggleFavorite]);

    const onTogglePlayed = useCallback(async (cardItem: ItemDto) => {
        await togglePlayed({ itemId: cardItem.Id!, isPlayed: !!cardItem.UserData?.Played });
        onAfterAction();
    }, [onAfterAction, togglePlayed]);

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );
    const hasSortName = libraryViewSettings.SortBy.includes(ItemSortBy.SortName);

    // Determine card variant based on content type
    const getCardVariant = () => {
        if ([LibraryTab.Episodes].includes(viewType)) {
            return 'landscape';
        }
        return 'portrait';
    };

    const cardVariant = getCardVariant();

    return (
        <div className="padded-bottom-page">
            {/* Toolbar */}
            <div className={styles.toolbar}>
                {/* Tab bar */}
                <div className={styles.tabBar}>
                    <LibraryViewMenu />
                </div>
                <div className={styles.tertiaryControls}>
                    <div className={styles.listButtons}>
                        {isBtnFilterEnabled && (
                            <FilterMenu
                                parentId={parentId}
                                itemType={itemType}
                                viewType={viewType}
                                hasFilters={hasFilters}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}

                        {isBtnSortEnabled && (
                            <SortMenu
                                viewType={viewType}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}

                        {!isPending && (
                            <>
                                {isBtnPlayAllEnabled && (
                                    <PlayAllButton
                                        item={item}
                                        items={items}
                                        viewType={viewType}
                                        hasFilters={hasFilters}
                                        libraryViewSettings={libraryViewSettings}
                                    />
                                )}

                                {isBtnShuffleEnabled && totalRecordCount > 1 && (
                                    <ShuffleButton
                                        item={item}
                                        items={items}
                                        viewType={viewType}
                                        hasFilters={hasFilters}
                                        libraryViewSettings={libraryViewSettings}
                                    />
                                )}

                                {isBtnNewCollectionEnabled && <NewCollectionButton />}
                            </>
                        )}

                    </div>

                    <div className={styles.pagination}>
                        {!isPending && isPaginationEnabled && (
                            <Pagination
                                totalRecordCount={totalRecordCount}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                                isPlaceholderData={isPlaceholderData}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Alphabet picker */}
            {isAlphabetPickerEnabled && hasSortName && (
                <AlphabetPicker
                    libraryViewSettings={libraryViewSettings}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            )}

            {/* Content */}
            {isPending ? (
                <Loading />
            ) : (
                <ItemsContainer
                    className="padded-left padded-right"
                    parentId={parentId}
                    reloadItems={refetch}
                    queryKey={['ItemsViewByType']}
                >
                    {!items.length ? (
                        <NoItemsMessage message={noItemsMessage} />
                    ) : (
                        <ItemGrid
                            items={items}
                            variant={cardVariant}
                            onToggleFavorite={onToggleFavorite}
                            onTogglePlayed={onTogglePlayed}
                            onAfterAction={onAfterAction}
                        />
                    )}
                </ItemsContainer>
            )}

            {/* Bottom pagination */}
            {!isPending && isPaginationEnabled && totalRecordCount > 100 && (
                <div className="padded-left padded-right" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                        isPlaceholderData={isPlaceholderData}
                    />
                </div>
            )}
        </div>
    );
};

export default ItemsView;
