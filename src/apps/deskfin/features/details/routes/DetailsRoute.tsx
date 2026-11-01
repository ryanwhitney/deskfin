import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import globalize from 'lib/globalize';
import Page from 'components/Page';
import { useItem } from 'hooks/useItem';
import { useApi } from 'hooks/useApi';
import {
    useToggleFavoriteMutation,
    useTogglePlayedMutation
} from 'hooks/useFetchItems';
import { useGetItems } from 'apps/deskfin/hooks/api/useGetItems';
import { useTitle } from 'apps/deskfin/hooks/useTitle';
import { formatItemTitle } from 'apps/deskfin/utils/titleUtils';
import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemCrumb } from 'apps/deskfin/components/breadcrumb/ItemCrumb';
import { ItemGrid } from 'apps/deskfin/components/media/ItemGrid';

import FavoriteButton from 'apps/deskfin/features/userData/components/FavoriteButton';
import PlayedButton from 'apps/deskfin/features/userData/components/PlayedButton';
import PlayOrResumeButton from '../components/buttons/PlayOrResumeButton';
import { DetailsFacts } from '../components/ui/DetailsFacts';
import { DetailsCast } from '../components/ui/DetailsCast';
import { SeasonsSection } from '../components/ui/SeasonsSection';
import { EpisodesSection } from '../components/ui/EpisodesSection';
import { ExtrasSection } from '../components/ui/ExtrasSection';
import { DetailsMoreMenu } from '../components/ui/DetailsMoreMenu';
import { ExpandableOverview } from '../components/ui/ExpandableOverview';
import MetaInfo from '../components/ui/MetaInfo';
import { buildImageUrl } from '../utils/imageUrl';
import { useSpecialFeatures } from '../hooks/useSpecialFeatures';

import styles from './DetailsRoute.module.scss';
import { translateOr } from 'apps/deskfin/utils/translate';

/** A titled grid of items (collection contents, a person's movies or shows). */
const GridSection = ({ title, items, isLoading, emptyMessage, onToggleFavorite, onTogglePlayed }: {
    title: string;
    items: ItemDto[];
    isLoading: boolean;
    emptyMessage: string;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
}) => (
    <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <ItemGrid
            aria-label={title}
            items={items}
            variant='portrait'
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            onToggleFavorite={onToggleFavorite}
            onTogglePlayed={onTogglePlayed}
        />
    </div>
);

const crumbClasses = { linkClassName: styles.breadcrumbLink, textClassName: styles.breadcrumbText };

/** "Series / Season" above an episode or season title. */
const DetailsBreadcrumbs = ({ seriesId, seriesName, seasonId, seasonName }: {
    seriesId?: string;
    seriesName?: string;
    seasonId?: string;
    seasonName?: string;
}) => {
    if (!seriesName && !seasonName) return null;
    return (
        <div className={styles.breadcrumbs}>
            <ItemCrumb {...crumbClasses} itemId={seriesId} name={seriesName} />
            {seriesName && seasonName && <span className={styles.breadcrumbSep}>/</span>}
            <ItemCrumb {...crumbClasses} itemId={seasonId} name={seasonName} />
        </div>
    );
};

export default function DetailsPage() {
    const [params] = useSearchParams();
    const itemId = params.get('id') || '';

    const { user } = useApi();
    const { data: item, isLoading, error } = useItem(itemId);

    // For episodes/seasons, fetch related items for fallback images
    const seriesId = item?.SeriesId ?? undefined;
    const seasonId = item?.SeasonId ?? undefined;
    const { data: seriesItem } = useItem(seriesId);
    const { data: seasonItem } = useItem(seasonId);

    // Extract names for title formatting and breadcrumbs
    const seriesName = item?.SeriesName ?? undefined;
    const seasonName = item?.SeasonName ?? undefined;

    // Set title with proper formatting for episodes/seasons
    useTitle(
        item ?
            formatItemTitle(item.Name, item.Type, seriesName, seasonName) :
            undefined
    );

    // Build image URLs with fallback chain
    const primaryUrl = useMemo(
        () =>
            buildImageUrl(item, 'Primary', 600)
            || buildImageUrl(seasonItem, 'Primary', 600)
            || buildImageUrl(seriesItem, 'Primary', 600),
        [item, seasonItem, seriesItem]
    );

    const backdropUrl = useMemo(
        () =>
            buildImageUrl(item, 'Backdrop', 1400)
            || buildImageUrl(seasonItem, 'Backdrop', 1400)
            || buildImageUrl(seriesItem, 'Backdrop', 1400)
            || buildImageUrl(item, 'Primary', 1400)
            || buildImageUrl(seasonItem, 'Primary', 1400)
            || buildImageUrl(seriesItem, 'Primary', 1400),
        [item, seasonItem, seriesItem]
    );

    const queryKey = useMemo(
        () =>
            user?.Id ? ['User', user.Id, 'Items', itemId] : ['Items', itemId],
        [user?.Id, itemId]
    );

    // Determine item type
    const itemType = item?.Type;
    const isSeries = itemType === ItemKind.Series;
    const isSeason = itemType === ItemKind.Season;
    const isBoxSet = itemType === ItemKind.BoxSet;
    const isPerson = itemType === ItemKind.Person;

    // Fetch seasons for series
    const { data: seasonsResult } = useGetItems(
        {
            parentId: itemId,
            includeItemTypes: [BaseItemKind.Season],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
            enableTotalRecordCount: false,
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary]
        },
        { enabled: !!item?.Id && isSeries }
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
            fields: [ItemFields.Overview]
        },
        { enabled: !!item?.Id && isSeason }
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
                    ItemFields.Overview
                ]
            },
            { enabled: !!item?.Id && isBoxSet }
        );

    // Fetch movies for person
    const { data: personMoviesResult, isPending: isPersonMoviesPending } =
        useGetItems(
            {
                personIds: itemId ? [itemId] : undefined,
                recursive: true,
                includeItemTypes: [BaseItemKind.Movie],
                sortBy: [ItemSortBy.PremiereDate, ItemSortBy.SortName],
                sortOrder: [SortOrder.Descending, SortOrder.Ascending],
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.MediaSourceCount
                ],
                imageTypeLimit: 1,
                enableImageTypes: [ImageType.Primary]
            },
            { enabled: !!item?.Id && isPerson }
        );

    // Fetch TV shows for person
    const { data: personShowsResult, isPending: isPersonShowsPending } =
        useGetItems(
            {
                personIds: itemId ? [itemId] : undefined,
                recursive: true,
                includeItemTypes: [BaseItemKind.Series],
                sortBy: [ItemSortBy.PremiereDate, ItemSortBy.SortName],
                sortOrder: [SortOrder.Descending, SortOrder.Ascending],
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.MediaSourceCount
                ],
                imageTypeLimit: 1,
                enableImageTypes: [ImageType.Primary]
            },
            { enabled: !!item?.Id && isPerson }
        );

    const seasons = seasonsResult?.Items || [];
    const episodes = episodesResult?.Items || [];
    const boxSetItems = boxSetItemsResult?.Items || [];
    const personMovies = personMoviesResult?.Items || [];
    const personShows = personShowsResult?.Items || [];

    // Fetch special features/extras
    const hasExtras = (item?.SpecialFeatureCount ?? 0) > 0;
    const { data: extras = [] } = useSpecialFeatures(
        item?.Id,
        hasExtras && !isPerson
    );

    // Mutations for ItemGrid actions
    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const handleToggleFavorite = useCallback(
        (targetItem: (typeof boxSetItems)[0]) => {
            void toggleFavorite({
                itemId: targetItem.Id!,
                isFavorite: !!targetItem.UserData?.IsFavorite
            });
        },
        [toggleFavorite]
    );

    const handleTogglePlayed = useCallback(
        (targetItem: (typeof boxSetItems)[0]) => {
            void togglePlayed({
                itemId: targetItem.Id!,
                isPlayed: !!targetItem.UserData?.Played
            });
        },
        [togglePlayed]
    );

    // Loading state
    if (isLoading) {
        return <Page id='itemDetailsPage' className={styles.page} />;
    }

    // Error state
    if (error || !item) {
        return (
            <Page id='itemDetailsPage' className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.error}>
                        Error
                    </div>
                </div>
            </Page>
        );
    }

    // Extract people data
    const people = item.People || [];
    const directors = people.filter((p) => p.Type === 'Director');
    const writers = people.filter((p) => p.Type === 'Writer');
    const cast = people.filter((p) => p.Type === 'Actor');
    const crew = people.filter(
        (p) => p.Type !== 'Actor' && p.Type !== 'GuestStar'
    );
    const guestStars = people.filter((p) => p.Type === 'GuestStar');

    // Series/Season breadcrumb data (variables declared above for title formatting)

    const isPlayed = !!item.UserData?.Played;
    const isFavorite = !!item.UserData?.IsFavorite;

    return (
        <Page
            id='itemDetailsPage'
            className={`${styles.page} ${isPerson ? styles.personPage : ''} ${itemType?.toLowerCase()} selfBackdropPage`}
            backDropType={[BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Book]}
        >
            <div>
                <div className={styles.heroContainer}>
                    <div className={styles.hero}>
                        <div
                            className={styles.heroImg}
                            style={{
                                backgroundImage: backdropUrl ?
                                    `url(${backdropUrl})` :
                                    undefined
                            }}
                        >
                            {' '}
                            <div className={styles.heroOverlay} />
                        </div>
                        <div className={styles.container}>
                            <div className={styles.top}>
                                <div className={styles.poster}>
                                    {primaryUrl ? (
                                        <img
                                            src={primaryUrl}
                                            alt='' // the title is the page heading
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
                                                    'Logo',
                                                    800
                                                )}
                                                width={400}
                                                alt={
                                                    item.Name || 'series title'
                                                }
                                                className={styles.titleLogo}
                                            />
                                        ) : (
                                            item.Name
                                        )}
                                    </h1>

                                    {/* Breadcrumbs for episodes */}
                                    <DetailsBreadcrumbs
                                        seriesId={seriesId}
                                        seriesName={seriesName}
                                        seasonId={seasonId}
                                        seasonName={seasonName}
                                    />

                                    {item.OriginalTitle
                                        && item.OriginalTitle !== item.Name && (
                                        <div
                                            className={styles.originalTitle}
                                        >
                                            {item.OriginalTitle}
                                        </div>
                                    )}

                                    <MetaInfo item={item} />

                                    {item.Overview && (
                                        <ExpandableOverview
                                            text={item.Overview}
                                        />
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
                            queryKey={[...queryKey, 'SeasonEpisodes']}
                            showSeriesAndSeason={false}
                        />
                    )}

                    {/* BoxSet: show items */}
                    {isBoxSet && (
                        <GridSection
                            title={translateOr('Items', 'Items')}
                            items={boxSetItems}
                            isLoading={isBoxSetItemsPending}
                            emptyMessage='No items available'
                            onToggleFavorite={handleToggleFavorite}
                            onTogglePlayed={handleTogglePlayed}
                        />
                    )}

                    {/* Person: show movies */}
                    {isPerson && personMovies.length > 0 && (
                        <GridSection
                            title={globalize.translate('Movies')}
                            items={personMovies}
                            isLoading={isPersonMoviesPending}
                            emptyMessage='No movies available'
                            onToggleFavorite={handleToggleFavorite}
                            onTogglePlayed={handleTogglePlayed}
                        />
                    )}

                    {/* Person: show TV shows */}
                    {isPerson && personShows.length > 0 && (
                        <GridSection
                            title={globalize.translate('Shows')}
                            items={personShows}
                            isLoading={isPersonShowsPending}
                            emptyMessage='No shows available'
                            onToggleFavorite={handleToggleFavorite}
                            onTogglePlayed={handleTogglePlayed}
                        />
                    )}

                    {/* Extras, cast and crew (not for Person items) */}
                    {!isPerson && (
                        <>
                            {extras.length > 0 && <ExtrasSection extras={extras} />}
                            <DetailsCast title='Cast' people={cast} />
                            <DetailsCast
                                title={globalize.translate('HeaderGuestCast')}
                                people={guestStars}
                            />
                            <DetailsCast title='Crew' people={crew} />
                        </>
                    )}
                </div>
            </div>
        </Page>
    );
}
