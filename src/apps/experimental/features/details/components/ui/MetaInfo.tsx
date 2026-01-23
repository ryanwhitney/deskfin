import React, { type FC } from "react";
import datetime from "scripts/datetime";
import type { ItemDto } from "types/base/models/item-dto";
import { ItemKind } from "types/base/models/item-kind";
import { ItemStatus } from "types/base/models/item-status";
import { MediaStreamType } from "@jellyfin/sdk/lib/generated-client/models/media-stream-type";

import freshIcon from "assets/img/fresh.svg";
import rottenIcon from "assets/img/rotten.svg";
import { IconSvgs } from "assets/icons";

import styles from "./MetaInfo.module.scss";

interface MetaInfoProps {
    item: ItemDto;
    showYear?: boolean;
    showRuntime?: boolean;
    showStarRating?: boolean;
    showCriticRating?: boolean;
    showResolution?: boolean;
    showVideoCodec?: boolean;
    showAudioChannels?: boolean;
    showAudioCodec?: boolean;
}

/**
 * Get year display for the item (handles series ranges like "2021-2024")
 */
function getYearDisplay(item: ItemDto): string | null {
    const { ProductionYear, Type, Status, EndDate } = item;

    if (!ProductionYear) return null;

    // Series: show year range
    if (Type === ItemKind.Series) {
        if (Status === ItemStatus.Continuing) {
            return `${ProductionYear}-`;
        }
        if (EndDate) {
            try {
                const endYear = datetime
                    .parseISO8601Date(EndDate)
                    .getFullYear();
                if (endYear !== ProductionYear) {
                    return `${ProductionYear}-${endYear}`;
                }
            } catch {
                // Fall through to simple year
            }
        }
    }

    // Skip year for episodes, seasons, persons
    if (
        Type === ItemKind.Episode ||
        Type === ItemKind.Season ||
        Type === ItemKind.Person
    ) {
        return null;
    }

    return String(ProductionYear);
}

/**
 * Get runtime display (e.g., "2h 35m")
 */
function getRuntimeDisplay(item: ItemDto): string | null {
    const { RunTimeTicks, Type } = item;

    if (!RunTimeTicks || Type === ItemKind.Series || Type === ItemKind.Book) {
        return null;
    }

    return datetime.getDisplayDuration(RunTimeTicks);
}

/**
 * Get resolution text from video stream
 */
function getResolutionText(item: ItemDto): string | null {
    const mediaSource = (item.MediaSources || [])[0];
    if (!mediaSource) return null;

    const videoStream = (mediaSource.MediaStreams || []).find(
        (s) => s.Type === MediaStreamType.Video,
    );
    if (!videoStream) return null;

    const { Width, Height, IsInterlaced } = videoStream;
    if (!Width || !Height) return null;

    const suffix = IsInterlaced ? "i" : "";

    if (Width >= 3800 || Height >= 2000) return "4K";
    if (Width >= 2500 || Height >= 1400) return `1440p${suffix}`;
    if (Width >= 1800 || Height >= 1000) return `1080p${suffix}`;
    if (Width >= 1200 || Height >= 700) return `720p${suffix}`;
    if (Width >= 700 || Height >= 400) return `480p${suffix}`;

    return null;
}

/**
 * Get video codec (e.g., "HEVC", "H.264")
 */
function getVideoCodec(item: ItemDto): string | null {
    const mediaSource = (item.MediaSources || [])[0];
    if (!mediaSource) return null;

    const videoStream = (mediaSource.MediaStreams || []).find(
        (s) => s.Type === MediaStreamType.Video,
    );

    return videoStream?.Codec?.toUpperCase() ?? null;
}

/**
 * Get audio channels display (e.g., "5.1", "7.1")
 */
function getAudioChannels(item: ItemDto): string | null {
    const mediaSource = (item.MediaSources || [])[0];
    if (!mediaSource) return null;

    const audioStream = (mediaSource.MediaStreams || []).find(
        (s) =>
            s.Type === MediaStreamType.Audio &&
            (s.Index === mediaSource.DefaultAudioStreamIndex ||
                mediaSource.DefaultAudioStreamIndex == null),
    );
    if (!audioStream) return null;

    const { Channels } = audioStream;
    if (!Channels) return null;

    switch (Channels) {
        case 8:
            return "7.1";
        case 7:
            return "6.1";
        case 6:
            return "5.1";
        case 2:
            return "2.0";
        default:
            return null;
    }
}

/**
 * Get audio codec (e.g., "AAC", "DTS-HD MA")
 */
function getAudioCodec(item: ItemDto): string | null {
    const mediaSource = (item.MediaSources || [])[0];
    if (!mediaSource) return null;

    const audioStream = (mediaSource.MediaStreams || []).find(
        (s) =>
            s.Type === MediaStreamType.Audio &&
            (s.Index === mediaSource.DefaultAudioStreamIndex ||
                mediaSource.DefaultAudioStreamIndex == null),
    );
    if (!audioStream) return null;

    const codec = (audioStream.Codec || "").toLowerCase();

    // Use profile for DTS variants
    if ((codec === "dca" || codec === "dts") && audioStream.Profile) {
        return audioStream.Profile;
    }

    return audioStream.Codec?.toUpperCase() ?? null;
}

/**
 * Resolution badge with knockout text effect
 * Width adjusts to content, height fixed at 17px, 6px horizontal padding
 */
const ResolutionBadge: FC<{ resolution: string }> = ({ resolution }) => {
    // Estimate width: ~7px per character at 12px bold font + 12px padding (6px each side)
    const charWidth = 7.5;
    const padding = 12;
    const textWidth = resolution.length * charWidth;
    const totalWidth = textWidth + padding;

    return (
        <svg
            className={styles.resolutionBadge}
            width={totalWidth}
            height={17}
            viewBox={`0 0 ${totalWidth} 17`}
        >
            <defs>
                <mask id={`res-mask-${resolution}`}>
                    <rect width="100%" height="100%" fill="white" />
                    <text
                        x="50%"
                        y="49%"
                        dominantBaseline="central"
                        textAnchor="middle"
                        fill="black"
                        fontSize="12"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                    >
                        {resolution}
                    </text>
                </mask>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill="white"
                mask={`url(#res-mask-${resolution})`}
                rx="3"
                ry="3"
            />
        </svg>
    );
};

const MetaInfo: FC<MetaInfoProps> = ({
    item,
    showYear = true,
    showRuntime = true,
    showStarRating = true,
    showCriticRating = true,
    showResolution = true,
    showVideoCodec = true,
    showAudioChannels = true,
    showAudioCodec = true,
}) => {
    const year = showYear ? getYearDisplay(item) : null;
    const runtime = showRuntime ? getRuntimeDisplay(item) : null;
    const communityRating = showStarRating ? item.CommunityRating : null;
    const criticRating = showCriticRating ? item.CriticRating : null;
    const resolution = showResolution ? getResolutionText(item) : null;
    const videoCodec = showVideoCodec ? getVideoCodec(item) : null;
    const audioChannels = showAudioChannels ? getAudioChannels(item) : null;
    const audioCodec = showAudioCodec ? getAudioCodec(item) : null;

    const hasPlainItems = year || runtime || communityRating || criticRating;
    const hasTechItems =
        resolution || videoCodec || audioChannels || audioCodec;

    if (!hasPlainItems && !hasTechItems) {
        return null;
    }

    return (
        <div className={styles.meta}>
            {/* Plain text items */}
            {year && <span className={styles.plainItem}>{year}</span>}
            {runtime && <span className={styles.plainItem}>{runtime}</span>}

            {/* Star rating */}
            {communityRating && (
                <span className={styles.ratingItem}>
                    <span
                        className={styles.starIcon}
                        dangerouslySetInnerHTML={{ __html: IconSvgs.star }}
                    />
                    {communityRating.toFixed(1)}
                </span>
            )}

            {/* Critic rating (Rotten Tomatoes) */}
            {criticRating && (
                <span className={styles.ratingItem}>
                    <img
                        src={criticRating >= 60 ? freshIcon : rottenIcon}
                        alt=""
                        className={styles.criticIcon}
                    />
                    {criticRating}%
                </span>
            )}

            {/* Resolution badge (knockout style - text cuts through white to show background) */}
            {resolution && <ResolutionBadge resolution={resolution} />}

            {/* Outlined tech badges */}
            {videoCodec && (
                <span className={styles.outlinedBadge}>{videoCodec}</span>
            )}
            {audioChannels && (
                <span className={styles.outlinedBadge}>{audioChannels}</span>
            )}
            {audioCodec && (
                <span className={styles.outlinedBadge}>{audioCodec}</span>
            )}
        </div>
    );
};

export default MetaInfo;
