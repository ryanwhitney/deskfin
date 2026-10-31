import React, { type FC, type MouseEvent, useMemo, useState } from 'react';
import { useFocusWithin } from 'react-aria';

import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';
import { DetailsMoreMenu } from './DetailsMoreMenu';
import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
import { IconButton } from 'apps/deskfin/components/button/IconButton';
import FavoriteButton from 'apps/deskfin/features/userData/components/FavoriteButton';
import PlayedButton from 'apps/deskfin/features/userData/components/PlayedButton';

import styles from './EpisodeRow.module.scss';
import { translateOr } from 'apps/deskfin/utils/translate';
import { ItemCrumb } from 'apps/deskfin/components/breadcrumb/ItemCrumb';

interface EpisodeRowProps {
    episode: ItemDto;
    queryKey: string[];
    showSeriesAndSeason?: boolean;
    isRovingFocused?: boolean;
    className?: string;
}

const t = translateOr;

const buildEpisodeThumb = (episode: ItemDto, maxWidth = 640) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !episode.Id) return '';
    const thumbTag = episode.ImageTags?.Thumb;
    const backdropTag = episode.BackdropImageTags?.[0];
    const primaryTag = episode.ImageTags?.Primary || episode.PrimaryImageTag;

    if (thumbTag) return apiClient.getImageUrl(episode.Id, { type: 'Thumb', tag: thumbTag, maxWidth });
    if (backdropTag) return apiClient.getImageUrl(episode.Id, { type: 'Backdrop', tag: backdropTag, maxWidth });
    if (primaryTag) return apiClient.getImageUrl(episode.Id, { type: 'Primary', tag: primaryTag, maxWidth });
    return '';
};

const formatEpisodeLabel = (episode: ItemDto) => {
    const s = episode.ParentIndexNumber ?? undefined;
    const e = episode.IndexNumber ?? undefined;
    const prefix = (s != null || e != null) ?
        `S${s ?? '?'}:E${e ?? '?'}` :
        '';
    const name = episode.Name || '';
    return prefix ? `${prefix}: ${name}` : name;
};

const stopPropagation = (e: MouseEvent) => e.stopPropagation();

export const EpisodeRow: FC<EpisodeRowProps> = ({ episode, queryKey, showSeriesAndSeason = true, isRovingFocused = false, className }) => {
    const href = `#/details?id=${episode.Id}`;
    const img = useMemo(() => buildEpisodeThumb(episode, 720), [ episode ]);
    const [ isFocusWithin, setIsFocusWithin ] = useState(false);
    const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setIsFocusWithin });
    const isActive = isRovingFocused || isFocusWithin;
    const { SeriesId: seriesId, SeriesName: seriesName, SeasonId: seasonId, SeasonName: seasonName } = episode;
    const crumbProps = {
        linkClassName: styles.subLink,
        textClassName: 'episodeSubText',
        tabIndex: isActive ? 0 : -1,
        onClick: stopPropagation
    };

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
        // The whole row is clickable for pointer users; keyboard users open it with Enter (EpisodesSection grid).
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={[ styles.row, className ?? '' ].filter(Boolean).join(' ')}
            onClick={onRowClick}
            {...focusWithinProps}
        >
            <div className={styles.thumb}>
                <div className={styles.thumbImg}>
                    {img ? (
                        <img
                            src={img}
                            alt={formatEpisodeLabel(episode)}
                            className={styles.thumbImgElement}
                        />
                    ) : (
                        <div className={styles.thumbPlaceholder} />
                    )}
                </div>
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
                        <ItemCrumb {...crumbProps} itemId={seriesId} name={seriesName} />
                        {seriesName && seasonName ? <span className={styles.subSep}>›</span> : null}
                        <ItemCrumb {...crumbProps} itemId={seasonId} name={seasonName} />
                    </div>
                ) : null}

                {episode.Overview ? (
                    <div className={styles.overview}>
                        {episode.Overview}
                    </div>
                ) : null}
            </div>

            {/* Only stops row clicks from firing when a button here is clicked */}
            <div className={styles.actions} role='presentation' onClick={stopPropagation}>
                <IconButton
                    className={styles.actionBtn}
                    aria-label={t('Play', 'Play')}
                    excludeFromTabOrder={!isActive}
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
