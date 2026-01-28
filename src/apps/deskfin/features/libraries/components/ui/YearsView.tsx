import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { FC } from 'react';
import YearsItemsContainer from './YearsItemsContainer';
import type { ParentId } from 'types/library';

interface YearsViewProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
}

const YearsView: FC<YearsViewProps> = ({ parentId, collectionType, itemType }) => {
    return (
        <YearsItemsContainer
            parentId={parentId}
            collectionType={collectionType}
            itemType={itemType}
        />
    );
};

export default YearsView;
