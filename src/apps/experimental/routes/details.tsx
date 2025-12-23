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
import FavoriteButton from 'elements/emby-ratingbutton/FavoriteButton';
import PlayedButton from 'elements/emby-playstatebutton/PlayedButton';
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

    const primaryUrl = useMemo(() => buildImageUrl(item, 'Primary', 600), [ item ]);
    const backdropUrl = useMemo(() => buildImageUrl(item, 'Backdrop', 1400), [ item ]);

    const queryKey = useMemo(() => {
        return user?.Id
            ? ([ 'User', user.Id, 'Items', itemId ] as string[])
            : ([ 'Items', itemId ] as string[]);
    }, [ user?.Id, itemId ]);

    // IMPORTANT: hooks below must run on every render (React Query hooks included),
    // so we compute "enabled" flags instead of conditionally calling hooks after early returns.
    const itemType = item?.Type as ItemKind | undefined;
    const isSeries = itemType === ItemKind.Series;
    const isSeason = itemType === ItemKind.Season;

    const { data: nextUpItems } = useQuery({
        queryKey: [ 'NextUpForSeries', item?.Id ],
        queryFn: async ({ signal }) => {
            if (!api || !user?.Id || !item?.Id) return [];
            const response = await getTvShowsApi(api).getNextUp(
                {
                    userId: user.Id,
                    parentId: item.Id,
                    limit: 1,
                    fields: [ ItemFields.PrimaryImageAspectRatio, ItemFields.Overview, ItemFields.MediaSourceCount ],
                    imageTypeLimit: 1,
                    enableImageTypes: [ ImageType.Primary, ImageType.Thumb, ImageType.Backdrop ],
                    enableTotalRecordCount: false
                },
                { signal }
            );
            return (response.data.Items as ItemDto[]) || [];
        },
        enabled: !!api && !!user?.Id && !!item?.Id && isSeries,
        refetchOnWindowFocus: false
    });

    const { data: seasonsResult } = useGetItems({
        parentId: item?.Id ?? undefined,
        includeItemTypes: [ BaseItemKind.Season ],
        recursive: false,
        sortBy: [ ItemSortBy.SortName ],
        sortOrder: [ SortOrder.Ascending ],
        fields: [ ItemFields.PrimaryImageAspectRatio ],
        imageTypeLimit: 1,
        enableImageTypes: [ ImageType.Primary ]
    }, { enabled: !!item?.Id && isSeries });

    const { data: episodesResult } = useGetItems({
        parentId: item?.Id ?? undefined,
        includeItemTypes: [ BaseItemKind.Episode ],
        recursive: false,
        sortBy: [ ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber ],
        sortOrder: [ SortOrder.Ascending ],
        fields: [ ItemFields.PrimaryImageAspectRatio, ItemFields.Overview ],
        imageTypeLimit: 1,
        enableImageTypes: [ ImageType.Primary, ImageType.Thumb ]
    }, { enabled: !!item?.Id && isSeason });

    const { data: seriesEpisodesResult } = useGetItems({
        parentId: item?.Id ?? undefined,
        includeItemTypes: [ BaseItemKind.Episode ],
        recursive: true,
        limit: 18,
        sortBy: [ ItemSortBy.PremiereDate ],
        sortOrder: [ SortOrder.Descending ],
        fields: [ ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount, ItemFields.Overview ],
        imageTypeLimit: 1,
        enableImageTypes: [ ImageType.Primary, ImageType.Thumb, ImageType.Backdrop ]
    }, { enabled: !!item?.Id && isSeries });

    const seasons = (seasonsResult?.Items || []) as ItemDto[];
    const episodes = (episodesResult?.Items || []) as ItemDto[];
    const seriesEpisodes = (seriesEpisodesResult?.Items || []) as ItemDto[];
    const nextUpEpisode = (nextUpItems || [])[0] as ItemDto | undefined;

    const episodeCardOptions = useMemo(() => ({
        scalable: true,
        shape: CardShape.BackdropOverflow,
        preferThumb: true,
        inheritThumb: false,
        overlayPlayButton: true,
        showTitle: true,
        showParentTitle: true,
        showDetailsMenu: true,
        serverId: __legacyApiClient__?.serverId(),
        action: ItemAction.Link
    }), [ __legacyApiClient__ ]);

    if (!itemId) {
        return (
            <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
                <div className='detailsContainer'>
                    <h1 className='detailsTitle'>{globalize.translate('Error')}</h1>
                    <div className='detailsMeta'>Missing id</div>
                </div>
            </Page>
        );
    }

    if (isLoading) {
        return (
            <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
                <div className='detailsContainer'>Loading…</div>
            </Page>
        );
    }

    if (error || !item) {
        return (
            <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
                <div className='detailsContainer'>
                    <h1 className='detailsTitle'>{globalize.translate('Error')}</h1>
                    <div className='detailsMeta'>Failed to load item</div>
                </div>
            </Page>
        );
    }

    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;
    const directors = (item.People || []).filter(p => p.Type === 'Director');
    const writers = (item.People || []).filter(p => p.Type === 'Writer');
    const actors = (item.People || []).filter(p => p.Type === 'Actor');
    const guests = (item.People || []).filter(p => p.Type === 'GuestStar');

    const seriesId = (item as any).SeriesId as string | undefined;
    const seriesName = (item as any).SeriesName as string | undefined;
    const seasonId = (item as any).SeasonId as string | undefined;
    const seasonName = (item as any).SeasonName as string | undefined;

    return (
        <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
            <div className='detailsHero' style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : undefined}>
                <div className='detailsHeroOverlay' />
            </div>

            <div className='detailsContainer'>
                <div className='detailsTop'>
                    <div className='detailsPoster' style={primaryUrl ? { backgroundImage: `url(${primaryUrl})` } : undefined} />

                    <div className='detailsMain'>
                        <h1 className='detailsTitle'>{item.Name}</h1>
                        {item.Type === ItemKind.Episode && (seriesId || seasonId) ? (
                            <div className='detailsBreadcrumbs'>
                                {seriesId && seriesName ? (
                                    <a className='detailsBreadcrumbLink' href={`#/details?id=${seriesId}`}>{seriesName}</a>
                                ) : null}
                                {seriesId && seriesName && seasonId && seasonName ? <span className='detailsBreadcrumbSep'>›</span> : null}
                                {seasonId && seasonName ? (
                                    <a className='detailsBreadcrumbLink' href={`#/details?id=${seasonId}`}>{seasonName}</a>
                                ) : null}
                            </div>
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
                                className='detailsIconBtn'
                                isPlayed={isPlayed}
                                itemId={item.Id}
                                itemType={item.Type}
                                queryKey={queryKey}
                            />
                            <FavoriteButton
                                className='detailsIconBtn'
                                isFavorite={isFavorite}
                                itemId={item.Id}
                                queryKey={queryKey}
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
                {isSeries && nextUpEpisode?.Id ? (
                    <div className='detailsSection'>
                        <h2 className='detailsSectionTitle'>{globalize.translate('NextUp')}</h2>
                        <div className='episodeList'>
                            <EpisodeRow episode={nextUpEpisode} queryKey={[ ...queryKey, 'NextUp' ]} />
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
                                const imgUrl = buildImageUrl(s, 'Primary', 420);
                                return (
                                    <a key={s.Id} className='detailsCard' href={`#/details?id=${s.Id}`}>
                                        <div
                                            className='detailsCardImg'
                                            style={{
                                                backgroundImage: imgUrl ? `url(${imgUrl})` : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                                            }}
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

                {actors.length ? (
                    <div className='detailsSection'>
                        <h2 className='detailsSectionTitle'>{globalize.translate('Cast')}</h2>
                        <div className='detailsPeople'>
                            {actors.slice(0, 24).map(p => (
                                <div key={p.Id || p.Name} className='person'>
                                    {p.Id ? (
                                        <a className='personName' href={`#/person?id=${p.Id}`}>{p.Name}</a>
                                    ) : (
                                        <div className='personName'>{p.Name}</div>
                                    )}
                                    {p.Role ? <div className='personRole'>{p.Role}</div> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {guests.length ? (
                    <div className='detailsSection'>
                        <h2 className='detailsSectionTitle'>{globalize.translate('GuestStars')}</h2>
                        <div className='detailsPeople'>
                            {guests.slice(0, 24).map(p => (
                                <div key={p.Id || p.Name} className='person'>
                                    {p.Id ? (
                                        <a className='personName' href={`#/person?id=${p.Id}`}>{p.Name}</a>
                                    ) : (
                                        <div className='personName'>{p.Name}</div>
                                    )}
                                    {p.Role ? <div className='personRole'>{p.Role}</div> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </Page>
    );
}


