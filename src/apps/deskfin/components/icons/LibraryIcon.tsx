import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { FC } from 'react';

import { MetaView } from 'apps/deskfin/app/navigation/metaView';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

interface LibraryIconProps {
    item: BaseItemDto
}

const LibraryIcon: FC<LibraryIconProps> = ({
    item
}) => {
    if (item.Id === MetaView.Favorites.Id) {
        return <SvgIcon svg={IconSvgs.heart} size={18} />;
    }

    switch (item.CollectionType) {
        case CollectionType.Movies:
            return <SvgIcon svg={IconSvgs.movie} size={18} />;
        case CollectionType.Music:
            return <SvgIcon svg={IconSvgs.playback} size={18} />;
        case CollectionType.Homevideos:
        case CollectionType.Photos:
            return <SvgIcon svg={IconSvgs.photo} size={18} />;
        case CollectionType.Livetv:
            return <SvgIcon svg={IconSvgs.liveTv} size={18} />;
        case CollectionType.Tvshows:
            return <SvgIcon svg={IconSvgs.tv} size={18} />;
        case CollectionType.Trailers:
            return <SvgIcon svg={IconSvgs.movie} size={18} />;
        case CollectionType.Musicvideos:
            return <SvgIcon svg={IconSvgs.playback} size={18} />;
        case CollectionType.Books:
            return <SvgIcon svg={IconSvgs.info} size={18} />;
        case CollectionType.Boxsets:
            return <SvgIcon svg={IconSvgs.collection} size={18} />;
        case CollectionType.Playlists:
            return <SvgIcon svg={IconSvgs.addTo} size={18} />;
        case undefined:
            return <SvgIcon svg={IconSvgs.info} size={18} />;
        default:
            return <SvgIcon svg={IconSvgs.collection} size={18} />;
    }
};

export default LibraryIcon;
