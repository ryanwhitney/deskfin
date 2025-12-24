import React, { useCallback, useState } from 'react';

import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../../../assets/icons';
import globalize from 'lib/globalize';

import ExperimentalUserMenu, { EXP_USER_MENU_ID } from './ExperimentalUserMenu';

const ExperimentalUserMenuButton = () => {
    const [ userMenuAnchorEl, setUserMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const onUserButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchorEl(event.currentTarget);
    }, []);

    const onUserMenuClose = useCallback(() => {
        setUserMenuAnchorEl(null);
    }, []);

    return (
        <>
            <button
                type='button'
                aria-label={globalize.translate('UserMenu')}
                aria-controls={EXP_USER_MENU_ID}
                aria-haspopup='true'
                onClick={onUserButtonClick}
                className='expToolbarIconButton'
            >
                <JfIcon svg={IconSvgs.avatar} />
            </button>

            <ExperimentalUserMenu
                open={isUserMenuOpen}
                anchorEl={userMenuAnchorEl}
                onMenuClose={onUserMenuClose}
            />
        </>
    );
};

export default ExperimentalUserMenuButton;

