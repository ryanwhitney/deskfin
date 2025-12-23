import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
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
            <Tooltip title={globalize.translate('UserMenu')}>
                <IconButton
                    size='large'
                    aria-label={globalize.translate('UserMenu')}
                    aria-controls={EXP_USER_MENU_ID}
                    aria-haspopup='true'
                    onClick={onUserButtonClick}
                    color='inherit'
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    sx={{ padding: 0 }}
                >
                    <JfIcon svg={IconSvgs.avatar} />
                </IconButton>
            </Tooltip>

            <ExperimentalUserMenu
                open={isUserMenuOpen}
                anchorEl={userMenuAnchorEl}
                onMenuClose={onUserMenuClose}
            />
        </>
    );
};

export default ExperimentalUserMenuButton;

