import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import YearsItemsContainer from './YearsItemsContainer';
import type { ParentId } from 'types/library';

interface YearsViewProps {
    parentId: ParentId;
    itemType: BaseItemKind[];
}

const YearsView: FC<YearsViewProps> = ({ parentId, itemType }) => {
    return (
        <YearsItemsContainer
            parentId={parentId}
            itemType={itemType}
        />
    );
};

export default YearsView;
