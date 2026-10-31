import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

/**
 * A player instance from upstream's (untyped) playbackManager. Deskfin never reads its properties;
 * it only hands it back to playbackManager.
 */
export type Player = object;

/** An entry from playbackManager's aspect ratio / playback rate lists. */
export interface PlayerOption {
    id: string;
    name: string;
}

/** An entry from upstream's qualityOptions.getVideoQualityOptions(). */
export interface QualityOption {
    name: string;
    bitrate?: number;
    secondaryText?: string;
    selected?: boolean;
}

/** Subtitle and audio tracks are the media source's streams. */
export type Track = MediaStream;
