import React, { type FC, type ReactNode } from "react";
import type { ItemDto } from "types/base/models/item-dto";
import { MediaCard, type MediaCardVariant } from "./MediaCard";
import { useApi } from "hooks/useApi";
import {
    buildCardImageUrl,
    getCardMeta,
    getProgressPct,
    getOverlayCount,
} from "apps/deskfin/features/home/utils/cardHelpers";
import Loading from "components/loading/LoadingComponent";
import globalize from "lib/globalize";

import styles from "./ItemGrid.module.scss";

export type ItemGridVariant = "portrait" | "landscape" | "square" | "banner";

export interface ItemGridProps {
    items: ItemDto[];
    variant?: ItemGridVariant;
    scrollable?: boolean;
    isLoading?: boolean;
    emptyMessage?: string;
    onToggleFavorite?: (item: ItemDto) => void;
    onTogglePlayed?: (item: ItemDto) => void;
    onAfterAction?: () => void;
    className?: string;
    children?: ReactNode;
    playlistContext?: {
        playlistId: string;
        playlistName: string;
    };
}

export const ItemGrid: FC<ItemGridProps> = ({
    items,
    variant = "portrait",
    scrollable = false,
    isLoading = false,
    emptyMessage,
    onToggleFavorite,
    onTogglePlayed,
    onAfterAction,
    className,
    children,
    playlistContext,
}) => {
    const { user } = useApi();

    // Map variant to MediaCard variant
    const cardVariant: MediaCardVariant =
        variant === "landscape" || variant === "banner"
            ? "landscape"
            : "portrait";

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <Loading />
            </div>
        );
    }

    if (!items.length && emptyMessage) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyText}>
                    {globalize.translate(emptyMessage) || emptyMessage}
                </div>
            </div>
        );
    }

    // If custom children are provided, use them
    if (children) {
        if (scrollable) {
            return (
                <div
                    className={[styles.scrollContainer, className]
                        .filter(Boolean)
                        .join(" ")}
                >
                    <div className={styles.scrollRow}>{children}</div>
                </div>
            );
        }

        return (
            <div className={styles.gridContainer}>
                <div
                    className={[styles.grid, className].filter(Boolean).join(" ")}
                    data-variant={variant}
                >
                    {children}
                </div>
            </div>
        );
    }

    // Default rendering with MediaCard
    const handleToggleFavorite = onToggleFavorite || (() => {});
    const handleTogglePlayed = onTogglePlayed || (() => {});
    const handleAfterAction = onAfterAction || (() => {});

    const renderCards = () =>
        items.map((item) => {
            const meta = getCardMeta(item);
            const imageUrl = buildCardImageUrl(item, { variant: cardVariant });
            const progressPct = getProgressPct(item);
            const overlayCount = getOverlayCount(item);

            return (
                <MediaCard
                    key={item.Id}
                    item={item}
                    user={user}
                    variant={cardVariant}
                    imageUrl={imageUrl}
                    title={meta.title}
                    titleHref={meta.titleHref}
                    subtitle={meta.subtitle}
                    subtitleHref={meta.subtitleHref}
                    progressPct={progressPct}
                    overlayCount={overlayCount}
                    onToggleFavorite={handleToggleFavorite}
                    onTogglePlayed={handleTogglePlayed}
                    onAfterAction={handleAfterAction}
                    playlistContext={playlistContext}
                />
            );
        });

    if (scrollable) {
        return (
            <div
                className={[styles.scrollContainer, className]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className={styles.scrollRow}>{renderCards()}</div>
            </div>
        );
    }

    return (
        <div className={styles.gridContainer}>
            <div
                className={[styles.grid, className].filter(Boolean).join(" ")}
                data-variant={variant}
            >
                {renderCards()}
            </div>
        </div>
    );
};

export default ItemGrid;
