import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { MetaView } from 'apps/experimental/constants/metaView';
import { isLibraryPath } from 'apps/experimental/features/libraries/utils/path';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import useCurrentTab from 'hooks/useCurrentTab';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'lib/globalize';

import { ToolbarAnchor, ToolbarLink, ToolbarTextButton } from 'apps/experimental/components/shared';
import UserViewsMenu from './UserViewsMenu';

const MAX_USER_VIEWS_MD = 3;
const MAX_USER_VIEWS_LG = 5;
const MAX_USER_VIEWS_XL = 8;

const OVERFLOW_MENU_ID = 'user-view-overflow-menu';

const HOME_PATH = '/home';
const LIST_PATH = '/list';
const COLLECTIONS_PATH = '/collections';

const getCurrentUserView = (
    userViews: BaseItemDto[] | undefined,
    pathname: string,
    libraryId: string | null,
    collectionType: string | null,
    tab: number
) => {
    const isUserViewPath = isLibraryPath(pathname) || [HOME_PATH, LIST_PATH, COLLECTIONS_PATH].includes(pathname);
    if (!isUserViewPath) return undefined;

    if (collectionType === CollectionType.Livetv) {
        return userViews?.find(({ CollectionType: type }) => type === CollectionType.Livetv);
    }

    if (pathname === HOME_PATH && tab === 1) {
        return MetaView.Favorites;
    }

    // eslint-disable-next-line sonarjs/different-types-comparison
    return userViews?.find(({ Id: id }) => id === libraryId);
};

const UserViewNav = () => {
    const location = useLocation();
    const [ searchParams ] = useSearchParams();
    const libraryId = searchParams.get('topParentId') || searchParams.get('parentId');
    const collectionType = searchParams.get('collectionType');
    const { activeTab } = useCurrentTab();
    const webConfig = useWebConfig();

    const maxViews = useMemo(() => {
        const customLinks = (webConfig.menuLinks || []).length;
        return MAX_USER_VIEWS_MD - customLinks;
    }, [ webConfig.menuLinks ]);

    const { user } = useApi();
    const {
        data: userViews,
        isPending
    } = useUserViews(user?.Id);

    const primaryViews = useMemo(() => (
        userViews?.Items?.slice(0, maxViews)
    ), [ maxViews, userViews ]);

    const overflowViews = useMemo(() => (
        userViews?.Items?.slice(maxViews)
    ), [ maxViews, userViews ]);

    const [ overflowAnchorEl, setOverflowAnchorEl ] = useState<null | HTMLElement>(null);
    const isOverflowMenuOpen = Boolean(overflowAnchorEl);

    const onOverflowButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setOverflowAnchorEl(event.currentTarget);
    }, []);

    const onOverflowMenuClose = useCallback(() => {
        setOverflowAnchorEl(null);
    }, []);

    const currentUserView = useMemo(() => (
        getCurrentUserView(userViews?.Items, location.pathname, libraryId, collectionType, activeTab)
    ), [ activeTab, collectionType, libraryId, location.pathname, userViews ]);

    const isFavorites = currentUserView?.Id === MetaView.Favorites.Id;

    if (isPending) return null;

    return (
        <>
            <ToolbarLink
                to="/home?tab=1"
                aria-label={globalize.translate(MetaView.Favorites.Name)}
                isActive={isFavorites}
            >
                {globalize.translate(MetaView.Favorites.Name)}
            </ToolbarLink>

            {webConfig.menuLinks?.map(link => (
                <ToolbarAnchor
                    key={link.name}
                    href={link.url}
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    {link.name}
                </ToolbarAnchor>
            ))}

            {primaryViews?.map(view => (
                <ToolbarLink
                    key={view.Id}
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                    isActive={view.Id === currentUserView?.Id}
                >
                    {view.Name}
                </ToolbarLink>
            ))}
            {overflowViews && overflowViews.length > 0 && (
                <>
                    <ToolbarTextButton
                        aria-controls={OVERFLOW_MENU_ID}
                        aria-haspopup="true"
                        onClick={onOverflowButtonClick}
                    >
                        {globalize.translate('ButtonMore')}
                    </ToolbarTextButton>

                    <UserViewsMenu
                        anchorEl={overflowAnchorEl}
                        id={OVERFLOW_MENU_ID}
                        open={isOverflowMenuOpen}
                        onMenuClose={onOverflowMenuClose}
                        userViews={overflowViews}
                        selectedId={currentUserView?.Id}
                    />
                </>
            )}
        </>
    );
};

export default UserViewNav;
