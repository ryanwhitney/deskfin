import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import globalize from 'lib/globalize';
import Page from 'components/Page';
import PrimaryMediaInfo from 'components/mediainfo/PrimaryMediaInfo';
import MediaInfoStats from 'components/mediainfo/MediaInfoStats';
import Cards from 'components/cardbuilder/Card/Cards';
import { useItem } from 'hooks/useItem';
import { useApi } from 'hooks/useApi';
import { useGetItems } from 'hooks/useFetchItems';
import { CardShape } from 'utils/card';
import { ItemKind } from 'types/base/models/item-kind';

import FavoriteButton from 'apps/experimental/features/userData/components/FavoriteButton';
import PlayedButton from 'apps/experimental/features/userData/components/PlayedButton';
import PlayOrResumeButton from '../components/buttons/PlayOrResumeButton';
import { DetailsHero } from '../components/ui/DetailsHero';
import { DetailsFacts } from '../components/ui/DetailsFacts';
import { DetailsCast } from '../components/ui/DetailsCast';
import { SeasonsSection } from '../components/ui/SeasonsSection';
import { EpisodesSection } from '../components/ui/EpisodesSection';
import { DetailsMoreMenu } from '../components/ui/DetailsMoreMenu';
import { buildImageUrl } from '../utils/imageUrl';

import styles from './DetailsRoute.module.scss';

export default function DetailsPage() {
    const [params] = useSearchParams();
    const itemId = params.get('id') || '';

    const { user } = useApi();
    const { data: item, isLoading, error } = useItem(itemId);

    // For episodes/seasons, fetch related items for fallback images
    const seriesId = (item as any)?.SeriesId as string | undefined;
    const seasonId = (item as any)?.SeasonId as string | undefined;
    const { data: seriesItem } = useItem(seriesId);
    const { data: seasonItem } = useItem(seasonId);

    // Build image URLs with fallback chain
    const primaryUrl = useMemo(() => (
        buildImageUrl(item, 'Primary', 600) ||
        buildImageUrl(seasonItem, 'Primary', 600) ||
        buildImageUrl(seriesItem, 'Primary', 600)
    ), [item, seasonItem, seriesItem]);

    const backdropUrl = useMemo(() => (
        buildImageUrl(item, 'Backdrop', 1400) ||
        buildImageUrl(seasonItem, 'Backdrop', 1400) ||
        buildImageUrl(seriesItem, 'Backdrop', 1400) ||
        buildImageUrl(item, 'Primary', 1400) ||
        buildImageUrl(seasonItem, 'Primary', 1400) ||
        buildImageUrl(seriesItem, 'Primary', 1400)
    ), [item, seasonItem, seriesItem]);

    const queryKey = useMemo(() => (
        user?.Id ? ['User', user.Id, 'Items', itemId] : ['Items', itemId]
    ), [user?.Id, itemId]);

    // Determine item type
    const itemType = item?.Type;
    const isSeries = itemType === ItemKind.Series;
    const isSeason = itemType === ItemKind.Season;
    const isBoxSet = itemType === ItemKind.BoxSet;

    // Fetch seasons for series
    const { data: seasonsResult } = useGetItems({
        parentId: itemId,
        includeItemTypes: [BaseItemKind.Season],
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        enableTotalRecordCount: false,
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary]
    }, { enabled: !!item?.Id && isSeries });

    // Fetch episodes for season
    const { data: episodesResult } = useGetItems({
        parentId: itemId,
        includeItemTypes: [BaseItemKind.Episode],
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        enableTotalRecordCount: false,
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary],
        fields: [ItemFields.Overview]
    }, { enabled: !!item?.Id && isSeason });

    // Fetch BoxSet items
    const { data: boxSetItemsResult, isPending: isBoxSetItemsPending } = useGetItems({
        parentId: itemId,
        limit: 200,
        enableTotalRecordCount: false,
        fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount, ItemFields.Overview]
    }, { enabled: !!item?.Id && isBoxSet });

    const seasons = seasonsResult?.Items || [];
    const episodes = episodesResult?.Items || [];
    const boxSetItems = boxSetItemsResult?.Items || [];

    // Loading state
    if (isLoading) {
        return (
            <Page id="itemDetailsPage" className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.loading}>{globalize.translate('Loading')}</div>
                </div>
            </Page>
        );
    }

    // Error state
    if (error || !item) {
        return (
            <Page id="itemDetailsPage" className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.error}>{globalize.tryTranslate?.('Error') ?? 'Error'}</div>
                </div>
            </Page>
        );
    }

    // Extract people data
    const people = (item.People || []).slice(0, 15);
    const directors = people.filter(p => p.Type === 'Director');
    const writers = people.filter(p => p.Type === 'Writer');
    const cast = people.filter(p => p.Type === 'Actor' || p.Type === 'GuestStar');

    // Series/Season breadcrumb data
    const seriesName = (item as any).SeriesName as string | undefined;
    const seasonName = (item as any).SeasonName as string | undefined;

    const isPlayed = !!item.UserData?.Played;
    const isFavorite = !!item.UserData?.IsFavorite;

    return (
        <Page
            id="itemDetailsPage"
            className={`${styles.page} selfBackdropPage`}
            backDropType="movie,series,book"
        >
            <div>
                <DetailsHero backdropUrl={backdropUrl} />

                <div className={styles.container}>
                    <div className={styles.top}>
                        <div
                            className={styles.poster}
                            style={{
                                backgroundImage: primaryUrl ? `url(${primaryUrl})` : 'rgba(255,255,255,0.05)'
                            }}
                        />
                        <div>
                            <h1 className={styles.title}>
                                {item.Name}
                                {item.ProductionYear && (
                                    <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: '0.5rem' }}>
                                        {item.ProductionYear}
                                    </span>
                                )}
                            </h1>

                            {/* Breadcrumbs for episodes */}
                            {(seriesName || seasonName) && (
                                <div className={styles.breadcrumbs}>
                                    {seriesId && seriesName ? (
                                        <a href={`#/details?id=${seriesId}`} className={styles.breadcrumbLink}>
                                            {seriesName}
                                        </a>
                                    ) : seriesName ? (
                                        <span className={styles.breadcrumbText}>{seriesName}</span>
                                    ) : null}
                                    {seriesName && seasonName && <span className={styles.breadcrumbSep}>/</span>}
                                    {seasonId && seasonName ? (
                                        <a href={`#/details?id=${seasonId}`} className={styles.breadcrumbLink}>
                                            {seasonName}
                                        </a>
                                    ) : seasonName ? (
                                        <span className={styles.breadcrumbText}>{seasonName}</span>
                                    ) : null}
                                </div>
                            )}

                            {item.OriginalTitle && item.OriginalTitle !== item.Name && (
                                <div style={{ color: '#b8b8b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                    {item.OriginalTitle}
                                </div>
                            )}

                            <div className={styles.meta}>
                                <PrimaryMediaInfo
                                    className={styles.metaInfo}
                                    infoclass={styles.metaPill}
                                    item={item}
                                    showYearInfo
                                    showRuntimeInfo
                                    showOfficialRatingInfo
                                    showStarRatingInfo
                                    showCaptionIndicatorInfo
                                    showCriticRatingInfo
                                />
                                <MediaInfoStats
                                    className={styles.metaInfo}
                                    infoclass={styles.metaPill}
                                    item={item}
                                    showResolutionInfo
                                    showVideoStreamCodecInfo
                                    showAudoChannelInfo
                                    showAudioStreamCodecInfo
                                />
                            </div>

                            {item.Overview && <p className={styles.overview}>{item.Overview}</p>}

                            <div className={styles.actions}>
                                <PlayOrResumeButton
                                    item={item}
                                    isResumable={!!item.UserData?.PlaybackPositionTicks}
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
                                <DetailsMoreMenu item={item} queryKey={queryKey} />
                            </div>

                            <DetailsFacts item={item} directors={directors} writers={writers} />
                        </div>
                    </div>

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
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                {globalize.tryTranslate?.('Items') ?? 'Items'}
                            </h2>
                            {isBoxSetItemsPending ? null : boxSetItems.length ? (
                                <div className="itemsContainer vertical-wrap">
                                    <Cards
                                        items={boxSetItems}
                                        cardOptions={{
                                            shape: CardShape.PortraitOverflow,
                                            context: 'movies',
                                            showTitle: true,
                                            showYear: true,
                                            centerText: true,
                                            coverImage: true
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className={styles.meta}>No items available</div>
                            )}
                        </div>
                    )}

                    {/* Cast section */}
                    <DetailsCast cast={cast} />
                </div>
            </div>
        </Page>
    );
}
