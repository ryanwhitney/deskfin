import React, { type FC } from 'react';
import { TopBar } from './TopBar';

interface AppToolbarProps {
    isDrawerAvailable: boolean
    isDrawerOpen: boolean
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void
}

const AppToolbar: FC<AppToolbarProps> = ({
    isDrawerAvailable,
    isDrawerOpen,
    onDrawerButtonClick
}) => {
    return (
        <TopBar
            isDrawerAvailable={isDrawerAvailable}
            isDrawerOpen={isDrawerOpen}
            onDrawerButtonClick={onDrawerButtonClick}
        />
    );
};

export default AppToolbar;
