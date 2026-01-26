import type { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import type { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import React, { type FC, useCallback } from "react";

import { useLocalStorage } from "hooks/useLocalStorage";
import {
    useGetItemsViewByType,
    useToggleFavoriteMutation,
    useTogglePlayedMutation,
} from "hooks/useFetchItems";
import { useApi } from "hooks/useApi";
import { getDefaultLibraryViewSettings, getSettingsKey } from "utils/items";
import Loading from "components/loading/LoadingComponent";
import ItemsContainer from "elements/emby-itemscontainer/ItemsContainer";
import NoItemsMessage from "components/common/NoItemsMessage";
import { LibraryTab } from "types/libraryTab";
import { type LibraryViewSettings, type ParentId } from "types/library";
import { useItem } from "hooks/useItem";
import type { ItemDto } from "types/base/models/item-dto";

import { SortMenu } from "apps/deskfin/components/library/SortMenu";
import { FilterMenu } from "apps/deskfin/components/library/FilterMenu";
import {
    PlayAllButton,
    ShuffleButton,
    NewCollectionButton,
} from "apps/deskfin/components/library/ActionButtons";
import styles from "apps/deskfin/components/library/LibraryToolbar.module.scss";

import { MediaCard } from "apps/deskfin/components/media/MediaCard";
import {
    buildCardImageUrl,
    getCardMeta,
    getProgressPct,
    getOverlayCount,
} from "apps/deskfin/features/home/utils/cardHelpers";

interface ItemsViewProps {
    viewType: LibraryTab;
    parentId: ParentId;
    itemType: BaseItemKind[];
    collectionType?: CollectionType;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    noItemsMessage: string;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType,
    parentId,
    isBtnPlayAllEnabled = false,
    isBtnShuffleEnabled = false,
    isBtnSortEnabled = true,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    itemType,
    noItemsMessage,
}) => {
    const { user } = useApi();
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(viewType, parentId),
            getDefaultLibraryViewSettings(viewType)
        );

    const {
        isPending,
        data: itemsResult,
        refetch,
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

    const onToggleFavorite = useCallback(
        async (cardItem: ItemDto) => {
            await toggleFavorite({
                itemId: cardItem.Id!,
                isFavorite: !!cardItem.UserData?.IsFavorite,
            });
            onAfterAction();
        },
        [onAfterAction, toggleFavorite]
    );

    const onTogglePlayed = useCallback(
        async (cardItem: ItemDto) => {
            await togglePlayed({
                itemId: cardItem.Id!,
                isPlayed: !!cardItem.UserData?.Played,
            });
            onAfterAction();
        },
        [onAfterAction, togglePlayed]
    );

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );

    // Determine card variant based on content type
    const getCardVariant = () => {
        if ([LibraryTab.Episodes].includes(viewType)) {
            return "landscape";
        }
        return "portrait";
    };

    const cardVariant = getCardVariant();

    return (
        <>
            {isPending ? (
                <Loading />
            ) : (
                <ItemsContainer
                    parentId={parentId}
                    reloadItems={refetch}
                    queryKey={["ItemsViewByType"]}
                >
                    <div className={styles.gridContainer}>
                        {/* Header: count on left, all actions on right */}
                        <div className={styles.gridHeader}>
                            <div className={styles.itemCount}>
                                {totalRecordCount}{" "}
                                {totalRecordCount === 1 ? "item" : "items"}
                            </div>
                            <div className={styles.gridActions}>
                                {isBtnPlayAllEnabled && items.length > 0 && (
                                    <PlayAllButton
                                        item={item}
                                        items={items}
                                        viewType={viewType}
                                        hasFilters={hasFilters}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                    />
                                )}
                                {isBtnShuffleEnabled &&
                                    totalRecordCount > 1 && (
                                        <ShuffleButton
                                            item={item}
                                            items={items}
                                            viewType={viewType}
                                            hasFilters={hasFilters}
                                            libraryViewSettings={
                                                libraryViewSettings
                                            }
                                        />
                                    )}
                                {isBtnNewCollectionEnabled && (
                                    <NewCollectionButton />
                                )}
                                {isBtnFilterEnabled && (
                                    <FilterMenu
                                        parentId={parentId}
                                        itemType={itemType}
                                        viewType={viewType}
                                        hasFilters={hasFilters}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                        setLibraryViewSettings={
                                            setLibraryViewSettings
                                        }
                                    />
                                )}
                                {isBtnSortEnabled && (
                                    <SortMenu
                                        viewType={viewType}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                        setLibraryViewSettings={
                                            setLibraryViewSettings
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        {/* Grid or empty message */}
                        {!items.length ? (
                            <NoItemsMessage message={noItemsMessage} />
                        ) : (
                            <div
                                className={styles.grid}
                                data-variant={cardVariant}
                            >
                                {items.map((cardItem) => (
                                    <MediaCard
                                        key={cardItem.Id}
                                        item={cardItem}
                                        user={user}
                                        variant={cardVariant}
                                        imageUrl={buildCardImageUrl(cardItem, {
                                            variant: cardVariant,
                                        })}
                                        title={getCardMeta(cardItem).title}
                                        titleHref={
                                            getCardMeta(cardItem).titleHref
                                        }
                                        subtitle={
                                            getCardMeta(cardItem).subtitle
                                        }
                                        subtitleHref={
                                            getCardMeta(cardItem).subtitleHref
                                        }
                                        progressPct={getProgressPct(cardItem)}
                                        overlayCount={getOverlayCount(cardItem)}
                                        onToggleFavorite={onToggleFavorite}
                                        onTogglePlayed={onTogglePlayed}
                                        onAfterAction={onAfterAction}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ItemsContainer>
            )}
        </>
    );
};

export default ItemsView;
