import React, { type FC, useState, useEffect, useCallback } from 'react';
import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';

import styles from './TrackPreview.module.scss';

interface TrackPreviewProps {
    direction: 'previous' | 'next';
    isVisible: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEpisodeImageUrl(item: ItemDto, apiClient: any): string | null {
    // Try episode's own primary image
    if (item.ImageTags?.Primary) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Primary', tag: item.ImageTags.Primary, maxWidth: 400
        });
    }
    // Try episode's thumb
    if (item.ImageTags?.Thumb) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Thumb', tag: item.ImageTags.Thumb, maxWidth: 400
        });
    }
    // Fall back to series thumb
    if (item.SeriesId && item.SeriesThumbImageTag) {
        return apiClient.getScaledImageUrl(item.SeriesId, {
            type: 'Thumb', tag: item.SeriesThumbImageTag, maxWidth: 400
        });
    }
    // Fall back to parent thumb (season)
    if (item.ParentThumbItemId && item.ParentThumbImageTag) {
        return apiClient.getScaledImageUrl(item.ParentThumbItemId, {
            type: 'Thumb', tag: item.ParentThumbImageTag, maxWidth: 400
        });
    }
    // Fall back to series primary
    if (item.SeriesId && item.SeriesPrimaryImageTag) {
        return apiClient.getScaledImageUrl(item.SeriesId, {
            type: 'Primary', tag: item.SeriesPrimaryImageTag, maxWidth: 400
        });
    }
    return null;
}

function getTrackImageUrl(item: ItemDto | null): string | null {
    if (!item?.ServerId) return null;

    const apiClient = ServerConnections.getApiClient(item.ServerId);
    if (!apiClient) return null;

    if (item.Type === 'Episode') {
        return getEpisodeImageUrl(item, apiClient);
    }

    // For other types, use primary image
    const itemId = item.PrimaryImageItemId || item.Id;
    if (itemId && item.ImageTags?.Primary) {
        return apiClient.getScaledImageUrl(itemId, {
            type: 'Primary', tag: item.ImageTags.Primary, maxWidth: 400
        });
    }

    // For music, try album art
    if (item.AlbumId && item.AlbumPrimaryImageTag) {
        return apiClient.getScaledImageUrl(item.AlbumId, {
            type: 'Primary', tag: item.AlbumPrimaryImageTag, maxWidth: 400
        });
    }

    return null;
}

function getEpisodeInfo(item: ItemDto): { title: string; subtitle: string } {
    const title = item.Name || '';
    const parts: string[] = [];
    if (item.SeriesName) parts.push(item.SeriesName);
    if (item.ParentIndexNumber != null && item.IndexNumber != null) {
        parts.push(`S${item.ParentIndexNumber}:E${item.IndexNumber}`);
    } else if (item.IndexNumber != null) {
        parts.push(`E${item.IndexNumber}`);
    }
    return { title, subtitle: parts.join(' \u2022 ') };
}

function getAudioInfo(item: ItemDto): { title: string; subtitle: string } {
    const title = item.Name || '';
    const parts: string[] = [];
    if (item.Artists?.length) parts.push(item.Artists.join(', '));
    if (item.Album) parts.push(item.Album);
    return { title, subtitle: parts.join(' \u2022 ') };
}

function getTrackDisplayInfo(item: ItemDto | null): { title: string; subtitle: string } {
    if (!item) return { title: '', subtitle: '' };

    switch (item.Type) {
        case 'Episode':
            return getEpisodeInfo(item);
        case 'Audio':
            return getAudioInfo(item);
        case 'Movie':
            return {
                title: item.Name || '',
                subtitle: item.ProductionYear ? String(item.ProductionYear) : ''
            };
        default:
            return { title: item.Name || '', subtitle: '' };
    }
}

export const TrackPreview: FC<TrackPreviewProps> = ({ direction, isVisible }) => {
    const [targetItem, setTargetItem] = useState<ItemDto | null>(null);

    const loadTargetItem = useCallback(async () => {
        try {
            const player = playbackManager.getCurrentPlayer();
            if (!player) return;

            const playlist = await playbackManager.getPlaylist();
            if (!playlist || playlist.length <= 1) return;

            const currentIndex = playbackManager.getCurrentPlaylistIndex(player);
            const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

            if (targetIndex < 0 || targetIndex >= playlist.length) {
                setTargetItem(null);
                return;
            }

            setTargetItem(playlist[targetIndex] as ItemDto);
        } catch (err) {
            console.error('[TrackPreview] failed to load target item', err);
            setTargetItem(null);
        }
    }, [direction]);

    useEffect(() => {
        if (isVisible) {
            void loadTargetItem();
        }
    }, [isVisible, loadTargetItem]);

    if (!isVisible || !targetItem) {
        return null;
    }

    const imageUrl = getTrackImageUrl(targetItem);
    const { title, subtitle } = getTrackDisplayInfo(targetItem);

    const tooltipClass = direction === 'previous' ?
        `${styles.tooltip} ${styles.alignLeft}` :
        styles.tooltip;

    return (
        <div className={tooltipClass}>
            <div className={styles.thumb}>
                {imageUrl ? (
                    <img src={imageUrl} alt='' className={styles.thumbImg} />
                ) : (
                    <div className={styles.thumbPlaceholder}>
                        <span className='material-icons'>movie</span>
                    </div>
                )}
            </div>
            <div className={styles.meta}>
                <div className={styles.title}>{title}</div>
                {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            </div>
        </div>
    );
};

export default TrackPreview;
