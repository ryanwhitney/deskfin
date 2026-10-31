import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api';

import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useUserViews } from 'apps/deskfin/hooks/api/useUserViews';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { useTitle } from 'apps/deskfin/hooks/useTitle';
import { formatLibraryTitle } from 'apps/deskfin/utils/titleUtils';
import * as userSettings from 'scripts/settings/userSettings';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import layoutManager from 'components/layoutManager';
import { DEFAULT_SECTIONS, HomeSectionType } from 'constants/homeSectionType';
import type { ItemDto } from 'types/base/models/item-dto';
import { LinkButton } from 'apps/deskfin/components/button/LinkButton';

import { HomeRow } from '../components/HomeRow';
import { PlaylistRow } from '../components/PlaylistRow';
import { Section } from 'apps/deskfin/components/media/Section';
import { ItemGrid } from 'apps/deskfin/components/media/ItemGrid';
import { useGetUserPlaylists } from 'apps/deskfin/features/watchlist/hooks/useGetUserPlaylists';
import styles from './HomeRoute.module.scss';
import { translateOr } from 'apps/deskfin/utils/translate';
import { getLibraryPath } from 'apps/deskfin/utils/libraryPaths';

const t = translateOr;

type LatestByLibrary = { library: BaseItemDto; items: ItemDto[] };

const getAllSectionsToShow = (sectionCount: number): HomeSectionType[] => {
    const sections: string[] = [];
    for (let i = 0; i < sectionCount; i++) {
        let section = userSettings.get(`homesection${i}`) || DEFAULT_SECTIONS[i];
        if (section === 'folders') section = DEFAULT_SECTIONS[0];
        sections.push(section);
    }

    if (layoutManager.tv && !sections.includes(HomeSectionType.SmallLibraryTiles) && !sections.includes(HomeSectionType.LibraryButtons)) {
        return [HomeSectionType.SmallLibraryTiles, ...sections] as HomeSectionType[];
    }

    return sections as HomeSectionType[];
};

/**
 * Shares one in-flight request per key. The home route can mount twice in quick succession at startup;
 * this keeps the second mount from fetching the same sections again.
 */
const inflight = new Map<string, Promise<unknown>>();
const shared = <T,>(key: string, load: () => Promise<T>): Promise<T> => {
    const existing = inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = load().finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
};

/** Stable empty list, so "no user views yet" doesn't look like a change on every render. */
const NO_VIEWS: BaseItemDto[] = [];

/** "All …" link text for a library's latest row. */
const LATEST_ALL_LINK_TEXT: Partial<Record<string, string>> = {
    movies: 'All movies',
    tvshows: 'All shows'
};

const Home: FC = () => {
    const { api, user, serverId } = useApi();
    const apiClient = useMemo(() => (serverId ? ServerConnections.getApiClient(serverId) : undefined), [serverId]);
    // The user object is replaced whenever it's refreshed; loaders read it through a ref and key off the id.
    const userRef = useRef(user);
    userRef.current = user;
    const userId = user?.Id;
    const documentRef = useRef<Document>(document);
    const [searchParams] = useSearchParams();
    const isFavoritesTab = searchParams.get('tab') === '1';

    const { data: userViewsResp } = useUserViews({ userId: user?.Id });
    const userViews = (userViewsResp?.Items as BaseItemDto[] | undefined) ?? NO_VIEWS;

    const { data: userPlaylists = [] } = useGetUserPlaylists({ enabled: !isFavoritesTab });

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    // Data state
    const [resumeVideo, setResumeVideo] = useState<ItemDto[]>([]);
    const [resumeAudio, setResumeAudio] = useState<ItemDto[]>([]);
    const [resumeBook, setResumeBook] = useState<ItemDto[]>([]);
    const [nextUp, setNextUp] = useState<ItemDto[]>([]);
    const [activeRecordings, setActiveRecordings] = useState<ItemDto[]>([]);
    const [onNow, setOnNow] = useState<ItemDto[]>([]);
    const [latestByLibrary, setLatestByLibrary] = useState<LatestByLibrary[]>([]);

    // Favorites state
    const [favoriteMovies, setFavoriteMovies] = useState<ItemDto[]>([]);
    const [favoriteShows, setFavoriteShows] = useState<ItemDto[]>([]);
    const [favoriteEpisodes, setFavoriteEpisodes] = useState<ItemDto[]>([]);
    const [favoriteCollections, setFavoriteCollections] = useState<ItemDto[]>([]);
    const [favoritePeople, setFavoritePeople] = useState<ItemDto[]>([]);

    // Visibility state for fade-in
    const [showLibraryTiles, setShowLibraryTiles] = useState(false);

    useEffect(() => {
        if (userViews.length > 0) {
            const timer = setTimeout(() => setShowLibraryTiles(true), 10);
            return () => clearTimeout(timer);
        }
    }, [userViews.length]);

    /*
     * Home sections load in three non-overlapping parts, so nothing is requested twice:
     * the first rows right away, the rest when the browser is idle, and latest-per-library once user views arrive.
     */
    const loadPrioritySections = useCallback(async () => {
        if (!apiClient || !userId) return;
        const sectionOrder = getAllSectionsToShow(10);
        const tasks: Promise<void>[] = [];

        if (sectionOrder.includes(HomeSectionType.Resume)) {
            tasks.push(shared(`resume-video:${userId}`, () => apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                Limit: 12, Recursive: true, Fields: 'PrimaryImageAspectRatio',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false, MediaTypes: 'Video'
            })).then(r => setResumeVideo((r?.Items || []) as ItemDto[])));
        }

        if (sectionOrder.includes(HomeSectionType.NextUp)) {
            const oldestDateForNextUp = new Date();
            oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - userSettings.maxDaysForNextUp());
            tasks.push(shared(`next-up:${userId}`, () => apiClient.getNextUpEpisodes({
                Limit: 24, Fields: 'PrimaryImageAspectRatio,DateCreated,Path,MediaSourceCount',
                UserId: apiClient.getCurrentUserId(), ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Banner,Thumb', EnableTotalRecordCount: false,
                DisableFirstEpisode: false, NextUpDateCutoff: oldestDateForNextUp.toISOString(),
                EnableResumable: false, EnableRewatching: userSettings.enableRewatchingInNextUp()
            })).then(r => setNextUp((r?.Items || []) as ItemDto[])));
        }

        await Promise.all(tasks);
    }, [apiClient, userId]);

    const loadOtherSections = useCallback(async () => {
        if (!apiClient || !userId) return;
        const sectionOrder = getAllSectionsToShow(10);
        const tasks: Promise<void>[] = [];

        if (sectionOrder.includes(HomeSectionType.ResumeAudio)) {
            tasks.push(shared(`resume-audio:${userId}`, () => apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                Limit: 12, Recursive: true, Fields: 'PrimaryImageAspectRatio',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false, MediaTypes: 'Audio'
            })).then(r => setResumeAudio((r?.Items || []) as ItemDto[])));
        }

        if (sectionOrder.includes(HomeSectionType.ResumeBook)) {
            tasks.push(shared(`resume-book:${userId}`, () => apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                Limit: 12, Recursive: true, Fields: 'PrimaryImageAspectRatio',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false, MediaTypes: 'Book'
            })).then(r => setResumeBook((r?.Items || []) as ItemDto[])));
        }

        if (sectionOrder.includes(HomeSectionType.ActiveRecordings)) {
            tasks.push(shared(`recordings:${userId}`, () => apiClient.getLiveTvRecordings({
                userId: apiClient.getCurrentUserId(), Limit: 12,
                Fields: 'PrimaryImageAspectRatio', EnableTotalRecordCount: false,
                IsLibraryItem: null, IsInProgress: true
            })).then(r => setActiveRecordings((r?.Items || []) as ItemDto[])));
        }

        if (sectionOrder.includes(HomeSectionType.LiveTv) && userRef.current?.Policy?.EnableLiveTvAccess) {
            tasks.push(shared(`on-now:${userId}`, () => apiClient.getLiveTvRecommendedPrograms({
                userId: apiClient.getCurrentUserId(), IsAiring: true, limit: 24,
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Thumb,Backdrop',
                EnableTotalRecordCount: false, Fields: 'ChannelInfo,PrimaryImageAspectRatio'
            })).then(r => setOnNow((r?.Items || []) as ItemDto[])));
        }

        await Promise.all(tasks);
    }, [apiClient, userId]);

    const loadLatestSections = useCallback(async () => {
        if (!apiClient || !userId || !userViews.length) return;
        if (!getAllSectionsToShow(10).includes(HomeSectionType.LatestMedia)) return;

        const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels', 'folders'];
        const userExcludeItems = userRef.current?.Configuration?.LatestItemsExcludes ?? [];
        const filteredViews = userViews.filter(v =>
            v.Id && !userExcludeItems.includes(v.Id)
            && !(v.CollectionType && excludeViewTypes.includes(v.CollectionType))
        );

        const latestTasks = filteredViews.map(async (view) => {
            const items = await shared(`latest:${userId}:${view.Id}`, () => apiClient.getLatestItems({
                Limit: 16, Fields: 'PrimaryImageAspectRatio,Path',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                ParentId: view.Id
            }));
            return { library: view, items: (items || []) as ItemDto[] };
        });

        setLatestByLibrary(await Promise.all(latestTasks));
    }, [apiClient, userId, userViews]);

    const refreshAll = useCallback(() => Promise.all([
        loadPrioritySections(),
        loadOtherSections(),
        loadLatestSections()
    ]), [loadPrioritySections, loadOtherSections, loadLatestSections]);

    const refreshFavorites = useCallback(async () => {
        if (!apiClient || !api || !user?.Id) return;

        const baseOptions: Record<string, unknown> = {
            SortBy: 'SortName', SortOrder: 'Ascending', Filters: 'IsFavorite',
            Recursive: true, Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
            CollapseBoxSetItems: false, ExcludeLocationTypes: 'Virtual',
            EnableTotalRecordCount: false, ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb', Limit: 24
        };
        const currentUserId = apiClient.getCurrentUserId();

        const [movies, shows, episodes, collections, peopleResp] = await Promise.all([
            apiClient.getItems(currentUserId, { ...baseOptions, IncludeItemTypes: 'Movie' }),
            apiClient.getItems(currentUserId, { ...baseOptions, IncludeItemTypes: 'Series' }),
            apiClient.getItems(currentUserId, { ...baseOptions, IncludeItemTypes: 'Episode' }),
            apiClient.getItems(currentUserId, { ...baseOptions, IncludeItemTypes: 'BoxSet' }),
            getPersonApi(api).getPersons({
                userId: user.Id,
                isFavorite: true,
                limit: 24,
                enableUserData: true,
                imageTypeLimit: 1
            })
        ]);

        setFavoriteMovies((movies?.Items || []) as ItemDto[]);
        setFavoriteShows((shows?.Items || []) as ItemDto[]);
        setFavoriteEpisodes((episodes?.Items || []) as ItemDto[]);
        setFavoriteCollections((collections?.Items || []) as ItemDto[]);
        setFavoritePeople((peopleResp?.data?.Items || []) as ItemDto[]);
    }, [api, apiClient, user?.Id]);

    const onAfterAction = useCallback(() => {
        if (isFavoritesTab) {
            void refreshFavorites();
        } else {
            void refreshAll();
        }
    }, [isFavoritesTab, refreshAll, refreshFavorites]);

    const onToggleFavorite = useCallback(async (item: ItemDto) => {
        await toggleFavorite({ itemId: item.Id!, isFavorite: !!item.UserData?.IsFavorite });
        onAfterAction();
    }, [onAfterAction, toggleFavorite]);

    const onTogglePlayed = useCallback(async (item: ItemDto) => {
        await togglePlayed({ itemId: item.Id!, isPlayed: !!item.UserData?.Played });
        onAfterAction();
    }, [onAfterAction, togglePlayed]);

    useEffect(() => {
        clearBackdrop();
        const doc = documentRef.current;
        doc.querySelector('.skinHeader')?.classList.add('noHomeButtonHeader');

        let cancelIdle: (() => void) | undefined;
        if (isFavoritesTab) {
            void refreshFavorites();
        } else {
            void loadPrioritySections();
            // Safari lacks requestIdleCallback
            if ('requestIdleCallback' in window) {
                const handle = requestIdleCallback(() => {
                    void loadOtherSections();
                }, { timeout: 1500 });
                cancelIdle = () => cancelIdleCallback(handle);
            } else {
                const handle = setTimeout(() => {
                    void loadOtherSections();
                }, 0);
                cancelIdle = () => clearTimeout(handle);
            }
        }

        return () => {
            cancelIdle?.();
            doc.querySelector('.skinHeader')?.classList.remove('noHomeButtonHeader');
        };
    }, [isFavoritesTab, loadPrioritySections, loadOtherSections, refreshFavorites]);

    // Latest-per-library needs the user's views, which arrive separately.
    useEffect(() => {
        if (!isFavoritesTab) void loadLatestSections();
    }, [isFavoritesTab, loadLatestSections]);

    useTitle(isFavoritesTab ? formatLibraryTitle('Favorites') : 'desk');

    const sectionOrder = useMemo(() => getAllSectionsToShow(10), []);

    const rowProps = { user, onAfterAction, onToggleFavorite, onTogglePlayed };

    return (
        <Page
            id='indexPage'
            className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage'
            isBackButtonEnabled={false}
            backDropType={[BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Book]}
        >
            <div className={styles.page}>
                {isFavoritesTab ? (
                    <>
                        {favoriteMovies.length > 0 && (
                            <Section title={t('Movies', 'Movies')}>
                                <ItemGrid
                                    items={favoriteMovies}
                                    variant='portrait'
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                    onAfterAction={onAfterAction}
                                />
                            </Section>
                        )}
                        {favoriteShows.length > 0 && (
                            <Section title={t('Shows', 'Shows')}>
                                <ItemGrid
                                    items={favoriteShows}
                                    variant='portrait'
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                    onAfterAction={onAfterAction}
                                />
                            </Section>
                        )}
                        {favoriteEpisodes.length > 0 && (
                            <Section title={t('Episodes', 'Episodes')}>
                                <ItemGrid
                                    items={favoriteEpisodes}
                                    variant='landscape'
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                    onAfterAction={onAfterAction}
                                />
                            </Section>
                        )}
                        {favoriteCollections.length > 0 && (
                            <Section title={t('Collections', 'Collections')}>
                                <ItemGrid
                                    items={favoriteCollections}
                                    variant='portrait'
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                    onAfterAction={onAfterAction}
                                />
                            </Section>
                        )}
                        {favoritePeople.length > 0 && (
                            <Section title={t('People', 'People')}>
                                <ItemGrid
                                    items={favoritePeople}
                                    variant='portrait'
                                    onToggleFavorite={onToggleFavorite}
                                    onTogglePlayed={onTogglePlayed}
                                    onAfterAction={onAfterAction}
                                />
                            </Section>
                        )}
                    </>
                ) : (
                    <>
                        {/* Library tiles */}
                        {!sectionOrder.includes(HomeSectionType.SmallLibraryTiles) && userViews.length > 0 && (
                            <section className={`${styles.section} ${showLibraryTiles ? styles.visible : ''}`}>
                                <h2 className={styles.sectionTitle}>{t('HeaderMyMedia', 'My Media')}</h2>
                                <div className={styles.row}>
                                    {userViews.map(v => {
                                        const path = getLibraryPath(v.CollectionType, v.Id);
                                        const href = path ? `#${path}` : `#/list?parentId=${v.Id}`;

                                        return (
                                            <LinkButton
                                                key={v.Id}
                                                className={styles.libraryTile}
                                                href={href}
                                                aria-label={v.Name ?? t('HeaderMyMedia', 'Library')}
                                            >
                                                {v.Name ?? t('HeaderMyMedia', 'Library')}
                                            </LinkButton>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {sectionOrder.includes(HomeSectionType.ActiveRecordings) && (
                            <HomeRow title={t('HeaderActiveRecordings', 'Active recordings')} items={activeRecordings} {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.Resume) && (
                            <HomeRow title={t('HeaderContinueWatching', 'Continue watching')} items={resumeVideo} cardVariant='landscape' isPriority {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.ResumeAudio) && (
                            <HomeRow title={t('HeaderContinueListening', 'Continue listening')} items={resumeAudio} cardVariant='landscape' {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.ResumeBook) && (
                            <HomeRow title={t('HeaderContinueReading', 'Continue reading')} items={resumeBook} cardVariant='landscape' {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.LiveTv) && user?.Policy?.EnableLiveTvAccess && (
                            <>
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>{t('LiveTV', 'Live TV')}</h2>
                                    <div className={styles.row}>
                                        <a className={styles.pill} href='#/livetv?section=programs'>{t('Programs', 'Programs')}</a>
                                        <a className={styles.pill} href='#/livetv?section=guide'>{t('Guide', 'Guide')}</a>
                                        <a className={styles.pill} href='#/livetv?section=channels'>{t('Channels', 'Channels')}</a>
                                        <a className={styles.pill} href='#/recordedtv'>{t('Recordings', 'Recordings')}</a>
                                        <a className={styles.pill} href='#/livetv?section=dvrschedule'>{t('Schedule', 'Schedule')}</a>
                                        <a className={styles.pill} href='#/livetv?section=seriesrecording'>{t('Series', 'Series')}</a>
                                    </div>
                                </section>
                                <HomeRow title={t('HeaderOnNow', 'On Now')} items={onNow} {...rowProps} />
                            </>
                        )}

                        {sectionOrder.includes(HomeSectionType.NextUp) && (
                            <HomeRow title={t('NextUp', 'Next Up')} items={nextUp} cardVariant='landscape' isPriority {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.LatestMedia) && latestByLibrary.map(({ library, items }) => {
                            const linkText = LATEST_ALL_LINK_TEXT[library.CollectionType ?? ''];
                            const linkHref = linkText ? `#${getLibraryPath(library.CollectionType, library.Id)}` : undefined;

                            return (
                                <HomeRow
                                    key={library.Id}
                                    title={globalize.translate('LatestFromLibrary', library.Name)}
                                    items={items}
                                    linkHref={linkHref}
                                    linkText={linkText}
                                    {...rowProps}
                                />
                            );
                        })}

                        {/* User's playlists - each as its own row */}
                        {userPlaylists.slice(0, 3).map(playlist => {
                            if (!playlist.Id || !playlist.ChildCount || playlist.ChildCount === 0) return null;

                            return (
                                <PlaylistRow
                                    key={playlist.Id}
                                    playlistId={playlist.Id}
                                    title={playlist.Name ?? 'Unnamed List'}
                                    linkHref={`#/list?id=${playlist.Id}&serverId=${user?.ServerId}`}
                                    linkText='View all'
                                    {...rowProps}
                                />
                            );
                        })}
                    </>
                )}
            </div>
        </Page>
    );
};

export default Home;
