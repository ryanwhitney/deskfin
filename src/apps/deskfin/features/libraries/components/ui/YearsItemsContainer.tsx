import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import { useGetYears } from '../../hooks/useLibraryQueries';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Loading from 'components/loading/LoadingComponent';
import YearsSectionContainer from './YearsSectionContainer';
import type { ParentId } from 'types/library';

interface YearsItemsContainerProps {
    parentId: ParentId;
    itemType: BaseItemKind[];
}

const YearsItemsContainer: FC<YearsItemsContainerProps> = ({
    parentId,
    itemType
// eslint-disable-next-line sonarjs/function-return-type
}) => {
    const { isLoading, data: yearsResult } = useGetYears(itemType, parentId);

    if (isLoading) {
        return <Loading />;
    }

    if (!yearsResult?.Items?.length) {
        return <NoItemsMessage message='MessageNoItemsAvailable' />;
    }

    return yearsResult.Items.map((year) => (
        <YearsSectionContainer
            key={year.Id}
            parentId={parentId}
            itemType={itemType}
            year={year}
        />
    ));
};

export default YearsItemsContainer;
