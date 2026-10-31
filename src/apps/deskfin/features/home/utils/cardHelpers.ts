import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';
import { toCount } from 'apps/deskfin/utils/count';

type ImageCandidate = { itemId: string; type: 'Primary' | 'Thumb' | 'Backdrop'; tag: string };

export const buildCardImageUrl = (
    item: {
        Id?: string | null;
        Type?: string | null;
        ImageTags?: Record<string, string | null> | null;
        PrimaryImageTag?: string | null;
        BackdropImageTags?: string[] | null;
        ParentBackdropImageTags?: string[] | null;
        ParentBackdropItemId?: string | null;
        ParentThumbImageTag?: string | null;
        ParentThumbItemId?: string | null;
        SeriesThumbImageTag?: string | null;
        SeriesId?: string | null;
    },
    options?: { variant?: 'portrait' | 'landscape'; maxWidth?: number }
): string => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item.Id) return '';

    const maxWidth = options?.maxWidth ?? 420;
    const variant = options?.variant ?? 'portrait';

    const candidates: ImageCandidate[] = [];

    // Prefer item-owned imagery first, then fall back to inherited series/parent imagery
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

    // Landscape cards prefer landscape imagery; portrait prefer primary
    const ordered = variant === 'landscape' ?
        candidates :
        [
            ...candidates.filter(c => c.type === 'Primary'),
            ...candidates.filter(c => c.type !== 'Primary')
        ];

    const chosen = ordered[0];
    if (!chosen) return '';

    return apiClient.getImageUrl(chosen.itemId, { type: chosen.type, tag: chosen.tag, maxWidth });
};

export interface CardMeta {
    title: string;
    titleHref: string;
    subtitle: string;
    subtitleHref: string | undefined;
}

/** "2019", "2019–2023" or "2019–present" for a series; empty without a start year. */
const formatYearRange = (start: number | undefined, end: number | undefined) => {
    if (!start) return '';
    if (!end) return `${start}–present`;
    return end === start ? `${start}` : `${start}–${end}`;
};

/** "S1, E8", "S1" or "E8" for an episode; empty when neither number is known. */
const formatEpisodeNumber = (season: number | null | undefined, episode: number | null | undefined) => {
    const parts = [];
    if (season != null) parts.push(`S${season}`);
    if (episode != null) parts.push(`E${episode}`);
    return parts.join(', ');
};

const getEpisodeMeta = (item: ItemDto, detailsHref: string): CardMeta => {
    const prefix = formatEpisodeNumber(item.ParentIndexNumber, item.IndexNumber);
    const epTitle = item.Name || '';
    return {
        title: item.SeriesName || item.Name || '',
        titleHref: item.SeriesId ? `#/details?id=${item.SeriesId}` : detailsHref,
        subtitle: prefix ? `${prefix}: ${epTitle}` : epTitle,
        subtitleHref: detailsHref
    };
};

const getDefaultMeta = (item: ItemDto, detailsHref: string): CardMeta => {
    const firstArtist = item.ArtistItems?.[0];
    return {
        title: item.Name || '',
        titleHref: detailsHref,
        subtitle: item.SeriesName || item.AlbumArtist || item.Artists?.[0] || firstArtist?.Name || '',
        subtitleHref: firstArtist?.Id ? `#/details?id=${firstArtist.Id}` : detailsHref
    };
};

export const getCardMeta = (item: ItemDto): CardMeta => {
    const detailsHref = `#/details?id=${item.Id}`;
    const year = item.ProductionYear ?? (item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : undefined);

    switch (item.Type) {
        case 'Movie':
            return { title: item.Name || '', titleHref: detailsHref, subtitle: year ? `${year}` : '', subtitleHref: undefined };
        case 'Series': {
            const endYear = item.EndDate ? new Date(item.EndDate).getFullYear() : undefined;
            return { title: item.Name || '', titleHref: detailsHref, subtitle: formatYearRange(year, endYear), subtitleHref: undefined };
        }
        case 'Episode':
            return getEpisodeMeta(item, detailsHref);
        default:
            return getDefaultMeta(item, detailsHref);
    }
};

export const getProgressPct = (item: ItemDto): number => {
    const pos = item.UserData?.PlaybackPositionTicks ?? 0;
    const rt = item.RunTimeTicks ?? 0;
    if (!pos || !rt) return 0;
    return Math.max(0, Math.min(100, Math.round((pos / rt) * 100)));
};

export const getOverlayCount = (item: ItemDto): number | undefined => {
    const raw =
        item.ChildCount
        ?? item.RecursiveItemCount
        ?? item.SeriesCount
        ?? item.EpisodeCount;

    const n = toCount(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;

    const t = item.Type;
    if (t === 'BoxSet' || t === 'Series' || t === 'Season') return n;
    return undefined;
};

// Debounce navigation to protect against ghost clicks
let ignoreHomeCardNavigateUntil = 0;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const suppressHomeCardNavigate = (ms = 500) => {
    ignoreHomeCardNavigateUntil = nowMs() + ms;
};

export const canNavigate = (): boolean => {
    return nowMs() >= ignoreHomeCardNavigateUntil;
};
