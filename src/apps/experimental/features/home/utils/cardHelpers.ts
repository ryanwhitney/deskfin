import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';

type ImageCandidate = { itemId: string; type: 'Primary' | 'Thumb' | 'Backdrop'; tag: string };

export const buildCardImageUrl = (
    item: {
        Id?: string | null;
        Type?: string | null;
        ImageTags?: Record<string, string> | null;
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
    const ordered = variant === 'landscape'
        ? candidates
        : [
            ...candidates.filter(c => c.type === 'Primary'),
            ...candidates.filter(c => c.type !== 'Primary')
        ];

    const chosen = ordered[0];
    if (!chosen) return '';

    return apiClient.getImageUrl(chosen.itemId, { type: chosen.type, tag: chosen.tag, maxWidth });
};

export const getCardMeta = (item: ItemDto) => {
    const detailsHref = `#/details?id=${item.Id}`;
    const type = item.Type as string | undefined;

    const year = item.ProductionYear ?? (item.PremiereDate ? new Date(item.PremiereDate).getFullYear() : undefined);
    const endYear = item.EndDate ? new Date(item.EndDate).getFullYear() : undefined;

    if (type === 'Movie') {
        return { title: item.Name || '', titleHref: detailsHref, subtitle: year ? `${year}` : '', subtitleHref: undefined };
    }

    if (type === 'Series') {
        const start = year;
        const subtitle = start ? (endYear ? (endYear === start ? `${start}` : `${start}–${endYear}`) : `${start}–present`) : '';
        return { title: item.Name || '', titleHref: detailsHref, subtitle, subtitleHref: undefined };
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

    const artistItems = (item as any).ArtistItems as Array<{ Id?: string; Name?: string }> | undefined;
    const firstArtist = artistItems?.[0];
    const subtitleText = (item.SeriesName || item.AlbumArtist || item.Artists?.[0] || firstArtist?.Name || '') as string;
    const subtitleHref = firstArtist?.Id ? `#/person?id=${firstArtist.Id}` : detailsHref;

    return { title: item.Name || '', titleHref: detailsHref, subtitle: subtitleText, subtitleHref };
};

export const getProgressPct = (item: ItemDto): number => {
    const pos = item.UserData?.PlaybackPositionTicks ?? 0;
    const rt = item.RunTimeTicks ?? 0;
    if (!pos || !rt) return 0;
    return Math.max(0, Math.min(100, Math.round((pos / rt) * 100)));
};

export const getOverlayCount = (item: ItemDto): number | undefined => {
    const raw =
        (item as any).ChildCount ??
        (item as any).RecursiveItemCount ??
        (item as any).SeriesCount ??
        (item as any).EpisodeCount;

    const n = typeof raw === 'number' ? raw : (typeof raw === 'string' ? parseInt(raw, 10) : 0);
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
