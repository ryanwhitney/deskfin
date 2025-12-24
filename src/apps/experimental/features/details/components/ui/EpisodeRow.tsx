import React, { type FC, useMemo } from 'react';

import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { DetailsMoreMenu } from './DetailsMoreMenu';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { IconButton } from 'apps/experimental/shared/ui/button';
import FavoriteButton from 'apps/experimental/features/userData/components/FavoriteButton';
import PlayedButton from 'apps/experimental/features/userData/components/PlayedButton';

interface EpisodeRowProps {
    episode: ItemDto;
    queryKey: string[];
    showSeriesAndSeason?: boolean;
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

export const EpisodeRow: FC<EpisodeRowProps> = ({ episode, queryKey, showSeriesAndSeason = true }) => {
    const href = `#/details?id=${episode.Id}`;
    const img = useMemo(() => buildEpisodeThumb(episode, 720), [ episode ]);

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

    return (
        <a className='episodeRow' href={href}>
            <div className='episodeThumb'>
                <div
                    className='episodeThumbImg'
                    style={{
                        backgroundImage: img ? `url(${img})` : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                    }}
                />
                <button
                    type='button'
                    className='episodeThumbPlay'
                    aria-label={t('Play', 'Play')}
                    title={t('Play', 'Play')}
                    onClick={onPlayClick}
                >
                    <SvgIcon svg={IconSvgs.play} size={26} />
                </button>
            </div>

            <div className='episodeBody'>
                <div className='episodeTitle' title={formatEpisodeLabel(episode)}>
                    {formatEpisodeLabel(episode)}
                </div>

                {showSeriesAndSeason && (seriesName || seasonName) ? (
                    <div className='episodeSubheads'>
                        {seriesId && seriesName ? (
                            <a className='episodeSubLink' href={`#/details?id=${seriesId}`} onClick={(e) => e.stopPropagation()}>
                                {seriesName}
                            </a>
                        ) : seriesName ? <span className='episodeSubText'>{seriesName}</span> : null}
                        {seriesName && seasonName ? <span className='episodeSubSep'>›</span> : null}
                        {seasonId && seasonName ? (
                            <a className='episodeSubLink' href={`#/details?id=${seasonId}`} onClick={(e) => e.stopPropagation()}>
                                {seasonName}
                            </a>
                        ) : seasonName ? <span className='episodeSubText'>{seasonName}</span> : null}
                    </div>
                ) : null}

                {episode.Overview ? (
                    <div className='episodeOverview'>
                        {episode.Overview}
                    </div>
                ) : null}
            </div>

            <div className='episodeActions' onClick={(e) => e.preventDefault()}>
                <IconButton
                    className='episodeActionBtn'
                    title={t('Play', 'Play')}
                    aria-label={t('Play', 'Play')}
                    onClick={onPlayClick}
                    icon={<SvgIcon svg={IconSvgs.play} size={18} />}
                />
                <PlayedButton
                    className='expIconButton episodeActionBtn'
                    isPlayed={!!episode.UserData?.Played}
                    itemId={episode.Id}
                    itemType={episode.Type}
                />
                <FavoriteButton
                    className='expIconButton episodeActionBtn'
                    isFavorite={!!episode.UserData?.IsFavorite}
                    itemId={episode.Id}
                />
                <DetailsMoreMenu item={episode} queryKey={queryKey} className='expIconButton episodeActionBtn' />
            </div>
        </a>
    );
};
