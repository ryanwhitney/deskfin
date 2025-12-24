import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../assets/icons';
import { useSystemInfo } from 'hooks/useSystemInfo';

const ServerButton: FC = () => {
    const {
        data: systemInfo,
        isPending
    } = useSystemInfo();

    return (
        <Link
            to='/'
            className='expToolbarButton expToolbarBrand'
            aria-label={systemInfo?.ServerName || 'Jellyfin'}
        >
            <JfIcon svg={IconSvgs.macMini} />
            {!isPending && (systemInfo?.ServerName || 'Jellyfin')}
        </Link>
    );
};

export default ServerButton;
