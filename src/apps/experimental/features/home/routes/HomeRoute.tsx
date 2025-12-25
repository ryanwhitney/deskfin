import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import * as userSettings from 'scripts/settings/userSettings';
import globalize from 'lib/globalize';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { playbackManager } from 'components/playback/playbackmanager';
import layoutManager from 'components/layoutManager';
import { DEFAULT_SECTIONS, HomeSectionType } from 'types/homeSectionType';
import type { ItemDto } from 'types/base/models/item-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { LinkButton, MediaCard, MediaCardStyles } from 'apps/experimental/components/shared';
import { GridList, GridListItem } from 'react-aria-components';
import '../styles/home.modern.scss';

let ignoreHomeCardNavigateUntil = 0;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const suppressHomeCardNavigate = (ms = 500) => {
    ignoreHomeCardNavigateUntil = nowMs() + ms;
};

const t = (key: string, fallback: string) => {
    return globalize.tryTranslate?.(key) ?? fallback;
};

type ImageCandidate = { itemId: string; type: 'Primary' | 'Thumb' | 'Backdrop'; tag: string };

const buildCardImageUrl = (
    item: {
        Id?: string | null;
        Type?: string | null;
        ImageTags?: Record<string, string> | null;
        PrimaryImageTag?: string | null;
        BackdropImageTags?: string[] | null;
        ParentBackdropImageTags?: string[] | null;
        ParentBackdropItemId?: string | null;
        // Thumb inheritance (commonly set on episodes)
        ParentThumbImageTag?: string | null;
        ParentThumbItemId?: string | null;
        SeriesThumbImageTag?: string | null;
        SeriesId?: string | null;
    },
    options?: { variant?: 'portrait' | 'landscape'; maxWidth?: number }
) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item.Id) return '';

    const maxWidth = options?.maxWidth ?? 420;
    const variant = options?.variant ?? 'portrait';

    const candidates: ImageCandidate[] = [];

    // Prefer *item-owned* imagery first (especially important for Episodes),
    // then fall back to inherited series/parent imagery only if needed.
    const localThumbTag = item.ImageTags?.Thumb;
    if (localThumbTag) {
        candidates.push({ itemId: item.Id, type: 'Thumb', tag: localThumbTag });
    }

    const localBackdropTag = item.BackdropImageTags?.[0];
    if (localBackdropTag) {
        candidates.push({ itemId: item.Id, type: 'Backdrop', tag: localBackdropTag });
    }

    const localPrimaryTag = item.PrimaryImageTag || item.ImageTags?.Primary;
    if (localPrimaryTag) {
        candidates.push({ itemId: item.Id, type: 'Primary', tag: localPrimaryTag });
    }

    const hasAnyLocalImage = Boolean(localThumbTag || localBackdropTag || localPrimaryTag);
    const allowInherited = !hasAnyLocalImage || item.Type !== 'Episode';

    if (allowInherited) {
        if (item.ParentThumbItemId && item.ParentThumbImageTag) {
            candidates.push({ itemId: item.ParentThumbItemId, type: 'Thumb', tag: item.ParentThumbImageTag });
        } else if (item.SeriesId && item.SeriesThumbImageTag) {
            candidates.push({ itemId: item.SeriesId, type: 'Thumb', tag: item.SeriesThumbImageTag });
        }

        if (item.ParentBackdropItemId && item.ParentBackdropImageTags?.[0]) {
            candidates.push({ itemId: item.ParentBackdropItemId, type: 'Backdrop', tag: item.ParentBackdropImageTags[0] });
        }
    }

    // Landscape cards should strongly prefer landscape-oriented imagery.
    // Portrait cards should prefer primary, but can fall back if needed.
    const ordered = variant === 'landscape'
        ? candidates // thumb/backdrop/primary already in priority order
        : [
            ...candidates.filter(c => c.type === 'Primary'),
            ...candidates.filter(c => c.type !== 'Primary')
        ];

    const chosen = ordered[0];
    if (!chosen) return '';

    return apiClient.getImageUrl(chosen.itemId, { type: chosen.type, tag: chosen.tag, maxWidth });
};

const getCardMeta = (item: ItemDto) => {
    const detailsHref = `#/details?id=${item.Id}`;
    const type = item.Type as string | undefined;

    const year = item.ProductionYear ?? (item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : undefined);
    const endYear = item.EndDate ? new Date(item.EndDate).getFullYear() : undefined;

    if (type === 'Movie') {
        return { title: item.Name || '', titleHref: detailsHref, subtitle: year ? `${year}` : '', subtitleHref: undefined };
    }

    if (type === 'Series') {
        const start = year;
        const subtitle = start ? (endYear ? (endYear === start ? `${start}` : `${start}–${endYear}`) : `${start}–present`) : '';
        return { title: item.Name || '', titleHref: detailsHref, subtitle, subtitleHref: undefined };
    }

    if (type === 'Episode') {
        const seriesId = (item as any).SeriesId as string | undefined;
        const seriesName = item.SeriesName as string | undefined;
        const parentIndex = (item as any).ParentIndexNumber as number | undefined;
        const index = (item as any).IndexNumber as number | undefined;
        const s = parentIndex != null ? `S${parentIndex}` : '';
        const e = index != null ? `E${index}` : '';
        const prefix = (s || e) ? `${s}${s && e ? ':' : ''}${e}` : '';
        const epTitle = item.Name || '';
        const subtitle = prefix ? `${prefix}: ${epTitle}` : epTitle;

        return {
            title: seriesName || item.Name || '',
            titleHref: seriesId ? `#/details?id=${seriesId}` : detailsHref,
            subtitle,
            subtitleHref: detailsHref
        };
    }

    const artistItems = (item as any).ArtistItems as Array<{ Id?: string; Name?: string }> | undefined;
    const firstArtist = artistItems?.[0];
    const subtitleText = (item.SeriesName || item.AlbumArtist || item.Artists?.[0] || firstArtist?.Name || '') as string;
    const subtitleHref = firstArtist?.Id ? `#/person?id=${firstArtist.Id}` : detailsHref;

    return { title: item.Name || '', titleHref: detailsHref, subtitle: subtitleText, subtitleHref };
};

const getProgressPct = (item: ItemDto) => {
    const pos = item.UserData?.PlaybackPositionTicks ?? 0;
    const rt = item.RunTimeTicks ?? 0;
    if (!pos || !rt) return 0;
    return Math.max(0, Math.min(100, Math.round((pos / rt) * 100)));
};

const getOverlayCount = (item: ItemDto) => {
    const raw =
        (item as any).ChildCount
        ?? (item as any).RecursiveItemCount
        ?? (item as any).SeriesCount
        ?? (item as any).EpisodeCount;

    const n = typeof raw === 'number' ? raw : (typeof raw === 'string' ? parseInt(raw, 10) : 0);
    if (!Number.isFinite(n) || n <= 0) return undefined;

    const t = item.Type;
    if (t === 'BoxSet' || t === 'Series' || t === 'Season') return n;
    return undefined;
};

const HomeRow: FC<{
    title: string;
    items: ItemDto[];
    user: any;
    onAfterAction: () => void;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    cardVariant?: 'portrait' | 'landscape';
}> = ({ title, items, user, onAfterAction, onToggleFavorite, onTogglePlayed, cardVariant = 'portrait' }) => {
    if (!items.length) return null;

    const openDetailsById = (id: string) => {
        // Protect against "ghost clicks" after closing menus.
        if (nowMs() < ignoreHomeCardNavigateUntil) return;
        window.location.href = `#/details?id=${id}`;
    };

    return (
        <section className='homeSection'>
            <h2 className='homeSectionTitle'>{title}</h2>
            <GridList
                aria-label={title}
                className="homeRow"
                selectionMode="none"
                // ONE default action per card: open details.
                onAction={(key) => openDetailsById(String(key))}
            >
                {items.map(it => {
                    const id = it.Id ?? `${title}-${it.Name ?? 'item'}`;
                    const meta = getCardMeta(it);
                    const img = buildCardImageUrl(it, { variant: cardVariant, maxWidth: cardVariant === 'landscape' ? 720 : 420 });
                    return (
                        <GridListItem
                            key={id}
                            id={id}
                            textValue={it.Name ?? ''}
                            className={MediaCardStyles.gridItem}
                        >
                            {({ isFocused }) => (
                                <MediaCard
                                    item={it}
                                    user={user}
                                    variant={cardVariant}
                                    imageUrl={img}
                                    overlayCount={getOverlayCount(it)}
                                    progressPct={getProgressPct(it)}
                                    title={meta.title}
                                    titleHref={meta.titleHref}
                                    subtitle={meta.subtitle}
                                    subtitleHref={meta.subtitleHref}
                                    isRovingFocused={isFocused}
                                    onAfterAction={onAfterAction}
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                />
                            )}
                        </GridListItem>
                    );
                })}
            </GridList>
        </section>
    );
};

type LatestByLibrary = { library: BaseItemDto; items: ItemDto[] };

const getAllSectionsToShow = (sectionCount: number) => {
    const sections: string[] = [];
    for (let i = 0; i < sectionCount; i++) {
        let section = userSettings.get(`homesection${i}`) || DEFAULT_SECTIONS[i];
        if (section === 'folders') section = DEFAULT_SECTIONS[0];
        sections.push(section);
    }

    if (layoutManager.tv && !sections.includes(HomeSectionType.SmallLibraryTiles) && !sections.includes(HomeSectionType.LibraryButtons)) {
        return [ HomeSectionType.SmallLibraryTiles, ...sections ];
    }

    return sections as HomeSectionType[];
};

const Home: FC = () => {
    const { user, __legacyApiClient__ } = useApi();
    const apiClient = __legacyApiClient__;
    const documentRef = useRef<Document>(document);
    const [ searchParams ] = useSearchParams();
    const isFavoritesTab = searchParams.get('tab') === '1';

    const { data: userViewsResp } = useUserViews(user?.Id);
    const userViews = (userViewsResp?.Items || []) as BaseItemDto[];

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const [ loading, setLoading ] = useState(false);
    const [ resumeVideo, setResumeVideo ] = useState<ItemDto[]>([]);
    const [ resumeAudio, setResumeAudio ] = useState<ItemDto[]>([]);
    const [ resumeBook, setResumeBook ] = useState<ItemDto[]>([]);
    const [ nextUp, setNextUp ] = useState<ItemDto[]>([]);
    const [ activeRecordings, setActiveRecordings ] = useState<ItemDto[]>([]);
    const [ onNow, setOnNow ] = useState<ItemDto[]>([]);
    const [ latestByLibrary, setLatestByLibrary ] = useState<LatestByLibrary[]>([]);

    const [ favoriteMovies, setFavoriteMovies ] = useState<ItemDto[]>([]);
    const [ favoriteShows, setFavoriteShows ] = useState<ItemDto[]>([]);
    const [ favoriteEpisodes, setFavoriteEpisodes ] = useState<ItemDto[]>([]);
    const [ favoriteCollections, setFavoriteCollections ] = useState<ItemDto[]>([]);

    const refreshAll = useCallback(async (options?: { priorityOnly?: boolean }) => {
        if (!apiClient || !user?.Id) return;
        const priorityOnly = !!options?.priorityOnly;
        setLoading(true);
        try {
            const sectionOrder = getAllSectionsToShow(10);

            const tasks: Promise<void>[] = [];

            if (sectionOrder.includes(HomeSectionType.Resume)) {
                tasks.push(apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                    Limit: 12,
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio',
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Thumb',
                    EnableTotalRecordCount: false,
                    MediaTypes: 'Video'
                }).then(r => setResumeVideo((r?.Items || []) as ItemDto[])));
            }

            if (!priorityOnly && sectionOrder.includes(HomeSectionType.ResumeAudio)) {
                tasks.push(apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                    Limit: 12,
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio',
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Thumb',
                    EnableTotalRecordCount: false,
                    MediaTypes: 'Audio'
                }).then(r => setResumeAudio((r?.Items || []) as ItemDto[])));
            }

            if (!priorityOnly && sectionOrder.includes(HomeSectionType.ResumeBook)) {
                tasks.push(apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                    Limit: 12,
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio',
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Thumb',
                    EnableTotalRecordCount: false,
                    MediaTypes: 'Book'
                }).then(r => setResumeBook((r?.Items || []) as ItemDto[])));
            }

            if (sectionOrder.includes(HomeSectionType.NextUp)) {
                const oldestDateForNextUp = new Date();
                oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - userSettings.maxDaysForNextUp());
                tasks.push(apiClient.getNextUpEpisodes({
                    Limit: 24,
                    Fields: 'PrimaryImageAspectRatio,DateCreated,Path,MediaSourceCount',
                    UserId: apiClient.getCurrentUserId(),
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                    EnableTotalRecordCount: false,
                    DisableFirstEpisode: false,
                    NextUpDateCutoff: oldestDateForNextUp.toISOString(),
                    EnableResumable: false,
                    EnableRewatching: userSettings.enableRewatchingInNextUp()
                }).then(r => setNextUp((r?.Items || []) as ItemDto[])));
            }

            if (!priorityOnly && sectionOrder.includes(HomeSectionType.ActiveRecordings)) {
                tasks.push(apiClient.getLiveTvRecordings({
                    userId: apiClient.getCurrentUserId(),
                    Limit: 12,
                    Fields: 'PrimaryImageAspectRatio',
                    EnableTotalRecordCount: false,
                    IsLibraryItem: null,
                    IsInProgress: true
                }).then(r => setActiveRecordings((r?.Items || []) as ItemDto[])));
            }

            if (!priorityOnly && sectionOrder.includes(HomeSectionType.LiveTv) && user?.Policy?.EnableLiveTvAccess) {
                tasks.push(apiClient.getLiveTvRecommendedPrograms({
                    userId: apiClient.getCurrentUserId(),
                    IsAiring: true,
                    limit: 24,
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Thumb,Backdrop',
                    EnableTotalRecordCount: false,
                    Fields: 'ChannelInfo,PrimaryImageAspectRatio'
                }).then(r => setOnNow((r?.Items || []) as ItemDto[])));
            }

            if (!priorityOnly && sectionOrder.includes(HomeSectionType.LatestMedia) && userViews.length) {
                const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels', 'folders'];
                const userExcludeItems = user.Configuration?.LatestItemsExcludes ?? [];
                const filteredViews = userViews.filter(v =>
                    v.Id
                    && !userExcludeItems.includes(v.Id)
                    && !(v.CollectionType && excludeViewTypes.includes(v.CollectionType))
                );

                const latestTasks = filteredViews.map(async (view) => {
                    const items = await apiClient.getLatestItems({
                        Limit: 16,
                        Fields: 'PrimaryImageAspectRatio,Path',
                        ImageTypeLimit: 1,
                        EnableImageTypes: 'Primary,Backdrop,Thumb',
                        ParentId: view.Id
                    });
                    return { library: view, items: (items || []) as ItemDto[] } as LatestByLibrary;
                });

                tasks.push(Promise.all(latestTasks).then(setLatestByLibrary));
            }

            await Promise.all(tasks);
        } catch (e) {
            console.error('[Home] refresh failed', e);
        } finally {
            setLoading(false);
        }
    }, [apiClient, user, userViews]);

    const refreshFavorites = useCallback(async () => {
        if (!apiClient || !user?.Id) return;
        setLoading(true);
        try {
            const baseOptions: any = {
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                Filters: 'IsFavorite',
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
                CollapseBoxSetItems: false,
                ExcludeLocationTypes: 'Virtual',
                EnableTotalRecordCount: false,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                Limit: 24
            };
            const userId = apiClient.getCurrentUserId();

            const [ movies, shows, episodes, collections ] = await Promise.all([
                apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'Movie' }),
                apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'Series' }),
                apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'Episode' }),
                apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'BoxSet' })
            ]);

            setFavoriteMovies((movies?.Items || []) as ItemDto[]);
            setFavoriteShows((shows?.Items || []) as ItemDto[]);
            setFavoriteEpisodes((episodes?.Items || []) as ItemDto[]);
            setFavoriteCollections((collections?.Items || []) as ItemDto[]);
        } catch (e) {
            console.error('[Home/Favorites] refresh failed', e);
        } finally {
            setLoading(false);
        }
    }, [apiClient, user?.Id]);

    const onAfterAction = useCallback(() => {
        if (isFavoritesTab) {
            void refreshFavorites();
        } else {
            void refreshAll({ priorityOnly: true });
            void refreshAll();
        }
    }, [isFavoritesTab, refreshAll, refreshFavorites]);

    const onToggleFavorite = useCallback(async (item: ItemDto) => {
        try {
            await toggleFavorite({ itemId: item.Id!, isFavorite: !!item.UserData?.IsFavorite });
            if (isFavoritesTab) {
                void refreshFavorites();
            } else {
                void refreshAll({ priorityOnly: true });
                void refreshAll();
            }
        } catch (e) {
            console.error('[Home] favorite failed', e);
        }
    }, [isFavoritesTab, refreshAll, refreshFavorites, toggleFavorite]);

    const onTogglePlayed = useCallback(async (item: ItemDto) => {
        try {
            await togglePlayed({ itemId: item.Id!, isPlayed: !!item.UserData?.Played });
            if (isFavoritesTab) {
                void refreshFavorites();
            } else {
                void refreshAll({ priorityOnly: true });
                void refreshAll();
            }
        } catch (e) {
            console.error('[Home] played failed', e);
        }
    }, [isFavoritesTab, refreshAll, refreshFavorites, togglePlayed]);

    useEffect(() => {
        clearBackdrop();
        documentRef.current.querySelector('.skinHeader')?.classList.add('noHomeButtonHeader');
        if (isFavoritesTab) {
            void refreshFavorites();
        } else {
            const start = performance.now();
            void refreshAll({ priorityOnly: true }).finally(() => {
                const ms = Math.round(performance.now() - start);
                console.info(`[Home] priority loaded in ${ms}ms`);
            });

            const schedule = (cb: () => void) => {
                const ric = (window as any).requestIdleCallback as undefined | ((fn: () => void, opts?: { timeout: number }) => void);
                if (ric) {
                    ric(cb, { timeout: 1500 });
                } else {
                    setTimeout(cb, 0);
                }
            };
            schedule(() => {
                const d0 = performance.now();
                void refreshAll().finally(() => {
                    const ms = Math.round(performance.now() - d0);
                    console.info(`[Home] deferred loaded in ${ms}ms`);
                });
            });
        }

        return () => {
            documentRef.current.querySelector('.skinHeader')?.classList.remove('noHomeButtonHeader');
        };
    }, [isFavoritesTab, refreshAll, refreshFavorites]);

    // NOTE: We used to refetch on HEADER_RENDERED, but it can fire multiple times during startup,
    // leading to redundant network calls and slower first paint.

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const libraryMenu = useMemo(async () => ((await import('scripts/libraryMenu')).default), []);
    useEffect(() => {
        void (async () => {
            (await libraryMenu).setTitle(isFavoritesTab ? (t('Favorites', 'Favorites')) : null);
        })();
    }, [isFavoritesTab, libraryMenu]);

    const sectionOrder = useMemo(() => getAllSectionsToShow(10), []);

    return (
            <Page
                id='indexPage'
            className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage'
                isBackButtonEnabled={false}
                backDropType='movie,series,book'
            >
            <div className='homeModern'>
                {isFavoritesTab ? (
                    <>
                        <section className='homeSection'>
                            <h2 className='homeSectionTitle'>{t('Favorites', 'Favorites')}</h2>
                        </section>

                        <HomeRow
                            title={t('Movies', 'Movies')}
                            items={favoriteMovies}
                            user={user}
                            onAfterAction={onAfterAction}
                            onToggleFavorite={onToggleFavorite}
                            onTogglePlayed={onTogglePlayed}
                        />
                        <HomeRow
                            title={t('Shows', 'Shows')}
                            items={favoriteShows}
                            user={user}
                            onAfterAction={onAfterAction}
                            onToggleFavorite={onToggleFavorite}
                            onTogglePlayed={onTogglePlayed}
                        />
                        <HomeRow
                            title={t('Episodes', 'Episodes')}
                            items={favoriteEpisodes}
                            user={user}
                            onAfterAction={onAfterAction}
                            onToggleFavorite={onToggleFavorite}
                            onTogglePlayed={onTogglePlayed}
                        />
                        <HomeRow
                            title={t('Collections', 'Collections')}
                            items={favoriteCollections}
                            user={user}
                            onAfterAction={onAfterAction}
                            onToggleFavorite={onToggleFavorite}
                            onTogglePlayed={onTogglePlayed}
                        />
                    </>
                ) : (
                    <>

                {/* Libraries */}
                {sectionOrder.includes(HomeSectionType.SmallLibraryTiles) && userViews.length ? (
                    <section className='homeSection'>
                        <h2 className='homeSectionTitle'>{t('HeaderMyMedia', 'My Media')}</h2>
                        <div className='homeRow'>
                            {userViews.map(v => {
                                const ct = v.CollectionType;
                                const base =
                                    ct === 'movies' ? 'movies'
                                    : ct === 'tvshows' ? 'tv'
                                    : ct === 'music' ? 'music'
                                    : ct === 'homevideos' ? 'homevideos'
                                    : ct === 'books' ? 'books'
                                    : ct === 'boxsets' ? 'collections'
                                    : 'list';
                                const href = base === 'list'
                                    ? `#/list?parentId=${v.Id}`
                                    : `#/${base}?topParentId=${v.Id}`;

                                return (
                                    <LinkButton
                                        key={v.Id}
                                        className='homeLibraryTile'
                                        href={href}
                                        aria-label={v.Name ?? t('HeaderMyMedia', 'Library')}
                                    >
                                        <div className='homeLibraryTitle'>{v.Name ?? t('HeaderMyMedia', 'Library')}</div>
                                    </LinkButton>
                                );
                            })}
                        </div>
                    </section>
                ) : null}

                {sectionOrder.includes(HomeSectionType.ActiveRecordings) ? (
                    <HomeRow
                        title={t('HeaderActiveRecordings', 'Active recordings')}
                        items={activeRecordings}
                        user={user}
                        onAfterAction={onAfterAction}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                    />
                ) : null}

                {sectionOrder.includes(HomeSectionType.Resume) ? (
                    <HomeRow
                        title={t('HeaderContinueWatching', 'Continue watching')}
                        items={resumeVideo}
                        user={user}
                        onAfterAction={onAfterAction}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        cardVariant='landscape'
                    />
                ) : null}

                {sectionOrder.includes(HomeSectionType.ResumeAudio) ? (
                    <HomeRow
                        title={t('HeaderContinueListening', 'Continue listening')}
                        items={resumeAudio}
                        user={user}
                        onAfterAction={onAfterAction}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        cardVariant='landscape'
                    />
                ) : null}

                {sectionOrder.includes(HomeSectionType.ResumeBook) ? (
                    <HomeRow
                        title={t('HeaderContinueReading', 'Continue reading')}
                        items={resumeBook}
                        user={user}
                        onAfterAction={onAfterAction}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        cardVariant='landscape'
                    />
                ) : null}

                {sectionOrder.includes(HomeSectionType.LiveTv) && user?.Policy?.EnableLiveTvAccess ? (
                    <>
                        <section className='homeSection'>
                            <h2 className='homeSectionTitle'>{t('LiveTV', 'Live TV')}</h2>
                            <div className='homeRow'>
                                <a className='homePill' href='#/livetv?section=programs'>{t('Programs', 'Programs')}</a>
                                <a className='homePill' href='#/livetv?section=guide'>{t('Guide', 'Guide')}</a>
                                <a className='homePill' href='#/livetv?section=channels'>{t('Channels', 'Channels')}</a>
                                <a className='homePill' href='#/recordedtv'>{t('Recordings', 'Recordings')}</a>
                                <a className='homePill' href='#/livetv?section=dvrschedule'>{t('Schedule', 'Schedule')}</a>
                                <a className='homePill' href='#/livetv?section=seriesrecording'>{t('Series', 'Series')}</a>
                </div>
                        </section>

                        <HomeRow
                            title={t('HeaderOnNow', 'On Now')}
                            items={onNow}
                            user={user}
                            onAfterAction={onAfterAction}
                            onToggleFavorite={onToggleFavorite}
                            onTogglePlayed={onTogglePlayed}
                        />
                    </>
                ) : null}

                {sectionOrder.includes(HomeSectionType.NextUp) ? (
                    <HomeRow
                        title={t('NextUp', 'Next Up')}
                        items={nextUp}
                        user={user}
                        onAfterAction={onAfterAction}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        cardVariant='landscape'
                    />
                ) : null}

                {sectionOrder.includes(HomeSectionType.LatestMedia) ? (
                    <>
                        {latestByLibrary.map(({ library, items }) => (
                            <HomeRow
                                key={library.Id}
                                title={globalize.translate('LatestFromLibrary', library.Name)}
                                items={items}
                                user={user}
                                onAfterAction={onAfterAction}
                                onToggleFavorite={onToggleFavorite}
                                onTogglePlayed={onTogglePlayed}
                            />
                        ))}
                    </>
                ) : null}
                    </>
                )}
                </div>
            </Page>
    );
};

export default Home;
