import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { FC } from 'react';

import { MetaView } from '../constants/metaView';
import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../../assets/icons';

interface LibraryIconProps {
    item: BaseItemDto
}

const LibraryIcon: FC<LibraryIconProps> = ({
    item
}) => {
    if (item.Id === MetaView.Favorites.Id) {
        return <JfIcon svg={IconSvgs.heart} />;
    }

    switch (item.CollectionType) {
        case CollectionType.Movies:
            return <JfIcon svg={IconSvgs.movie} />;
        case CollectionType.Music:
            return <JfIcon svg={IconSvgs.playback} />;
        case CollectionType.Homevideos:
        case CollectionType.Photos:
            return <JfIcon svg={IconSvgs.photo} />;
        case CollectionType.Livetv:
            return <JfIcon svg={IconSvgs.liveTv} />;
        case CollectionType.Tvshows:
            return <JfIcon svg={IconSvgs.tv} />;
        case CollectionType.Trailers:
            return <JfIcon svg={IconSvgs.movie} />;
        case CollectionType.Musicvideos:
            return <JfIcon svg={IconSvgs.playback} />;
        case CollectionType.Books:
            return <JfIcon svg={IconSvgs.info} />;
        case CollectionType.Boxsets:
            return <JfIcon svg={IconSvgs.collection} />;
        case CollectionType.Playlists:
            return <JfIcon svg={IconSvgs.addTo} />;
        case undefined:
            return <JfIcon svg={IconSvgs.info} />;
        default:
            return <JfIcon svg={IconSvgs.collection} />;
    }
};

export default LibraryIcon;
