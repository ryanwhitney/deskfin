import React, { StrictMode, useCallback, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import CustomCss from 'components/CustomCss';
import ThemeCss from 'components/ThemeCss';
import { useApi } from 'hooks/useApi';

import { TopBar } from '../../components/layout/app-toolbar/TopBar';
import AppDrawer, { isDrawerPath } from '../../components/layout/drawer/AppDrawer';
import { useMatchMedia } from 'apps/deskfin/hooks/useMatchMedia';

import styles from './AppLayout.module.scss';

export const Component = () => {
    const [ isDrawerActive, setIsDrawerActive ] = useState(false);
    const { user } = useApi();
    const location = useLocation();
    const mainRef = useRef<HTMLElement>(null);

    const isMediumScreen = useMatchMedia('(min-width: 900px)');
    const isDrawerAvailable = isDrawerPath(location.pathname) && Boolean(user) && !isMediumScreen;
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [ isDrawerActive, setIsDrawerActive ]);

    return (
        <>
            {/* A button, not an anchor: with hash routing, href='#main' would navigate to a route */}
            <button type='button' className={styles.skipLink} onClick={() => mainRef.current?.focus()}>
                Skip to content
            </button>
            <div style={{ position: 'relative', display: 'flex', height: '100%' }}>
                <StrictMode>
                    <TopBar
                        isDrawerAvailable={!isMediumScreen && isDrawerAvailable}
                        isDrawerOpen={isDrawerOpen}
                        onDrawerButtonClick={onToggleDrawer}
                    />

                    {isDrawerAvailable ? (
                        <AppDrawer
                            open={isDrawerOpen}
                            onClose={onToggleDrawer}
                            onOpen={onToggleDrawer}
                        />
                    ) : null}
                </StrictMode>

                <main ref={mainRef} tabIndex={-1} className={styles.main}>
                    <AppBody>
                        <Outlet />
                    </AppBody>
                </main>
            </div>
            <ThemeCss />
            <CustomCss />
        </>
    );
};
