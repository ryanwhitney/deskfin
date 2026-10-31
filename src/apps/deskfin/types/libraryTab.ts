import { LibraryTab as UpstreamLibraryTab } from 'types/libraryTab';

/**
 * Upstream's library tabs plus the ones only deskfin has. Deskfin's extra values are typed as upstream's enum
 * so tab values can be passed to upstream helpers (which treat unknown tabs like any other non-special tab).
 */
export const LibraryTab = {
    ...UpstreamLibraryTab,
    Years: 'years' as unknown as UpstreamLibraryTab
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- value and type share a name, like an enum
export type LibraryTab = UpstreamLibraryTab;
