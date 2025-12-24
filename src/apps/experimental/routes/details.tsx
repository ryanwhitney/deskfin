import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { useQuery } from '@tanstack/react-query';

import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Page from 'components/Page';
import PrimaryMediaInfo from 'components/mediainfo/PrimaryMediaInfo';
import MediaInfoStats from 'components/mediainfo/MediaInfoStats';
import Cards from 'components/cardbuilder/Card/Cards';
import { EpisodeRow } from 'apps/experimental/components/details/EpisodeRow';
import { useItem } from 'hooks/useItem';
import { useApi } from 'hooks/useApi';
import { useGetItems } from 'hooks/useFetchItems';
import FavoriteButton from 'apps/experimental/features/userData/components/FavoriteButton';
import PlayedButton from 'apps/experimental/features/userData/components/PlayedButton';
import PlayOrResumeButton from 'apps/experimental/features/details/components/buttons/PlayOrResumeButton';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';
import { DetailsMoreMenu } from 'apps/experimental/components/details/DetailsMoreMenu';
import { CardShape } from 'utils/card';
import { ItemAction } from 'constants/itemAction';

import './details.modern.scss';

const buildImageUrl = (item: ItemDto | undefined, type: 'Primary' | 'Backdrop', maxWidth = 900) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item?.Id) return '';

    // Try common tags
    const primaryTag = item.ImageTags?.Primary || item.PrimaryImageTag;
    const backdropTag = item.BackdropImageTags?.[0];
    const tag = type === 'Primary' ? primaryTag : backdropTag;
    if (!tag) return '';

    return apiClient.getImageUrl(item.Id, {
        type,
        tag,
        maxWidth
    });
};

export default function DetailsPage() {
    const [ params ] = useSearchParams();
    const itemId = params.get('id') || '';

    const { user, api, __legacyApiClient__ } = useApi();
    const { data: item, isLoading, error } = useItem(itemId);

    // For episodes/seasons, backdrops are often missing. Pull related items to use as fallbacks.
    const seriesId = (item as any)?.SeriesId as string | undefined;
    const seasonId = (item as any)?.SeasonId as string | undefined;
    const { data: seriesItem } = useItem(seriesId);
    const { data: seasonItem } = useItem(seasonId);

    const primaryUrl = useMemo(() => {
        return (
            buildImageUrl(item, 'Primary', 600)
            || buildImageUrl(seasonItem, 'Primary', 600)
            || buildImageUrl(seriesItem, 'Primary', 600)
        );
    }, [ item, seasonItem, seriesItem ]);

    const backdropUrl = useMemo(() => {
        return (
            buildImageUrl(item, 'Backdrop', 1400)
            || buildImageUrl(seasonItem, 'Backdrop', 1400)
            || buildImageUrl(seriesItem, 'Backdrop', 1400)
            // Last-resort: use a wide primary so the hero isn't blank.
            || buildImageUrl(item, 'Primary', 1400)
            || buildImageUrl(seasonItem, 'Primary', 1400)
            || buildImageUrl(seriesItem, 'Primary', 1400)
        );
    }, [ item, seasonItem, seriesItem ]);

    const queryKey = useMemo(() => {
        return user?.Id
            ? [ 'User', user.Id, 'Items', itemId ]
            : [ 'Items', itemId ];
    }, [ user?.Id, itemId ]);

    // For series: fetch seasons
    const itemType = item?.Type;
    const isSeries = itemType === ItemKind.Series;
    const isSeason = itemType === ItemKind.Season;
    const isBoxSet = itemType === ItemKind.BoxSet;

    const { data: seasonsResult } = useGetItems({
        parentId: itemId,
        includeItemTypes: [ BaseItemKind.Season ],
        sortBy: [ ItemSortBy.SortName ],
        sortOrder: [ SortOrder.Ascending ],
        enableTotalRecordCount: false,
        imageTypeLimit: 1,
        enableImageTypes: [ ImageType.Primary ]
    }, { enabled: !!item?.Id && isSeries });

    const seasons = seasonsResult?.Items || [];

    // For seasons: fetch episodes
    const { data: episodesResult } = useGetItems({
        parentId: itemId,
        includeItemTypes: [ BaseItemKind.Episode ],
        sortBy: [ ItemSortBy.SortName ],
        sortOrder: [ SortOrder.Ascending ],
        enableTotalRecordCount: false,
        imageTypeLimit: 1,
        enableImageTypes: [ ImageType.Primary ],
        fields: [ ItemFields.Overview ]
    }, { enabled: !!item?.Id && isSeason });

    const episodes = episodesResult?.Items || [];

    // For series: fetch "next up" and "episodes" (flat list or just seasons? usually seasons, but let's grab some eps to show)
    // Actually, usually Series view shows Seasons. Let's stick to Seasons for now.
    // But we might want "Next Up" for the series if it's in progress.
    const { data: seriesEpisodesResult } = useGetItems({
        parentId: itemId,
        includeItemTypes: [ BaseItemKind.Episode ],
        recursive: true,
        sortBy: [ ItemSortBy.DatePlayed ], // This isn't quite "Next Up", handled separately usually
        sortOrder: [ SortOrder.Descending ],
        limit: 1,
        enableTotalRecordCount: false,
        fields: [ ItemFields.Overview ]
    }, { enabled: false }); // Disabled for now, using specialized next-up query if needed, or just sticking to seasons.

    // If it's a BoxSet/Collection, fetch its items
    const { data: boxSetItemsResult, isPending: isBoxSetItemsPending } = useGetItems({
        parentId: itemId,
        // No fixed SortBy/SortOrder to respect user/collection default? or just sort by sortname
        limit: 200,
        enableTotalRecordCount: false,
        fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount, ItemFields.Overview]
    }, { enabled: !!item?.Id && isBoxSet });

    const boxSetItems = boxSetItemsResult?.Items || [];

    // Fetch "Next Up" for this series if logged in
    const { data: nextUpResult } = useGetItems({
        parentId: itemId,
        userId: user?.Id,
        includeItemTypes: [ BaseItemKind.Episode ],
        limit: 1,
        enableTotalRecordCount: false,
        excludeLocationTypes: [ 'Virtual' ],
        fields: [ ItemFields.Overview ]
        // Note: Real "Next Up" logic is complex and usually handled by a dedicated endpoint /Shows/NextUp
        // but getting the first unplayed episode is a decent approximation for simple display if we sort right.
        // Actually, let's just use the `GetNextUpEpisodes` if possible, but that's a different API.
        // For now, let's leave "Next Up" as a TODO or try a simple unplayed query.
    }, { enabled: false });

    // Actually, let's use the proper Next Up for series
    // We can't easily mix it into useGetItems perfectly without the dedicated endpoint,
    // but we can try filtering by unplayed.
    // ... let's skip complex Next Up for this iteration and focus on structure.

    if (isLoading) {
        return (
            <Page id='itemDetailsPage' className='detailsPage'>
                <div className='detailsContainer'>
                    <div className='detailsLoading'>{globalize.translate('Loading')}</div>
                </div>
            </Page>
        );
    }

    if (error || !item) {
        return (
            <Page id='itemDetailsPage' className='detailsPage'>
                <div className='detailsContainer'>
                    <div className='detailsError'>{globalize.tryTranslate?.('Error') ?? 'Error'}</div>
                </div>
            </Page>
        );
    }

    const isPlayed = !!item.UserData?.Played;
    const isFavorite = !!item.UserData?.IsFavorite;

    const people = (item.People || []).slice(0, 15);
    const directors = people.filter(p => p.Type === 'Director');
    const writers = people.filter(p => p.Type === 'Writer');
    const cast = people.filter(p => p.Type === 'Actor' || p.Type === 'GuestStar'); // GuestStar for episodes

    // For episodes, show Series/Season info?
    const seriesName = (item as any).SeriesName as string | undefined;
    const seasonName = (item as any).SeasonName as string | undefined;

    // Derived "next up" logic (mocked/simplified for now or rely on cache)
    const nextUpEpisode: ItemDto | undefined = undefined; // TODO: Fetch real next up
    const seriesEpisodes: ItemDto[] = []; // TODO: Flattened list if desired

    return (
        <Page
            id='itemDetailsPage'
            className='detailsPage selfBackdropPage'
            backDropType='movie,series,book'
        >
            <div className='detailsView'>
                <div
                    className='detailsHero'
                    style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined }}
                >
                    <div className='detailsHeroOverlay' />
                </div>

                <div className='detailsContainer'>
                    <div className='detailsTop'>
                        <div
                            className='detailsPoster'
                            style={{
                                backgroundImage: primaryUrl ? `url(${primaryUrl})` : 'rgba(255,255,255,0.05)'
                            }}
                        />
                        <div className='detailsInfo'>
                            <div className='detailsTitleRow'>
                                <h1 className='detailsTitle'>
                                    {item.Name}
                                </h1>
                                {(item.ProductionYear) ? (
                                    <span className='detailsYear'>
                                        {item.ProductionYear}
                                    </span>
                                ) : null}
                            </div>

                            {/* Series/Season breadcrumb for Episodes */}
                            {(seriesName || seasonName) ? (
                                <div className='detailsBreadcrumbs'>
                                    {seriesId && seriesName ? (
                                        <a href={`#/details?id=${seriesId}`} className='detailsBreadcrumbLink'>{seriesName}</a>
                                    ) : seriesName ? <span className='detailsBreadcrumbText'>{seriesName}</span> : null}
                                    {seriesName && seasonName ? <span className='detailsBreadcrumbSep'>/</span> : null}
                                    {seasonId && seasonName ? (
                                        <a href={`#/details?id=${seasonId}`} className='detailsBreadcrumbLink'>{seasonName}</a>
                                    ) : seasonName ? <span className='detailsBreadcrumbText'>{seasonName}</span> : null}
                                </div>
                            ) : null}

                            {item.OriginalTitle && item.OriginalTitle !== item.Name ? (
                                <div className='detailsOriginalTitle'>{item.OriginalTitle}</div>
                            ) : null}

                            <div className='detailsMeta'>
                                <PrimaryMediaInfo
                                    className='detailsMetaInfo'
                                    infoclass='detailsMetaPill'
                                    item={item}
                                    showYearInfo
                                    showRuntimeInfo
                                    showOfficialRatingInfo
                                    showStarRatingInfo
                                    showCaptionIndicatorInfo
                                    showCriticRatingInfo
                                />
                                <MediaInfoStats
                                    className='detailsMetaInfo'
                                    infoclass='detailsMetaPill'
                                    item={item}
                                    showResolutionInfo
                                    showVideoStreamCodecInfo
                                    showAudoChannelInfo
                                    showAudioStreamCodecInfo
                                />
                            </div>

                            {item.Overview ? <p className='detailsOverview'>{item.Overview}</p> : null}

                            <div className='detailsActions'>
                                <PlayOrResumeButton item={item} isResumable={!!item.UserData?.PlaybackPositionTicks} />
                                <PlayedButton
                                    className='expIconButton detailsIconBtn'
                                    isPlayed={isPlayed}
                                    itemId={item.Id}
                                    itemType={item.Type}
                                />
                                <FavoriteButton
                                    className='expIconButton detailsIconBtn'
                                    isFavorite={isFavorite}
                                    itemId={item.Id}
                                />
                                <DetailsMoreMenu item={item} queryKey={queryKey} />
                            </div>

                            {(item.GenreItems?.length || item.Genres?.length || directors.length || writers.length) ? (
                                <div className='detailsFacts'>
                                    {item.GenreItems?.length ? (
                                        <div className='detailsFactRow'>
                                            <div className='detailsFactLabel'>{globalize.translate('Genres')}</div>
                                            <div className='detailsFactValue'>
                                                {item.GenreItems.map(g => (
                                                    <a key={g.Id || g.Name} className='tag' href={`#/genre?id=${g.Id}`}>
                                                        {g.Name}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ) : item.Genres?.length ? (
                                        <div className='detailsFactRow'>
                                            <div className='detailsFactLabel'>{globalize.translate('Genres')}</div>
                                            <div className='detailsFactValue'>
                                                {item.Genres.map(g => <span key={g} className='tag'>{g}</span>)}
                                            </div>
                                        </div>
                                    ) : null}
                                    {directors.length ? (
                                        <div className='detailsFactRow'>
                                            <div className='detailsFactLabel'>{globalize.translate('Director')}</div>
                                            <div className='detailsFactValue'>
                                                {directors.map(p => (
                                                    p.Id ? (
                                                        <a key={p.Id} className='tag' href={`#/person?id=${p.Id}`}>{p.Name}</a>
                                                    ) : (
                                                        <span key={p.Name} className='tag'>{p.Name}</span>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {writers.length ? (
                                        <div className='detailsFactRow'>
                                            <div className='detailsFactLabel'>{globalize.translate('Writer')}</div>
                                            <div className='detailsFactValue'>
                                                {writers.map(p => (
                                                    p.Id ? (
                                                        <a key={p.Id} className='tag' href={`#/person?id=${p.Id}`}>{p.Name}</a>
                                                    ) : (
                                                        <span key={p.Name} className='tag'>{p.Name}</span>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Series/Season content before cast */}
                    {isSeries && (nextUpEpisode as ItemDto | undefined)?.Id ? (
                        <div className='detailsSection'>
                            <h2 className='detailsSectionTitle'>{globalize.translate('NextUp')}</h2>
                            <div className='episodeList'>
                                <EpisodeRow episode={nextUpEpisode!} queryKey={[ ...queryKey, 'NextUp' ]} />
                            </div>
                        </div>
                    ) : null}

                    {isSeries && seriesEpisodes.length ? (
                        <div className='detailsSection'>
                            <h2 className='detailsSectionTitle'>{globalize.translate('Episodes')}</h2>
                            <div className='episodeList'>
                                {seriesEpisodes.slice(0, 12).map(ep => (
                                    <EpisodeRow key={ep.Id} episode={ep} queryKey={[ ...queryKey, 'SeriesEpisodes' ]} />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {isSeries && seasons.length ? (
                        <div className='detailsSection'>
                            <h2 className='detailsSectionTitle'>{globalize.translate('Seasons')}</h2>
                            <div className='detailsCardRow'>
                                {seasons.map(s => {
                                    // Manually build image for season
                                    const sImg = buildImageUrl(s, 'Primary', 400);
                                    return (
                                        <a key={s.Id} className='detailsCard' href={`#/details?id=${s.Id}`}>
                                            <div
                                                className='detailsCardImg'
                                                style={{ backgroundImage: sImg ? `url(${sImg})` : 'rgba(255,255,255,0.1)' }}
                                            />
                                            <div className='detailsCardTitle'>{s.Name}</div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {isSeason && episodes.length ? (
                        <div className='detailsSection'>
                            <h2 className='detailsSectionTitle'>{globalize.translate('Episodes')}</h2>
                            <div className='episodeList'>
                                {episodes.map(ep => (
                                    <EpisodeRow key={ep.Id} episode={ep} queryKey={[ ...queryKey, 'SeasonEpisodes' ]} showSeriesAndSeason={false} />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {isBoxSet ? (
                        <div className='detailsSection'>
                            <h2 className='detailsSectionTitle'>{globalize.tryTranslate?.('Items') ?? 'Items'}</h2>
                            {isBoxSetItemsPending ? (
                                <></>
                            ) : boxSetItems.length ? (
                                <div className='itemsContainer vertical-wrap'>
                                    <Cards
                                        items={boxSetItems}
                                        cardOptions={{
                                            shape: CardShape.PortraitOverflow,
                                            context: 'movies', // 'home' is not a valid CollectionType, using movies as fallback
                                            showTitle: true,
                                            showYear: true,
                                            centerText: true,
                                            coverImage: true
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className='detailsMeta'>No items available</div>
                            )}
                        </div>
                    ) : null}

                    {cast.length ? (
                        <div className='detailsSection'>
                            <h2 className='detailsSectionTitle'>{globalize.tryTranslate?.('GuestStars') ?? 'Cast'}</h2>
                            <div className='detailsPeople'>
                                {cast.map(p => (
                                    p.Id ? (
                                        <a key={p.Id} className='detailsPerson' href={`#/person?id=${p.Id}`}>
                                            {/* TODO: Person image if available (p.PrimaryImageTag, etc - verify DTO) */}
                                            <div className='detailsPersonName'>{p.Name}</div>
                                            {p.Role ? <div className='detailsPersonRole'>{p.Role}</div> : null}
                                        </a>
                                    ) : (
                                        <div key={p.Name} className='detailsPerson detailsPerson--static'>
                                            <div className='detailsPersonName'>{p.Name}</div>
                                            {p.Role ? <div className='detailsPersonRole'>{p.Role}</div> : null}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </Page>
    );
}
