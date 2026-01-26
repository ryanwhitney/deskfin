import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';

import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { useTitle } from 'apps/deskfin/utils/useTitle';
import { formatLibraryTitle } from 'apps/deskfin/utils/titleUtils';
import * as userSettings from 'scripts/settings/userSettings';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import layoutManager from 'components/layoutManager';
import { DEFAULT_SECTIONS, HomeSectionType } from 'types/homeSectionType';
import type { ItemDto } from 'types/base/models/item-dto';
import { LinkButton } from 'apps/deskfin/components/button/LinkButton';

import { HomeRow } from '../components/HomeRow';
import { Section } from 'apps/deskfin/components/media/Section';
import { ItemGrid } from 'apps/deskfin/components/media/ItemGrid';
import styles from './HomeRoute.module.scss';

const t = (key: string, fallback: string) => globalize.tryTranslate?.(key) ?? fallback;

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

const Home: FC = () => {
    const { api, user, __legacyApiClient__: apiClient } = useApi();
    const documentRef = useRef<Document>(document);
    const [searchParams] = useSearchParams();
    const isFavoritesTab = searchParams.get('tab') === '1';

    const { data: userViewsResp } = useUserViews(user?.Id);
    const userViews = (userViewsResp?.Items || []) as BaseItemDto[];

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


    const refreshAll = useCallback(async (options?: { priorityOnly?: boolean }) => {
        if (!apiClient || !user?.Id) return;
        const priorityOnly = !!options?.priorityOnly;

        const sectionOrder = getAllSectionsToShow(10);
        const tasks: Promise<void>[] = [];

        if (sectionOrder.includes(HomeSectionType.Resume)) {
            tasks.push(apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                Limit: 12, Recursive: true, Fields: 'PrimaryImageAspectRatio',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false, MediaTypes: 'Video'
            }).then(r => setResumeVideo((r?.Items || []) as ItemDto[])));
        }

        if (!priorityOnly && sectionOrder.includes(HomeSectionType.ResumeAudio)) {
            tasks.push(apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                Limit: 12, Recursive: true, Fields: 'PrimaryImageAspectRatio',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false, MediaTypes: 'Audio'
            }).then(r => setResumeAudio((r?.Items || []) as ItemDto[])));
        }

        if (!priorityOnly && sectionOrder.includes(HomeSectionType.ResumeBook)) {
            tasks.push(apiClient.getResumableItems(apiClient.getCurrentUserId(), {
                Limit: 12, Recursive: true, Fields: 'PrimaryImageAspectRatio',
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false, MediaTypes: 'Book'
            }).then(r => setResumeBook((r?.Items || []) as ItemDto[])));
        }

        if (sectionOrder.includes(HomeSectionType.NextUp)) {
            const oldestDateForNextUp = new Date();
            oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - userSettings.maxDaysForNextUp());
            tasks.push(apiClient.getNextUpEpisodes({
                Limit: 24, Fields: 'PrimaryImageAspectRatio,DateCreated,Path,MediaSourceCount',
                UserId: apiClient.getCurrentUserId(), ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Banner,Thumb', EnableTotalRecordCount: false,
                DisableFirstEpisode: false, NextUpDateCutoff: oldestDateForNextUp.toISOString(),
                EnableResumable: false, EnableRewatching: userSettings.enableRewatchingInNextUp()
            }).then(r => setNextUp((r?.Items || []) as ItemDto[])));
        }

        if (!priorityOnly && sectionOrder.includes(HomeSectionType.ActiveRecordings)) {
            tasks.push(apiClient.getLiveTvRecordings({
                userId: apiClient.getCurrentUserId(), Limit: 12,
                Fields: 'PrimaryImageAspectRatio', EnableTotalRecordCount: false,
                IsLibraryItem: null, IsInProgress: true
            }).then(r => setActiveRecordings((r?.Items || []) as ItemDto[])));
        }

        if (!priorityOnly && sectionOrder.includes(HomeSectionType.LiveTv) && user?.Policy?.EnableLiveTvAccess) {
            tasks.push(apiClient.getLiveTvRecommendedPrograms({
                userId: apiClient.getCurrentUserId(), IsAiring: true, limit: 24,
                ImageTypeLimit: 1, EnableImageTypes: 'Primary,Thumb,Backdrop',
                EnableTotalRecordCount: false, Fields: 'ChannelInfo,PrimaryImageAspectRatio'
            }).then(r => setOnNow((r?.Items || []) as ItemDto[])));
        }

        if (!priorityOnly && sectionOrder.includes(HomeSectionType.LatestMedia) && userViews.length) {
            const excludeViewTypes = ['playlists', 'livetv', 'boxsets', 'channels', 'folders'];
            const userExcludeItems = user.Configuration?.LatestItemsExcludes ?? [];
            const filteredViews = userViews.filter(v =>
                v.Id && !userExcludeItems.includes(v.Id) &&
                !(v.CollectionType && excludeViewTypes.includes(v.CollectionType))
            );

            const latestTasks = filteredViews.map(async (view) => {
                const items = await apiClient.getLatestItems({
                    Limit: 16, Fields: 'PrimaryImageAspectRatio,Path',
                    ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop,Thumb',
                    ParentId: view.Id
                });
                return { library: view, items: (items || []) as ItemDto[] };
            });

            tasks.push(Promise.all(latestTasks).then(setLatestByLibrary));
        }

        await Promise.all(tasks);
    }, [apiClient, user, userViews]);

    const refreshFavorites = useCallback(async () => {
        if (!apiClient || !api || !user?.Id) return;

        const baseOptions: any = {
            SortBy: 'SortName', SortOrder: 'Ascending', Filters: 'IsFavorite',
            Recursive: true, Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
            CollapseBoxSetItems: false, ExcludeLocationTypes: 'Virtual',
            EnableTotalRecordCount: false, ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb', Limit: 24
        };
        const userId = apiClient.getCurrentUserId();

        const [movies, shows, episodes, collections, peopleResp] = await Promise.all([
            apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'Movie' }),
            apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'Series' }),
            apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'Episode' }),
            apiClient.getItems(userId, { ...baseOptions, IncludeItemTypes: 'BoxSet' }),
            getPersonsApi(api).getPersons({
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
            void refreshAll({ priorityOnly: true });
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
        documentRef.current.querySelector('.skinHeader')?.classList.add('noHomeButtonHeader');

        if (isFavoritesTab) {
            void refreshFavorites();
        } else {
            void refreshAll({ priorityOnly: true });
            const ric = (window as any).requestIdleCallback;
            const schedule = ric
                ? (cb: () => void) => ric(cb, { timeout: 1500 })
                : (cb: () => void) => setTimeout(cb, 0);
            schedule(() => void refreshAll());
        }

        return () => {
            documentRef.current.querySelector('.skinHeader')?.classList.remove('noHomeButtonHeader');
        };
    }, [isFavoritesTab, refreshAll, refreshFavorites]);

    useTitle(isFavoritesTab ? formatLibraryTitle('Favorites') : "desk");

    const sectionOrder = useMemo(() => getAllSectionsToShow(10), []);

    const rowProps = { user, onAfterAction, onToggleFavorite, onTogglePlayed };

    return (
        <Page
            id="indexPage"
            className="mainAnimatedPage homePage libraryPage allLibraryPage backdropPage"
            isBackButtonEnabled={false}
            backDropType="movie,series,book"
        >
            <div className={styles.page}>
                {isFavoritesTab ? (
                    <>
                        {favoriteMovies.length > 0 && (
                            <Section title={t('Movies', 'Movies')}>
                                <ItemGrid
                                    items={favoriteMovies}
                                    variant="portrait"
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
                                    variant="portrait"
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
                                    variant="landscape"
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
                                    variant="portrait"
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
                                    variant="portrait"
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
                                        const ct = v.CollectionType;
                                        const base = ct === 'movies' ? 'movies'
                                            : ct === 'tvshows' ? 'tv'
                                            : ct === 'music' ? 'music'
                                            : ct === 'homevideos' ? 'homevideos'
                                            : ct === 'books' ? 'books'
                                            : ct === 'boxsets' ? 'collections'
                                            : 'list';
                                        const href = base === 'list' ? `#/list?parentId=${v.Id}` : `#/${base}?topParentId=${v.Id}`;

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
                            <HomeRow title={t('HeaderContinueWatching', 'Continue watching')} items={resumeVideo} cardVariant="landscape" {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.ResumeAudio) && (
                            <HomeRow title={t('HeaderContinueListening', 'Continue listening')} items={resumeAudio} cardVariant="landscape" {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.ResumeBook) && (
                            <HomeRow title={t('HeaderContinueReading', 'Continue reading')} items={resumeBook} cardVariant="landscape" {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.LiveTv) && user?.Policy?.EnableLiveTvAccess && (
                            <>
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle}>{t('LiveTV', 'Live TV')}</h2>
                                    <div className={styles.row}>
                                        <a className={styles.pill} href="#/livetv?section=programs">{t('Programs', 'Programs')}</a>
                                        <a className={styles.pill} href="#/livetv?section=guide">{t('Guide', 'Guide')}</a>
                                        <a className={styles.pill} href="#/livetv?section=channels">{t('Channels', 'Channels')}</a>
                                        <a className={styles.pill} href="#/recordedtv">{t('Recordings', 'Recordings')}</a>
                                        <a className={styles.pill} href="#/livetv?section=dvrschedule">{t('Schedule', 'Schedule')}</a>
                                        <a className={styles.pill} href="#/livetv?section=seriesrecording">{t('Series', 'Series')}</a>
                                    </div>
                                </section>
                                <HomeRow title={t('HeaderOnNow', 'On Now')} items={onNow} {...rowProps} />
                            </>
                        )}

                        {sectionOrder.includes(HomeSectionType.NextUp) && (
                            <HomeRow title={t('NextUp', 'Next Up')} items={nextUp} cardVariant="landscape" {...rowProps} />
                        )}

                        {sectionOrder.includes(HomeSectionType.LatestMedia) && latestByLibrary.map(({ library, items }) => {
                            const ct = library.CollectionType;
                            const isMovies = ct === 'movies';
                            const isTvShows = ct === 'tvshows';
                            const linkHref = isMovies ? `#/movies?topParentId=${library.Id}`
                                : isTvShows ? `#/tv?topParentId=${library.Id}`
                                : undefined;
                            const linkText = isMovies ? 'All movies'
                                : isTvShows ? 'All shows'
                                : undefined;

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
                    </>
                )}
            </div>
        </Page>
    );
};

export default Home;
