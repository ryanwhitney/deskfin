import React, { type FC, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import SearchButton from './SearchButton';
import ExperimentalUserMenuButton from './ExperimentalUserMenuButton';
import UserViewNav from './userViews/UserViewNav';
import { ToolbarIconButton } from 'apps/experimental/components/toolbar/ToolbarIconButton';
import { ToolbarIconLink } from 'apps/experimental/components/toolbar/ToolbarIconLink';

import styles from './ExperimentalTopBar.module.scss';

interface ExperimentalTopBarProps {
    isDrawerAvailable: boolean;
    isDrawerOpen: boolean;
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void;
}

const PUBLIC_PATHS = [
    '/addserver',
    '/selectserver',
    '/login',
    '/forgotpassword',
    '/forgotpasswordpin'
];

const MenuIcon = () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 5.5h14a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2Zm0 5h14a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2Zm0 5h14a1 1 0 0 0 0-2H3a1 1 0 0 0 0 2Z" />
    </svg>
);

export const ExperimentalTopBar: FC<ExperimentalTopBarProps> = ({
    isDrawerAvailable,
    isDrawerOpen,
    onDrawerButtonClick
}) => {
    const location = useLocation();

    // The video osd does not show the standard toolbar
    if (location.pathname === '/video') return null;

    const isPublicPath = PUBLIC_PATHS.includes(location.pathname);
    const title = useMemo(() => 'desk', []);
    const subtitle = useMemo(() => '', []);

    return (
        <header className={styles.root}>
            <div className={styles.left}>
                {!isPublicPath && isDrawerAvailable ? (
                    <ToolbarIconButton
                        aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
                        onClick={onDrawerButtonClick}
                        variant="hamburger"
                    >
                        <MenuIcon />
                    </ToolbarIconButton>
                ) : null}

                <Link className={styles.brand} to="/home">
                    <span className={styles.brandImg} aria-hidden="true">
                        <SvgIcon svg={IconSvgs.macMini} size={24} />
                    </span>
                    <span className={styles.brandText}>
                        <span className={styles.brandTitle}>{title}</span>
                        {subtitle ? <span className={styles.brandSub}>{subtitle}</span> : null}
                    </span>
                </Link>
            </div>

            <div className={styles.center}>
                {/* Hide the desktop-style nav links when the hamburger/drawer nav is available. */}
                {(!isPublicPath && !isDrawerAvailable) ? (
                    <>
                        <UserViewNav />
                    </>
                ) : null}
            </div>

            <div className={styles.right}>
                {!isPublicPath ? (
                    <>
                        <SearchButton />
                        <ExperimentalUserMenuButton />
                    </>
                ) : (
                    <ToolbarIconLink aria-label="Home" to="/home">
                        <SvgIcon svg={IconSvgs.home} size={18} />
                    </ToolbarIconLink>
                )}
            </div>
        </header>
    );
};
