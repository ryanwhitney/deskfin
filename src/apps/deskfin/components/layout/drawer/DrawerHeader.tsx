import React from 'react';
import { Link } from 'react-router-dom';

import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import styles from './DrawerHeader.module.scss';

export function DrawerHeader() {
    return (
        <Link className={styles.root} to="/home">
            <span className={styles.logo} aria-hidden="true">
                <SvgIcon svg={IconSvgs.macMini} size={34} />
            </span>
            <span className={styles.text}>
                <span className={styles.title}>desk</span>
                <span className={styles.sub}>home</span>
            </span>
        </Link>
    );
}


