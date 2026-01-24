import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ImageType } from "@jellyfin/sdk/lib/generated-client/models/image-type";
import { ItemFields } from "@jellyfin/sdk/lib/generated-client/models/item-fields";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by";
import { SortOrder } from "@jellyfin/sdk/lib/generated-client/models/sort-order";

import globalize from "lib/globalize";
import Page from "components/Page";
import Cards from "components/cardbuilder/Card/Cards";
import { useItem } from "hooks/useItem";
import { useApi } from "hooks/useApi";
import { useGetItems } from "hooks/useFetchItems";
import { useTitle } from "apps/experimental/utils/useTitle";
import { formatItemTitle } from "apps/experimental/utils/titleUtils";
import { CardShape } from "utils/card";
import { ItemKind } from "types/base/models/item-kind";

import FavoriteButton from "apps/experimental/features/userData/components/FavoriteButton";
import PlayedButton from "apps/experimental/features/userData/components/PlayedButton";
import PlayOrResumeButton from "../components/buttons/PlayOrResumeButton";
import { DetailsFacts } from "../components/ui/DetailsFacts";
import { DetailsCast } from "../components/ui/DetailsCast";
import { SeasonsSection } from "../components/ui/SeasonsSection";
import { EpisodesSection } from "../components/ui/EpisodesSection";
import { DetailsMoreMenu } from "../components/ui/DetailsMoreMenu";
import MetaInfo from "../components/ui/MetaInfo";
import { buildImageUrl } from "../utils/imageUrl";

import styles from "./DetailsRoute.module.scss";

export default function DetailsPage() {
    const [params] = useSearchParams();
    const itemId = params.get("id") || "";

    const { user } = useApi();
    const { data: item, isLoading, error } = useItem(itemId);

    // For episodes/seasons, fetch related items for fallback images
    const seriesId = (item as any)?.SeriesId as string | undefined;
    const seasonId = (item as any)?.SeasonId as string | undefined;
    const { data: seriesItem } = useItem(seriesId);
    const { data: seasonItem } = useItem(seasonId);

    // Extract names for title formatting and breadcrumbs
    const seriesName = (item as any)?.SeriesName as string | undefined;
    const seasonName = (item as any)?.SeasonName as string | undefined;

    // Set title with proper formatting for episodes/seasons
    useTitle(
        item
            ? formatItemTitle(item.Name, item.Type, seriesName, seasonName)
            : undefined,
    );

    // Build image URLs with fallback chain
    const primaryUrl = useMemo(
        () =>
            buildImageUrl(item, "Primary", 600) ||
            buildImageUrl(seasonItem, "Primary", 600) ||
            buildImageUrl(seriesItem, "Primary", 600),
        [item, seasonItem, seriesItem],
    );

    const backdropUrl = useMemo(
        () =>
            buildImageUrl(item, "Backdrop", 1400) ||
            buildImageUrl(seasonItem, "Backdrop", 1400) ||
            buildImageUrl(seriesItem, "Backdrop", 1400) ||
            buildImageUrl(item, "Primary", 1400) ||
            buildImageUrl(seasonItem, "Primary", 1400) ||
            buildImageUrl(seriesItem, "Primary", 1400),
        [item, seasonItem, seriesItem],
    );

    const queryKey = useMemo(
        () =>
            user?.Id ? ["User", user.Id, "Items", itemId] : ["Items", itemId],
        [user?.Id, itemId],
    );

    // Determine item type
    const itemType = item?.Type;
    const isSeries = itemType === ItemKind.Series;
    const isSeason = itemType === ItemKind.Season;
    const isBoxSet = itemType === ItemKind.BoxSet;

    // Fetch seasons for series
    const { data: seasonsResult } = useGetItems(
        {
            parentId: itemId,
            includeItemTypes: [BaseItemKind.Season],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            enableTotalRecordCount: false,
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary],
        },
        { enabled: !!item?.Id && isSeries },
    );

    // Fetch episodes for season
    const { data: episodesResult } = useGetItems(
        {
            parentId: itemId,
            includeItemTypes: [BaseItemKind.Episode],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            enableTotalRecordCount: false,
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary],
            fields: [ItemFields.Overview],
        },
        { enabled: !!item?.Id && isSeason },
    );

    // Fetch BoxSet items
    const { data: boxSetItemsResult, isPending: isBoxSetItemsPending } =
        useGetItems(
            {
                parentId: itemId,
                limit: 200,
                enableTotalRecordCount: false,
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.MediaSourceCount,
                    ItemFields.Overview,
                ],
            },
            { enabled: !!item?.Id && isBoxSet },
        );

    const seasons = seasonsResult?.Items || [];
    const episodes = episodesResult?.Items || [];
    const boxSetItems = boxSetItemsResult?.Items || [];

    // Loading state
    if (isLoading) {
        return <Page id="itemDetailsPage" className={styles.page} />;
    }

    // Error state
    if (error || !item) {
        return (
            <Page id="itemDetailsPage" className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.error}>
                        {globalize.tryTranslate?.("Error") ?? "Error"}
                    </div>
                </div>
            </Page>
        );
    }

    // Extract people data
    const people = item.People || [];
    const directors = people.filter((p) => p.Type === "Director");
    const writers = people.filter((p) => p.Type === "Writer");
    const castAndCrew = people.filter((p) => p.Type !== "GuestStar");
    const guestStars = people.filter((p) => p.Type === "GuestStar");

    // Series/Season breadcrumb data (variables declared above for title formatting)

    const isPlayed = !!item.UserData?.Played;
    const isFavorite = !!item.UserData?.IsFavorite;

    return (
        <Page
            id="itemDetailsPage"
            className={`${styles.page} selfBackdropPage`}
            backDropType="movie,series,book"
        >
            <div>
                <div className={styles.heroContainer}>
                    <div className={styles.hero}>
                        <div
                            className={styles.heroImg}
                            style={{
                                backgroundImage: backdropUrl
                                    ? `url(${backdropUrl})`
                                    : undefined,
                            }}
                        >
                            {" "}
                            <div className={styles.heroOverlay} />
                        </div>
                        <div className={styles.container}>
                            <div className={styles.top}>
                                <div className={styles.poster}>
                                    {primaryUrl ? (
                                        <img
                                            src={primaryUrl}
                                            alt={item.Name || ""}
                                            className={styles.posterImg}
                                        />
                                    ) : null}
                                </div>
                                <div className={styles.heroInfo}>
                                    <h1 className={styles.title}>
                                        {item.ImageTags?.Logo ? (
                                            <img
                                                src={buildImageUrl(
                                                    item,
                                                    "Logo",
                                                    800,
                                                )}
                                                width={400}
                                                alt={
                                                    item.Name || "series title"
                                                }
                                                className={styles.titleLogo}
                                            />
                                        ) : (
                                            item.Name
                                        )}
                                    </h1>

                                    {/* Breadcrumbs for episodes */}
                                    {(seriesName || seasonName) && (
                                        <div className={styles.breadcrumbs}>
                                            {seriesId && seriesName ? (
                                                <a
                                                    href={`#/details?id=${seriesId}`}
                                                    className={
                                                        styles.breadcrumbLink
                                                    }
                                                >
                                                    {seriesName}
                                                </a>
                                            ) : seriesName ? (
                                                <span
                                                    className={
                                                        styles.breadcrumbText
                                                    }
                                                >
                                                    {seriesName}
                                                </span>
                                            ) : null}
                                            {seriesName && seasonName && (
                                                <span
                                                    className={
                                                        styles.breadcrumbSep
                                                    }
                                                >
                                                    /
                                                </span>
                                            )}
                                            {seasonId && seasonName ? (
                                                <a
                                                    href={`#/details?id=${seasonId}`}
                                                    className={
                                                        styles.breadcrumbLink
                                                    }
                                                >
                                                    {seasonName}
                                                </a>
                                            ) : seasonName ? (
                                                <span
                                                    className={
                                                        styles.breadcrumbText
                                                    }
                                                >
                                                    {seasonName}
                                                </span>
                                            ) : null}
                                        </div>
                                    )}

                                    {item.OriginalTitle &&
                                        item.OriginalTitle !== item.Name && (
                                            <div
                                                className={styles.originalTitle}
                                            >
                                                {item.OriginalTitle}
                                            </div>
                                        )}

                                    <MetaInfo item={item} />

                                    {item.Overview && (
                                        <p className={styles.overview}>
                                            {item.Overview}
                                        </p>
                                    )}

                                    <div className={styles.actions}>
                                        <PlayOrResumeButton
                                            item={item}
                                            isResumable={
                                                !!item.UserData
                                                    ?.PlaybackPositionTicks
                                            }
                                        />
                                        <PlayedButton
                                            isPlayed={isPlayed}
                                            itemId={item.Id}
                                            itemType={item.Type}
                                        />
                                        <FavoriteButton
                                            isFavorite={isFavorite}
                                            itemId={item.Id}
                                        />
                                        <DetailsMoreMenu
                                            item={item}
                                            queryKey={queryKey}
                                        />
                                    </div>

                                    <DetailsFacts
                                        item={item}
                                        directors={directors}
                                        writers={writers}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.container}>
                    {/* Series: show seasons */}
                    {isSeries && <SeasonsSection seasons={seasons} />}

                    {/* Season: show episodes */}
                    {isSeason && (
                        <EpisodesSection
                            episodes={episodes}
                            queryKey={[...queryKey, "SeasonEpisodes"]}
                            showSeriesAndSeason={false}
                        />
                    )}

                    {/* BoxSet: show items */}
                    {isBoxSet && (
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                {globalize.tryTranslate?.("Items") ?? "Items"}
                            </h2>
                            {isBoxSetItemsPending ? null : boxSetItems.length ? (
                                <div className={styles.itemsGrid}>
                                    <Cards
                                        items={boxSetItems}
                                        cardOptions={{
                                            shape: CardShape.PortraitOverflow,
                                            context: "movies",
                                            showTitle: true,
                                            showYear: true,
                                            centerText: true,
                                            coverImage: true,
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className={styles.meta}>
                                    No items available
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cast & Crew section */}
                    <DetailsCast
                        title={globalize.translate("HeaderCastAndCrew")}
                        people={castAndCrew}
                    />

                    {/* Guest Stars section */}
                    <DetailsCast
                        title={globalize.translate("HeaderGuestCast")}
                        people={guestStars}
                    />
                </div>
            </div>
        </Page>
    );
}
