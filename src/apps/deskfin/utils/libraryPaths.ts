import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

const LIBRARY_PAGES: Partial<Record<string, string>> = {
    [CollectionType.Movies]: '/movies',
    [CollectionType.Tvshows]: '/tv',
    [CollectionType.Music]: '/music',
    [CollectionType.Homevideos]: '/homevideos',
    [CollectionType.Books]: '/books',
    [CollectionType.Boxsets]: '/collections'
};

/** Deskfin's page for a library, or undefined for library types without one (they use the legacy list). */
export const getLibraryPath = (collectionType: string | null | undefined, libraryId: string | null | undefined) => {
    if (collectionType === CollectionType.Livetv) return '/livetv';
    const page = LIBRARY_PAGES[collectionType ?? ''];
    return page ? `${page}?topParentId=${libraryId}` : undefined;
};
