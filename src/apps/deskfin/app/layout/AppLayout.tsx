import React, { StrictMode, useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import CustomCss from 'components/CustomCss';
import ThemeCss from 'components/ThemeCss';
import { useApi } from 'hooks/useApi';

import { TopBar } from '../../components/layout/app-toolbar/TopBar';
import AppDrawer, { isDrawerPath } from '../../components/layout/drawer/AppDrawer';
import { useMatchMedia } from 'apps/deskfin/hooks/useMatchMedia';

export const Component = () => {
    const [ isDrawerActive, setIsDrawerActive ] = useState(false);
    const { user } = useApi();
    const location = useLocation();

    const isMediumScreen = useMatchMedia('(min-width: 900px)');
    const isDrawerAvailable = isDrawerPath(location.pathname) && Boolean(user) && !isMediumScreen;
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    const onToggleDrawer = useCallback(() => {
        setIsDrawerActive(!isDrawerActive);
    }, [ isDrawerActive, setIsDrawerActive ]);

    return (
        <>
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

                <main style={{ width: '100%', flexGrow: 1 }}>
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
