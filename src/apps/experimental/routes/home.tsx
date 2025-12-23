import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from '../../../lib/globalize';
import { clearBackdrop } from '../../../components/backdrop/backdrop';
import Page from '../../../components/Page';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import './home.modern.scss';

type MediaItem = {
    Id: string;
    Name: string;
    SeriesName?: string;
    PrimaryImageTag?: string;
    ImageTags?: Record<string, string>;
};

const buildImageUrl = (item: MediaItem, maxWidth = 500) => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item.Id) return '';
    const tag = item.PrimaryImageTag || item.ImageTags?.Primary;
    if (!tag) return '';
    return apiClient.getImageUrl(item.Id, { type: 'Primary', tag, maxWidth });
};

const SectionGrid: React.FC<{ title: string; items: MediaItem[] }> = ({ title, items }) => {
    if (!items.length) return null;
    return (
        <section className='section'>
            <h2 className='sectionTitle'>{title}</h2>
            <div className='cardGrid'>
                {items.map(item => (
                    <a key={item.Id} className='card' href={`#/details?id=${item.Id}`}>
                        <div
                            className='thumb'
                            style={{
                                backgroundImage: buildImageUrl(item)
                                    ? `url(${buildImageUrl(item)})`
                                    : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                            }}
                        />
                        <div className='title'>{item.Name}</div>
                        {item.SeriesName && <div className='subtitle'>{item.SeriesName}</div>}
                    </a>
                ))}
            </div>
        </section>
    );
};

const Home = () => {
    const [ searchParams ] = useSearchParams();
    const initialTabIndex = parseInt(searchParams.get('tab') ?? '0', 10);

    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);
    const documentRef = useRef<Document>(document);

    const [ resume, setResume ] = useState<MediaItem[]>([]);
    const [ nextUp, setNextUp ] = useState<MediaItem[]>([]);
    const [ latest, setLatest ] = useState<MediaItem[]>([]);
    const [ favorites, setFavorites ] = useState<MediaItem[]>([]);

    const t = useCallback((key: string, fallback: string) => {
        try {
            return globalize.translate(key);
        } catch {
            return fallback;
        }
    }, []);

    const setTitle = useCallback(async () => {
        (await libraryMenu).setTitle(null);
    }, [ libraryMenu ]);

    const fetchSections = useCallback(async () => {
        const apiClient = ServerConnections.currentApiClient();
        const userId = apiClient?.getCurrentUserId?.();
        if (!apiClient || !userId) return;

        try {
            const withBase = (path: string) => apiClient.getUrl(path);
            const [ resumeResp, nextResp, latestResp, favResp ] = await Promise.all([
                apiClient.getJSON(withBase(`Users/${userId}/Items/Resume?Limit=12&Recursive=true&Fields=PrimaryImageAspectRatio&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CThumb&MediaTypes=Video`)),
                apiClient.getJSON(withBase(`Shows/NextUp?Limit=24&Fields=PrimaryImageAspectRatio%2CDateCreated%2CPath%2CMediaSourceCount&UserId=${userId}&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&EnableTotalRecordCount=false`)),
                apiClient.getJSON(withBase(`Users/${userId}/Items/Latest?Limit=24&Fields=PrimaryImageAspectRatio%2CPath&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CThumb`)),
                apiClient.getJSON(withBase(`Users/${userId}/Items?Limit=24&Recursive=true&Filters=IsFavorite&Fields=PrimaryImageAspectRatio&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CThumb`))
            ]);

            setResume(resumeResp?.Items || []);
            setNextUp(nextResp?.Items || []);
            setLatest(latestResp?.Items || resumeResp?.Items || []);
            setFavorites(favResp?.Items || []);
        } catch (err) {
            console.error('[Home] failed to load sections', err);
        }
    }, []);

    useEffect(() => {
        void setTitle();
        clearBackdrop();
        void fetchSections();
        documentRef.current.querySelector('.skinHeader')?.classList.add('noHomeButtonHeader');

        return () => {
            documentRef.current.querySelector('.skinHeader')?.classList.remove('noHomeButtonHeader');
        };
    }, [ fetchSections, setTitle ]);

    useEffect(() => {
        const doc = documentRef.current;
        const rerender = () => void fetchSections();
        if (doc) Events.on(doc, EventType.HEADER_RENDERED, rerender);
        return () => {
            if (doc) Events.off(doc, EventType.HEADER_RENDERED, rerender);
        };
    }, [ fetchSections ]);

    return (
        <div>
            <Page
                id='indexPage'
                className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage'
                isBackButtonEnabled={false}
                backDropType='movie,series,book'
            >
                <div className='sections'>
                    <SectionGrid title={t('HeaderContinueWatching', 'Continue Watching')} items={resume} />
                    <SectionGrid title={t('HeaderNextUp', 'Next Up')} items={nextUp} />
                    <SectionGrid title={t('HeaderLatest', 'Latest')} items={latest} />
                    <SectionGrid title={t('Favorites', 'Favorites')} items={favorites} />
                </div>
            </Page>
        </div>
    );
};

export default Home;
