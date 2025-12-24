import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { appRouter } from 'components/router/appRouter';
import DropdownMenu from '../DropdownMenu';

interface UserViewsMenuProps {
    userViews: BaseItemDto[]
    selectedId?: string
    onMenuClose: () => void
    anchorEl: HTMLElement | null
    open: boolean
    id?: string
}

const UserViewsMenu: FC<UserViewsMenuProps> = ({
    userViews,
    selectedId,
    onMenuClose,
    anchorEl,
    open,
    id
}) => {
    return (
        <DropdownMenu
            anchorEl={anchorEl}
            open={open}
            onClose={onMenuClose}
            id={id}
            align='left'
        >
            {userViews.map(view => (
                <Link
                    key={view.Id}
                    className='expDropdownItem'
                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                    onClick={onMenuClose}
                    role='menuitem'
                >
                    {view.Name}
                    {view.Id === selectedId && <span style={{ marginLeft: 'auto', opacity: 0.7 }}>•</span>}
                </Link>
            ))}
        </DropdownMenu>
    );
};

export default UserViewsMenu;
