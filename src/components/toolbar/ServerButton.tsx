import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
import { useServerName } from 'apps/deskfin/hooks/useServerName';

const ServerButton: FC = () => {
    const serverName = useServerName();

    return (
        <Link
            to='/'
            className='expToolbarButton expToolbarBrand'
        >
            <SvgIcon svg={IconSvgs.macMini} />
            {serverName}
        </Link>
    );
};

export default ServerButton;
