import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';

import { MetaView } from 'apps/experimental/constants/metaView';
import { isLibraryPath } from 'apps/experimental/features/libraries/utils/path';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import useCurrentTab from 'hooks/useCurrentTab';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'lib/globalize';

import { ActionMenuStyles, ToolbarAnchor, ToolbarLink } from 'apps/experimental/components';
import toolbarLinkStyles from 'apps/experimental/components/toolbar/ToolbarLink.module.scss';

const MAX_USER_VIEWS_MD = 3;
const MAX_USER_VIEWS_LG = 5;
const MAX_USER_VIEWS_XL = 8;

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
    const navigate = useNavigate();
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
                <MenuTrigger>
                    <Button className={toolbarLinkStyles.link}>
                        {globalize.translate('ButtonMore')}
                    </Button>
                    <Popover className={ActionMenuStyles.popover}>
                        <Menu className={ActionMenuStyles.menu} aria-label={globalize.translate('ButtonMore')}>
                            {overflowViews.map(view => {
                                const to = appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1);
                                return (
                                    <MenuItem
                                        key={view.Id}
                                        className={ActionMenuStyles.item}
                                        textValue={view.Name ?? ''}
                                        onAction={() => navigate(to)}
                                    >
                                        <span className={ActionMenuStyles.text}>{view.Name}</span>
                                        {view.Id === currentUserView?.Id ? (
                                            <span className={ActionMenuStyles.endAdornment} aria-hidden="true">•</span>
                                        ) : null}
                                    </MenuItem>
                                );
                            })}
                        </Menu>
                    </Popover>
                </MenuTrigger>
            )}
        </>
    );
};

export default UserViewNav;
