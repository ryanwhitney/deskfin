import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import { useGetStudios } from 'hooks/useFetchItems';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Loading from 'components/loading/LoadingComponent';
import NetworksSectionContainer from './NetworksSectionContainer';
import type { ParentId } from 'types/library';

interface NetworksViewProps {
    parentId: ParentId;
    itemType: BaseItemKind[];
}

const NetworksView: FC<NetworksViewProps> = ({ parentId, itemType }) => {
    const { isLoading, data: studios } = useGetStudios(parentId, itemType);

    if (isLoading) {
        return <Loading />;
    }

    if (!studios?.length) {
        return <NoItemsMessage message='MessageNoNetworksAvailable' />;
    }

    return (
        <>
            {studios.map((studio) => (
                <NetworksSectionContainer
                    key={studio.Id}
                    parentId={parentId}
                    itemType={itemType}
                    studio={studio}
                />
            ))}
        </>
    );
};

export default NetworksView;
