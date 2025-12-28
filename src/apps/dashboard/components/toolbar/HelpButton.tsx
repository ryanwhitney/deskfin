import HelpOutline from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { HelpLinks } from 'apps/dashboard/constants/helpLinks';
import globalize from 'lib/globalize';

const HelpButton = () => {
    const location = useLocation();

    // Find a matching help link for the current path
    const helpLink = HelpLinks.find(({ paths }) =>
        paths.some(path => location.pathname === path)
    );

    if (!helpLink) return null;

    return (
        <Tooltip title={globalize.translate('Help')}>
            <IconButton
                href={helpLink.url}
                rel='noopener noreferrer'
                target='_blank'
                size='large'
                color='inherit'
            >
                <HelpOutline />
            </IconButton>
        </Tooltip>
    );
};

export default HelpButton;
