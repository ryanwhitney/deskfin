import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckIcon from '@mui/icons-material/Check';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import * as userSettings from 'scripts/settings/userSettings';
import globalize from '../../../lib/globalize';
import { clearBackdrop } from '../../../components/backdrop/backdrop';
import Page from '../../../components/Page';
import { playbackManager } from 'components/playback/playbackmanager';
import * as itemContextMenu from 'components/itemContextMenu';
import layoutManager from 'components/layoutManager';
import { DEFAULT_SECTIONS, HomeSectionType } from 'types/homeSectionType';
import Events from 'utils/events';
import { EventType } from 'constants/eventType';
import type { ItemDto } from 'types/base/models/item-dto';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import './home.modern.scss';

const t = (key: string, fallback: string) => {
    return globalize.tryTranslate?.(key) ?? fallback;
};

const buildPrimaryImageUrl = (item: { Id?: string | null; ImageTags?: Record<string, string> | null; PrimaryImageTag?: string | null }, maxWidth = 420) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item.Id) return '';
    const tag = item.PrimaryImageTag || item.ImageTags?.Primary;
    if (!tag) return '';
    return apiClient.getImageUrl(item.Id, { type: 'Primary', tag, maxWidth });
};

type Command = { name?: string; id?: string; icon?: string; divider?: boolean };

const ItemMoreMenu: FC<{ item: ItemDto; user: any; onAfterAction: () => void }> = ({ item, user, onAfterAction }) => {
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);
    const [ commands, setCommands ] = useState<Command[]>([]);

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

    const close = () => setAnchorEl(null);

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
            <IconButton className='homeIconBtn' size='small' title={t('ButtonMore', 'More')} onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {commands.map((cmd, idx) => {
                    if (cmd.divider) {
                        // eslint-disable-next-line react/no-array-index-key
                        return <div key={`div-${idx}`} className='homeMenuDivider' />;
                    }
                    if (!cmd.id) return null;
                    return (
                        <MenuItem key={cmd.id} onClick={() => onCommand(cmd.id!)}>
                            {cmd.icon ? (
                                <ListItemIcon>
                                    <span className='material-icons' aria-hidden='true'>{cmd.icon}</span>
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
}> = ({ item, user, onAfterAction, onToggleFavorite, onTogglePlayed }) => {
    const img = buildPrimaryImageUrl(item, 420);
    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;
    const isResumable = !!item.UserData?.PlaybackPositionTicks && item.UserData.PlaybackPositionTicks > 0;

    const progressPct = (() => {
        const pos = item.UserData?.PlaybackPositionTicks ?? 0;
        const rt = item.RunTimeTicks ?? 0;
        if (!pos || !rt) return 0;
        return Math.max(0, Math.min(100, Math.round((pos / rt) * 100)));
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

    return (
        <div className='homeCard'>
            <a
                className='homeCardLink'
                href={`#/details?id=${item.Id}`}
                aria-label={item.Name || t('LabelMediaDetails', 'Details')}
            >
                <div
                    className='homeThumb'
                    style={{
                        backgroundImage: img ? `url(${img})` : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                    }}
                />
            </a>

            {progressPct > 0 ? (
                <div className='homeProgress'>
                    <div className='homeProgressBar' style={{ width: `${progressPct}%` }} />
                </div>
            ) : null}

            <div className='homeCardMeta'>
                <div className='homeCardTitle' title={item.Name || ''}>{item.Name}</div>
                <div className='homeCardSub'>
                    {item.SeriesName || item.AlbumArtist || item.Artists?.[0] || ''}
                </div>
            </div>

            <div className='homeCardActions'>
                <IconButton className='homeIconBtn' size='small' title={isResumable ? t('Resume', 'Resume') : t('Play', 'Play')} onClick={() => onPlay(isResumable)}>
                    {isResumable ? <ReplayIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton className='homeIconBtn' size='small' title={isFavorite ? t('Favorite', 'Favorite') : t('AddToFavorites', 'Add to favorites')} onClick={() => onToggleFavorite(item)}>
                    <FavoriteIcon color={isFavorite ? 'error' : undefined} />
                </IconButton>
                <IconButton className='homeIconBtn' size='small' title={isPlayed ? t('Watched', 'Watched') : t('MarkPlayed', 'Mark played')} onClick={() => onTogglePlayed(item)}>
                    <CheckIcon color={isPlayed ? 'success' : undefined} />
                </IconButton>
                <ItemMoreMenu item={item} user={user} onAfterAction={onAfterAction} />
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
}> = ({ title, items, user, onAfterAction, onToggleFavorite, onTogglePlayed }) => {
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

    const refreshAll = useCallback(async () => {
        if (!apiClient || !user?.Id) return;
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

            if (sectionOrder.includes(HomeSectionType.ResumeAudio)) {
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

            if (sectionOrder.includes(HomeSectionType.ResumeBook)) {
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

            if (sectionOrder.includes(HomeSectionType.ActiveRecordings)) {
                tasks.push(apiClient.getLiveTvRecordings({
                    userId: apiClient.getCurrentUserId(),
                    Limit: 12,
                    Fields: 'PrimaryImageAspectRatio',
                    EnableTotalRecordCount: false,
                    IsLibraryItem: null,
                    IsInProgress: true
                }).then(r => setActiveRecordings((r?.Items || []) as ItemDto[])));
            }

            if (sectionOrder.includes(HomeSectionType.LiveTv) && user?.Policy?.EnableLiveTvAccess) {
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

            if (sectionOrder.includes(HomeSectionType.LatestMedia) && userViews.length) {
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

    const onAfterAction = useCallback(() => {
        void refreshAll();
    }, [refreshAll]);

    const onToggleFavorite = useCallback(async (item: ItemDto) => {
        try {
            await toggleFavorite({ itemId: item.Id!, isFavorite: !!item.UserData?.IsFavorite });
            void refreshAll();
        } catch (e) {
            console.error('[Home] favorite failed', e);
        }
    }, [refreshAll, toggleFavorite]);

    const onTogglePlayed = useCallback(async (item: ItemDto) => {
        try {
            await togglePlayed({ itemId: item.Id!, isPlayed: !!item.UserData?.Played });
            void refreshAll();
        } catch (e) {
            console.error('[Home] played failed', e);
        }
    }, [refreshAll, togglePlayed]);

    useEffect(() => {
        clearBackdrop();
        documentRef.current.querySelector('.skinHeader')?.classList.add('noHomeButtonHeader');
        void refreshAll();

        return () => {
            documentRef.current.querySelector('.skinHeader')?.classList.remove('noHomeButtonHeader');
        };
    }, [refreshAll]);

    useEffect(() => {
        const doc = documentRef.current;
        const rerender = () => void refreshAll();
        if (doc) Events.on(doc, EventType.HEADER_RENDERED, rerender);
        return () => {
            if (doc) Events.off(doc, EventType.HEADER_RENDERED, rerender);
        };
    }, [refreshAll]);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);
    useEffect(() => {
        void (async () => {
            (await libraryMenu).setTitle(null);
        })();
    }, [libraryMenu]);

    const sectionOrder = useMemo(() => getAllSectionsToShow(10), []);

    return (
            <Page
                id='indexPage'
            className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage'
                isBackButtonEnabled={false}
                backDropType='movie,series,book'
            >
            <div className='homeModern'>
                {loading ? <div className='homeLoading'>{t('Loading', 'Loading…')}</div> : null}

                {/* Libraries */}
                {sectionOrder.includes(HomeSectionType.SmallLibraryTiles) && userViews.length ? (
                    <section className='homeSection'>
                        <h2 className='homeSectionTitle'>{t('HeaderMyMedia', 'My Media')}</h2>
                        <div className='homeRow'>
                            {userViews.map(v => (
                                <a
                                    key={v.Id}
                                    className='homeLibraryTile'
                                    href={`#/list?parentId=${v.Id}`}
                                    aria-label={v.Name ?? t('HeaderMyMedia', 'Library')}
                                >
                                    <div className='homeLibraryTitle'>{v.Name ?? t('HeaderMyMedia', 'Library')}</div>
                                </a>
                            ))}
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
                </div>
            </Page>
    );
};

export default Home;
