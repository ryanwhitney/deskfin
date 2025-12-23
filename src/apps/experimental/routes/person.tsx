import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import Page from 'components/Page';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import Cards from 'components/cardbuilder/Card/Cards';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import { useItem } from 'hooks/useItem';
import { useGetItems } from 'hooks/useFetchItems';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

const parseIncludeTypes = (raw: string | null): BaseItemKind[] | undefined => {
    if (!raw) return undefined;
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
    if (!parts.length) return undefined;
    return parts as unknown as BaseItemKind[];
};

export default function PersonPage() {
    const [ params ] = useSearchParams();
    const personId = params.get('id') || params.get('personId') || '';
    const include = parseIncludeTypes(params.get('type'));

    const { __legacyApiClient__ } = useApi();
    const { data: person } = useItem(personId || undefined);

    const queryKey = useMemo(() => ([ 'Person', personId ] as string[]), [ personId ]);

    const { data: itemsResult, isLoading } = useGetItems({
        personIds: personId ? [ personId ] : undefined,
        recursive: true,
        includeItemTypes: include,
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
            id='personPage'
            className='mainAnimatedPage libraryPage backdropPage'
            isBackButtonEnabled
            backDropType='movie,series'
        >
            <div className='padded-left padded-right padded-top'>
                <h1 className='sectionTitle'>
                    {person?.Name || globalize.tryTranslate?.('Person') || 'Person'}
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


