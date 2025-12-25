import React, { type FC, useMemo, useState } from 'react';

import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { DetailsMoreMenu } from './DetailsMoreMenu';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { IconButton } from 'apps/experimental/components';
import FavoriteButton from 'apps/experimental/features/userData/components/FavoriteButton';
import PlayedButton from 'apps/experimental/features/userData/components/PlayedButton';

import styles from './EpisodeRow.module.scss';

interface EpisodeRowProps {
    episode: ItemDto;
    queryKey: string[];
    showSeriesAndSeason?: boolean;
    isRovingFocused?: boolean;
    className?: string;
}

const t = (key: string, fallback: string) => globalize.tryTranslate?.(key) ?? fallback;

const buildEpisodeThumb = (episode: ItemDto, maxWidth = 640) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !episode.Id) return '';
    const thumbTag = episode.ImageTags?.Thumb;
    const primaryTag = episode.ImageTags?.Primary || episode.PrimaryImageTag;
    const backdropTag = episode.BackdropImageTags?.[0];
    const tag = thumbTag || backdropTag || primaryTag;
    if (!tag) return '';

    const type = thumbTag ? 'Thumb' : (backdropTag ? 'Backdrop' : 'Primary');
    return apiClient.getImageUrl(episode.Id, { type, tag, maxWidth });
};

const formatEpisodeLabel = (episode: ItemDto) => {
    const s = (episode as any).ParentIndexNumber as number | undefined;
    const e = (episode as any).IndexNumber as number | undefined;
    const prefix = (s != null || e != null)
        ? `S${s ?? '?'}:E${e ?? '?'}`
        : '';
    const name = episode.Name || '';
    return prefix ? `${prefix}: ${name}` : name;
};

export const EpisodeRow: FC<EpisodeRowProps> = ({ episode, queryKey, showSeriesAndSeason = true, isRovingFocused = false, className }) => {
    const href = `#/details?id=${episode.Id}`;
    const img = useMemo(() => buildEpisodeThumb(episode, 720), [ episode ]);
    const [ isFocusWithin, setIsFocusWithin ] = useState(false);
    const isActive = isRovingFocused || isFocusWithin;

    const seriesId = (episode as any).SeriesId as string | undefined;
    const seriesName = (episode as any).SeriesName as string | undefined;
    const seasonId = (episode as any).SeasonId as string | undefined;
    const seasonName = (episode as any).SeasonName as string | undefined;

    const onPlayClick: React.MouseEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        void playbackManager.play({
            items: [ episode ],
            startPositionTicks: episode.UserData?.PlaybackPositionTicks || 0
        });
    };

    const onRowClick: React.MouseEventHandler = (e) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest('a,button,[role="menu"],[role="menuitem"]')) {
            return;
        }
        window.location.href = href;
    };

    return (
        <div
            className={[ styles.row, className ?? '' ].filter(Boolean).join(' ')}
            onClick={onRowClick}
            onFocusCapture={() => setIsFocusWithin(true)}
            onBlurCapture={(e) => {
                const next = (e.relatedTarget as Node | null);
                if (!next || !(e.currentTarget as HTMLElement).contains(next)) {
                    setIsFocusWithin(false);
                }
            }}
        >
            <div className={styles.thumb}>
                <div
                    className={styles.thumbImg}
                    style={{
                        backgroundImage: img ? `url(${img})` : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                    }}
                />
                <button
                    type='button'
                    className={styles.thumbPlay}
                    aria-label={t('Play', 'Play')}
                    title={t('Play', 'Play')}
                    tabIndex={isActive ? 0 : -1}
                    onClick={onPlayClick}
                >
                    <SvgIcon svg={IconSvgs.play} size={26} />
                </button>
            </div>

            <div className={styles.body}>
                <div className={styles.title} title={formatEpisodeLabel(episode)}>
                    {formatEpisodeLabel(episode)}
                </div>

                {showSeriesAndSeason && (seriesName || seasonName) ? (
                    <div className={styles.subheads}>
                        {seriesId && seriesName ? (
                            <a
                                className={styles.subLink}
                                href={`#/details?id=${seriesId}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {seriesName}
                            </a>
                        ) : seriesName ? <span className='episodeSubText'>{seriesName}</span> : null}
                        {seriesName && seasonName ? <span className={styles.subSep}>›</span> : null}
                        {seasonId && seasonName ? (
                            <a
                                className={styles.subLink}
                                href={`#/details?id=${seasonId}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {seasonName}
                            </a>
                        ) : seasonName ? <span className='episodeSubText'>{seasonName}</span> : null}
                    </div>
                ) : null}

                {episode.Overview ? (
                    <div className={styles.overview}>
                        {episode.Overview}
                    </div>
                ) : null}
            </div>

            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <IconButton
                    className={styles.actionBtn}
                    title={t('Play', 'Play')}
                    aria-label={t('Play', 'Play')}
                    tabIndex={isActive ? 0 : -1}
                    onClick={onPlayClick}
                    icon={<SvgIcon svg={IconSvgs.play} size={18} />}
                />
                <PlayedButton
                    className={styles.actionBtn}
                    isPlayed={!!episode.UserData?.Played}
                    itemId={episode.Id}
                    itemType={episode.Type}
                />
                <FavoriteButton
                    className={styles.actionBtn}
                    isFavorite={!!episode.UserData?.IsFavorite}
                    itemId={episode.Id}
                />
                <DetailsMoreMenu item={episode} queryKey={queryKey} className={styles.actionBtn} />
            </div>
        </div>
    );
};
