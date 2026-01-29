import React, { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Squircle } from '@squircle-js/react';
import { useQuery } from '@tanstack/react-query';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';

import { useApi } from 'hooks/useApi';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { buildCardImageUrl } from 'apps/deskfin/features/home/utils/cardHelpers';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import styles from './PlaylistCard.module.scss';

interface PlaylistCardProps {
    playlist: BaseItemDto;
    serverId?: string;
}

export const PlaylistCard: FC<PlaylistCardProps> = ({ playlist, serverId }) => {
    const { api, user } = useApi();

    // Fetch first few items from the playlist for preview images
    const { data: previewItems = [] } = useQuery({
        queryKey: ['PlaylistPreview', playlist.Id],
        queryFn: async () => {
            if (!api || !user?.Id || !playlist.Id) return [];

            const response = await getItemsApi(api).getItems({
                userId: user.Id,
                parentId: playlist.Id,
                limit: 4,
                fields: [ItemFields.PrimaryImageAspectRatio],
                enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop]
            });

            return response.data.Items || [];
        },
        enabled: !!api && !!user?.Id && !!playlist.Id,
        staleTime: 60 * 1000 // 1 minute
    });

    const href = `/list?id=${playlist.Id}&serverId=${serverId || user?.ServerId}`;
    const itemCount = playlist.ChildCount || 0;

    // Get preview image URLs
    const previewImages = previewItems
        .slice(0, 4)
        .map(item => buildCardImageUrl(item, { variant: 'portrait', maxWidth: 200 }))
        .filter(Boolean);

    return (
        <Link to={href} className={styles.card}>
            <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className={styles.thumbBorder}
            >
                <Squircle
                    cornerRadius={14}
                    cornerSmoothing={1}
                    className={styles.thumbWrap}
                >
                    <div className={styles.thumb}>
                        {previewImages.length === 0 ? (
                            <div className={styles.placeholder}>
                                <SvgIcon svg={IconSvgs.listBullet} size={48} />
                            </div>
                        ) : previewImages.length === 1 ? (
                            <img
                                src={previewImages[0]}
                                alt=""
                                className={styles.singleImage}
                            />
                        ) : (
                            <div className={styles.collage}>
                                {previewImages.slice(0, 4).map((url, idx) => (
                                    <div
                                        key={idx}
                                        className={styles.collageItem}
                                        style={{ backgroundImage: `url(${url})` }}
                                    />
                                ))}
                            </div>
                        )}

                        {itemCount > 0 && (
                            <div className={styles.countBadge} aria-hidden="true">
                                {itemCount}
                            </div>
                        )}
                    </div>
                </Squircle>
            </Squircle>

            <div className={styles.meta}>
                <h3 className={styles.title}>{playlist.Name || 'Unnamed Playlist'}</h3>
                <p className={styles.subtitle}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
            </div>
        </Link>
    );
};
