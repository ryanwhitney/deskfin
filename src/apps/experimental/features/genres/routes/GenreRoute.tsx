import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import Page from 'components/Page';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import Cards from 'components/cardbuilder/Card/Cards';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import { useItem } from 'hooks/useItem';
import { useGetItems } from 'hooks/useFetchItems';
import { useTitle } from 'apps/experimental/utils/useTitle';
import { formatItemTitle } from 'apps/experimental/utils/titleUtils';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

const getIncludeItemTypesForGenre = (genre: ItemDto | undefined): BaseItemKind[] | undefined => {
    const t = genre?.Type;
    if (t === 'MusicGenre') return [ BaseItemKind.MusicAlbum ];

    const ct = genre?.CollectionType;
    if (ct === CollectionType.Movies) return [ BaseItemKind.Movie ];
    if (ct === CollectionType.Tvshows) return [ BaseItemKind.Series ];

    // General genre: show the usual mix.
    return [ BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Video ];
};

export default function GenrePage() {
    const [ params ] = useSearchParams();
    const genreId = params.get('id') || params.get('genreId') || '';
    const parentId = params.get('parentId') || params.get('topParentId') || undefined;

    const { __legacyApiClient__ } = useApi();
    const { data: genre } = useItem(genreId || undefined);

    // Set title based on genre name
    useTitle(genre ? formatItemTitle(genre.Name, genre.Type) : undefined);

    const queryKey = useMemo(() => ([ 'Genre', genreId, parentId ] as string[]), [ genreId, parentId ]);
    const includeItemTypes = useMemo(() => getIncludeItemTypesForGenre(genre), [ genre ]);

    const { data: itemsResult, isLoading } = useGetItems({
        genreIds: genreId ? [ genreId ] : undefined,
        parentId,
        recursive: true,
        includeItemTypes,
        sortBy: [ ItemSortBy.SortName ],
        sortOrder: [ SortOrder.Ascending ],
        fields: [ ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount ],
        imageTypeLimit: 1,
        enableImageTypes: [ ImageType.Primary, ImageType.Backdrop ]
    });

    const items = (itemsResult?.Items || []) as ItemDto[];

    const cardOptions: CardOptions = useMemo(() => ({
        scalable: true,
        overlayPlayButton: true,
        showTitle: true,
        showParentTitle: true,
        showYear: true,
        serverId: __legacyApiClient__?.serverId(),
        queryKey
    }), [ __legacyApiClient__, queryKey ]);

    return (
        <Page
            id='genrePage'
            className='mainAnimatedPage libraryPage backdropPage'
            isBackButtonEnabled
            backDropType='movie,series'
        >
            <div className='padded-left padded-right padded-top'>
                <h1 className='sectionTitle'>
                    {genre?.Name || globalize.tryTranslate?.('Genres') || 'Genre'}
                </h1>
            </div>

            {isLoading ? (
                <div className='padded-left padded-right'><Loading /></div>
            ) : (
                <ItemsContainer
                    className='centered padded-left padded-right vertical-wrap'
                    queryKey={queryKey}
                >
                    {items.length ? (
                        <Cards items={items} cardOptions={cardOptions} />
                    ) : (
                        <NoItemsMessage message='MessageNoItemsAvailable' />
                    )}
                </ItemsContainer>
            )}
        </Page>
    );
}


