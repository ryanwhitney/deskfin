import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Page from 'components/Page';
import PrimaryMediaInfo from 'components/mediainfo/PrimaryMediaInfo';
import MediaInfoStats from 'components/mediainfo/MediaInfoStats';
import { useItem } from 'hooks/useItem';
import { useApi } from 'hooks/useApi';
import FavoriteButton from 'elements/emby-ratingbutton/FavoriteButton';
import PlayedButton from 'elements/emby-playstatebutton/PlayedButton';
import PlayOrResumeButton from 'apps/experimental/features/details/components/buttons/PlayOrResumeButton';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';
import { DetailsMoreMenu } from 'apps/experimental/components/details/DetailsMoreMenu';

import './details.modern.scss';

const buildImageUrl = (item: ItemDto | undefined, type: 'Primary' | 'Backdrop', maxWidth = 900) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item?.Id) return '';

    // Try common tags
    const primaryTag = item.ImageTags?.Primary || item.PrimaryImageTag;
    const backdropTag = item.BackdropImageTags?.[0];
    const tag = type === 'Primary' ? primaryTag : backdropTag;
    if (!tag) return '';

    return apiClient.getImageUrl(item.Id, {
        type,
        tag,
        maxWidth
    });
};

export default function DetailsPage() {
    const [ params ] = useSearchParams();
    const itemId = params.get('id') || '';

    const { user } = useApi();
    const { data: item, isLoading, error } = useItem(itemId);

    const primaryUrl = useMemo(() => buildImageUrl(item, 'Primary', 600), [ item ]);
    const backdropUrl = useMemo(() => buildImageUrl(item, 'Backdrop', 1400), [ item ]);

    const queryKey = useMemo(() => {
        return user?.Id
            ? ([ 'User', user.Id, 'Items', itemId ] as string[])
            : ([ 'Items', itemId ] as string[]);
    }, [ user?.Id, itemId ]);

    if (!itemId) {
        return (
            <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
                <div className='detailsContainer'>
                    <h1 className='detailsTitle'>{globalize.translate('Error')}</h1>
                    <div className='detailsMeta'>Missing id</div>
                </div>
            </Page>
        );
    }

    if (isLoading) {
        return (
            <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
                <div className='detailsContainer'>Loading…</div>
            </Page>
        );
    }

    if (error || !item) {
        return (
            <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
                <div className='detailsContainer'>
                    <h1 className='detailsTitle'>{globalize.translate('Error')}</h1>
                    <div className='detailsMeta'>Failed to load item</div>
                </div>
            </Page>
        );
    }

    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;
    const itemType = item.Type as ItemKind;

    const directors = (item.People || []).filter(p => p.Type === 'Director');
    const writers = (item.People || []).filter(p => p.Type === 'Writer');
    const actors = (item.People || []).filter(p => p.Type === 'Actor');
    const guests = (item.People || []).filter(p => p.Type === 'GuestStar');

    return (
        <Page id='detailsPage' className='detailsPage' isBackButtonEnabled>
            <div className='detailsHero' style={backdropUrl ? { backgroundImage: `url(${backdropUrl})` } : undefined}>
                <div className='detailsHeroOverlay' />
            </div>

            <div className='detailsContainer'>
                <div className='detailsTop'>
                    <div className='detailsPoster' style={primaryUrl ? { backgroundImage: `url(${primaryUrl})` } : undefined} />

                    <div className='detailsMain'>
                        <h1 className='detailsTitle'>{item.Name}</h1>
                        <div className='detailsMeta'>
                            <PrimaryMediaInfo
                                className='detailsMetaInfo'
                                infoclass='detailsMetaPill'
                                item={item}
                                showYearInfo
                                showRuntimeInfo
                                showOfficialRatingInfo
                                showStarRatingInfo
                                showCaptionIndicatorInfo
                                showCriticRatingInfo
                            />
                            <MediaInfoStats
                                className='detailsMetaInfo'
                                infoclass='detailsMetaPill'
                                item={item}
                                showResolutionInfo
                                showVideoStreamCodecInfo
                                showAudoChannelInfo
                                showAudioStreamCodecInfo
                            />
                        </div>

                        {item.Overview ? <p className='detailsOverview'>{item.Overview}</p> : null}

                        <div className='detailsActions'>
                            <PlayOrResumeButton item={item} isResumable={!!item.UserData?.PlaybackPositionTicks} />
                            <PlayedButton
                                className='detailsIconBtn'
                                isPlayed={isPlayed}
                                itemId={item.Id}
                                itemType={item.Type}
                                queryKey={queryKey}
                            />
                            <FavoriteButton
                                className='detailsIconBtn'
                                isFavorite={isFavorite}
                                itemId={item.Id}
                                queryKey={queryKey}
                            />
                            <DetailsMoreMenu item={item} queryKey={queryKey} />
                        </div>

                        {(item.Genres?.length || directors.length || writers.length) ? (
                            <div className='detailsFacts'>
                                {item.Genres?.length ? (
                                    <div className='detailsFactRow'>
                                        <div className='detailsFactLabel'>{globalize.translate('Genres')}</div>
                                        <div className='detailsFactValue'>
                                            {item.Genres.map(g => <span key={g} className='tag'>{g}</span>)}
                                        </div>
                                    </div>
                                ) : null}
                                {directors.length ? (
                                    <div className='detailsFactRow'>
                                        <div className='detailsFactLabel'>{globalize.translate('Director')}</div>
                                        <div className='detailsFactValue'>
                                            {directors.map(p => <span key={p.Id || p.Name} className='tag'>{p.Name}</span>)}
                                        </div>
                                    </div>
                                ) : null}
                                {writers.length ? (
                                    <div className='detailsFactRow'>
                                        <div className='detailsFactLabel'>{globalize.translate('Writer')}</div>
                                        <div className='detailsFactValue'>
                                            {writers.map(p => <span key={p.Id || p.Name} className='tag'>{p.Name}</span>)}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>

                {actors.length ? (
                    <div className='detailsSection'>
                        <h2 className='detailsSectionTitle'>{globalize.translate('Cast')}</h2>
                        <div className='detailsPeople'>
                            {actors.slice(0, 24).map(p => (
                                <div key={p.Id || p.Name} className='person'>
                                    <div className='personName'>{p.Name}</div>
                                    {p.Role ? <div className='personRole'>{p.Role}</div> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {guests.length ? (
                    <div className='detailsSection'>
                        <h2 className='detailsSectionTitle'>{globalize.translate('GuestStars')}</h2>
                        <div className='detailsPeople'>
                            {guests.slice(0, 24).map(p => (
                                <div key={p.Id || p.Name} className='person'>
                                    <div className='personName'>{p.Name}</div>
                                    {p.Role ? <div className='personRole'>{p.Role}</div> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </Page>
    );
}


