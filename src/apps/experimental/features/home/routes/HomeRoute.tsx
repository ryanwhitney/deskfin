import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import * as userSettings from 'scripts/settings/userSettings';
import globalize from 'lib/globalize';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { playbackManager } from 'components/playback/playbackmanager';
import * as itemContextMenu from 'components/itemContextMenu';
import layoutManager from 'components/layoutManager';
import { DEFAULT_SECTIONS, HomeSectionType } from 'types/homeSectionType';
import type { ItemDto } from 'types/base/models/item-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs, getLegacyCommandIcon } from 'assets/icons';
import { LinkButton } from 'apps/experimental/components/shared';
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

type Command = { name?: string; id?: string; icon?: string; divider?: boolean };

const ItemMoreMenu: FC<{ item: ItemDto; user: any; onAfterAction: () => void }> = ({ item, user, onAfterAction }) => {
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);
    const [ commands, setCommands ] = useState<Command[]>([]);
    const menuPaperRef = useRef<HTMLDivElement | null>(null);

    const menuOptions = useMemo(() => ({
        item,
        user,
        play: true,
        queue: true,
        shuffle: true,
        instantMix: true,
        playlist: true,
        edit: true,
        editImages: true,
        editSubtitles: true,
        deleteItem: true,
        positionTo: anchorEl
    }), [anchorEl, item, user]);

    useEffect(() => {
        const load = async () => {
            if (!open) return;
            try {
                const cmds = await itemContextMenu.getCommands(menuOptions);
                setCommands(cmds as Command[]);
            } catch (e) {
                console.error('[Home] failed to get commands', e);
                setCommands([]);
            }
        };
        void load();
    }, [menuOptions, open]);

    // Prevent "click-through" when dismissing the menu by capturing outside click events.
    useEffect(() => {
        if (!open) return;

        const onWindowEvent = (e: Event) => {
            const target = e.target as Node | null;
            if (!target) return;

            // Allow clicks inside the menu and on the anchor button itself.
            if (menuPaperRef.current?.contains(target)) return;
            if (anchorEl?.contains(target)) return;

            // Swallow the click and also suppress any imminent "ghost click" navigation on the card.
            suppressHomeCardNavigate();
            e.preventDefault();
            e.stopPropagation();
            close();
        };

        window.addEventListener('click', onWindowEvent, true);
        return () => {
            window.removeEventListener('click', onWindowEvent, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, anchorEl]);

    const close = () => {
        suppressHomeCardNavigate();
        setAnchorEl(null);
    };

    const onCommand = async (id: string) => {
        close();
        try {
            const result = await itemContextMenu.executeCommand(item, id, menuOptions);
            if (result?.updated || result?.deleted) {
                onAfterAction();
            }
        } catch (e) {
            console.error('[Home] command failed', id, e);
        }
    };

    return (
        <>
            <IconButton
                className='homeIconBtn'
                size='small'
                title={t('ButtonMore', 'More')}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    suppressHomeCardNavigate();
                    setAnchorEl(e.currentTarget);
                }}
            >
                <SvgIcon svg={IconSvgs.ellipsis} size={18} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { ref: menuPaperRef } }}
            >
                {commands.map((cmd, idx) => {
                    if (cmd.divider) {
                        // eslint-disable-next-line react/no-array-index-key
                        return <div key={`div-${idx}`} className='homeMenuDivider' />;
                    }
                    if (!cmd.id) return null;
                    return (
                        <MenuItem
                            key={cmd.id}
                            onClick={(e) => {
                                // Ensure menu interactions never trigger the underlying card click.
                                e.preventDefault();
                                e.stopPropagation();
                                suppressHomeCardNavigate();
                                void onCommand(cmd.id!);
                            }}
                        >
                            {cmd.icon ? (
                                <ListItemIcon>
                                    {getLegacyCommandIcon(cmd.icon) ? (
                                        <SvgIcon svg={getLegacyCommandIcon(cmd.icon)!} size={18} />
                                    ) : null}
                                </ListItemIcon>
                            ) : null}
                            <ListItemText primary={cmd.name ?? cmd.id} />
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
};

const HomeCard: FC<{
    item: ItemDto;
    user: any;
    onAfterAction: () => void;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    variant?: 'portrait' | 'landscape';
}> = ({ item, user, onAfterAction, onToggleFavorite, onTogglePlayed, variant = 'portrait' }) => {
    const img = buildCardImageUrl(item, { variant, maxWidth: variant === 'landscape' ? 720 : 420 });
    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;
    const isResumable = !!item.UserData?.PlaybackPositionTicks && item.UserData.PlaybackPositionTicks > 0;

    const detailsHref = `#/details?id=${item.Id}`;
    const meta = useMemo(() => {
        const type = item.Type as string | undefined;

        const year = item.ProductionYear ?? (item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : undefined);
        const endYear = item.EndDate ? new Date(item.EndDate).getFullYear() : undefined;

        if (type === 'Movie') {
            return {
                title: item.Name || '',
                titleHref: detailsHref,
                subtitle: year ? `${year}` : '',
                subtitleHref: undefined
            };
        }

        if (type === 'Series') {
            const start = year;
            const subtitle = start
                ? (endYear ? (endYear === start ? `${start}` : `${start}–${endYear}`) : `${start}–present`)
                : '';
            return {
                title: item.Name || '',
                titleHref: detailsHref,
                subtitle,
                subtitleHref: undefined
            };
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

        // Generic fallback: title is item name; subtitle is best-effort (series/artist)
        const artistItems = (item as any).ArtistItems as Array<{ Id?: string; Name?: string }> | undefined;
        const firstArtist = artistItems?.[0];
        const subtitleText = (item.SeriesName || item.AlbumArtist || item.Artists?.[0] || firstArtist?.Name || '') as string;
        const subtitleHref = firstArtist?.Id ? `#/person?id=${firstArtist.Id}` : detailsHref;

        return {
            title: item.Name || '',
            titleHref: detailsHref,
            subtitle: subtitleText,
            subtitleHref
        };
    }, [detailsHref, item ]);

    const progressPct = (() => {
        const pos = item.UserData?.PlaybackPositionTicks ?? 0;
        const rt = item.RunTimeTicks ?? 0;
        if (!pos || !rt) return 0;
        return Math.max(0, Math.min(100, Math.round((pos / rt) * 100)));
    })();

    const overlayCount = (() => {
        // Best-effort: Jellyfin commonly uses `ChildCount` (e.g. BoxSet items, Series seasons, etc).
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
    })();

    const onPlay = async (resume?: boolean) => {
        try {
            await playbackManager.play({
                items: [ item ],
                startPositionTicks: resume ? (item.UserData?.PlaybackPositionTicks || 0) : 0
            });
        } catch (e) {
            console.error('[Home] failed to play', e);
        }
    };

    const onCenterPlayClick: React.MouseEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        void onPlay(isResumable);
    };

    const onCardClick: React.MouseEventHandler = (e) => {
        if (nowMs() < ignoreHomeCardNavigateUntil) return;
        const el = e.target as HTMLElement | null;
        if (el?.closest('a,button,.homeCardActions')) {
            return;
        }
        window.location.href = detailsHref;
    };

    return (
        <div className={variant === 'landscape' ? 'homeCard homeCard--landscape' : 'homeCard'} onClick={onCardClick}>
            <div className='homeThumbWrap'>
                <div
                    className='homeThumb'
                    style={{
                        backgroundImage: img ? `url(${img})` : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                    }}
                    aria-label={item.Name || t('LabelMediaDetails', 'Item')}>
                    {overlayCount != null ? (
                        <div className='homeCountBadge' aria-hidden='true'>
                            {overlayCount}
                        </div>
                    ) : null}

            <div className='homeCardActions'>
                <IconButton className='homeIconBtn' size='small' title={isFavorite ? t('Favorite', 'Favorite') : t('AddToFavorites', 'Add to favorites')} onClick={() => onToggleFavorite(item)}>
                    <span style={{ color: isFavorite ? '#ff4d6d' : undefined }}>
                        <SvgIcon svg={IconSvgs.heart} size={18} />
                    </span>
                </IconButton>
                <IconButton className='homeIconBtn' size='small' title={isPlayed ? t('Watched', 'Watched') : t('MarkPlayed', 'Mark played')} onClick={() => onTogglePlayed(item)}>
                    <span style={{ color: isPlayed ? '#4ade80' : undefined }}>
                        <SvgIcon svg={IconSvgs.checkmark} size={18} />
                    </span>
                </IconButton>
                <ItemMoreMenu item={item} user={user} onAfterAction={onAfterAction} />
            </div>
                </div>

                {playbackManager.canPlay(item) ? (
                    <button
                        type='button'
                        className='homePlayOverlay'
                        aria-label={t('Play', 'Play')}
                        title={t('Play', 'Play')}
                        onClick={onCenterPlayClick}
                    >
                        <SvgIcon svg={IconSvgs.play} size={18} />
                    </button>
                ) : null}
            </div>

            {progressPct > 0 ? (
                <div className='homeProgress'>
                    <div className='homeProgressBar' style={{ width: `${progressPct}%` }} />
                </div>
            ) : null}

            <div className='homeCardMeta'>
                <a className='homeCardTitle' href={meta.titleHref} title={meta.title}>
                    {meta.title}
                </a>
                {meta.subtitle ? (
                    meta.subtitleHref ? (
                        <a className='homeCardSub' href={meta.subtitleHref} title={meta.subtitle}>
                            {meta.subtitle}
                        </a>
                    ) : (
                        <div className='homeCardSub' title={meta.subtitle}>
                            {meta.subtitle}
                        </div>
                    )
                ) : null}
            </div>

        </div>
    );
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
    return (
        <section className='homeSection'>
            <h2 className='homeSectionTitle'>{title}</h2>
            <div className='homeRow'>
                {items.map(it => (
                    <HomeCard
                        key={it.Id}
                        item={it}
                        user={user}
                        onAfterAction={onAfterAction}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        variant={cardVariant}
                    />
                ))}
            </div>
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
