import React, { type FC, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';

import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import FavoriteButton from 'elements/emby-ratingbutton/FavoriteButton';
import PlayedButton from 'elements/emby-playstatebutton/PlayedButton';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import { DetailsMoreMenu } from './DetailsMoreMenu';
import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../../../assets/icons';

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
                    <JfIcon svg={IconSvgs.play} />
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
                <IconButton className='episodeActionBtn' size='small' title={t('Play', 'Play')} onClick={onPlayClick}>
                    <JfIcon svg={IconSvgs.play} />
                </IconButton>
                <PlayedButton
                    className='episodeActionBtn'
                    isPlayed={!!episode.UserData?.Played}
                    itemId={episode.Id}
                    itemType={episode.Type}
                    queryKey={queryKey}
                />
                <FavoriteButton
                    className='episodeActionBtn'
                    isFavorite={!!episode.UserData?.IsFavorite}
                    itemId={episode.Id}
                    queryKey={queryKey}
                />
                <DetailsMoreMenu item={episode} queryKey={queryKey} className='episodeActionBtn' />
            </div>
        </a>
    );
};


