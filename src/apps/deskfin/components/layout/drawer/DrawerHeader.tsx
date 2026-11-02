import React from 'react';
import { Link } from 'react-router-dom';

import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
import { useServerName } from 'apps/deskfin/hooks/useServerName';

import styles from './DrawerHeader.module.scss';

export function DrawerHeader() {
    const serverName = useServerName();

    return (
        <Link className={styles.root} to='/home'>
            <span className={styles.logo} aria-hidden='true'>
                <SvgIcon svg={IconSvgs.macMini} size={34} />
            </span>
            <span className={styles.text}>
                <span className={styles.title}>{serverName}</span>
                <span className={styles.sub}>home</span>
            </span>
        </Link>
    );
}

