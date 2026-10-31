import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
import { useSystemInfo } from 'hooks/useSystemInfo';

const ServerButton: FC = () => {
    const { data: systemInfo } = useSystemInfo();

    return (
        <Link
            to='/'
            className='expToolbarButton expToolbarBrand'
            aria-label={systemInfo?.ServerName || 'Jellyfin'}
        >
            <SvgIcon svg={IconSvgs.macMini} />
            desk
        </Link>
    );
};

export default ServerButton;
