import React, { type FC, useCallback } from 'react';
import { Link } from 'react-router-dom';

import JfIcon from 'components/JfIcon';
import { appHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { IconSvgs } from '../../../../assets/icons';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import globalize from 'lib/globalize';
import shell from 'scripts/shell';
import Dashboard from 'utils/dashboard';
import DropdownMenu from './DropdownMenu';

export const EXP_USER_MENU_ID = 'experimental-user-menu';

interface ExperimentalUserMenuProps {
    anchorEl: HTMLElement | null
    open: boolean
    onMenuClose: () => void
}

const ExperimentalUserMenu: FC<ExperimentalUserMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const { user } = useApi();
    const { data: isQuickConnectEnabled } = useQuickConnectEnabled();

    const onDownloadManagerClick = useCallback(() => {
        shell.openDownloadManager();
        onMenuClose();
    }, [ onMenuClose ]);

    const onClientSettingsClick = useCallback(() => {
        shell.openClientSettings();
        onMenuClose();
    }, [ onMenuClose ]);

    const onExitAppClick = useCallback(() => {
        appHost.exit();
        onMenuClose();
    }, [ onMenuClose ]);

    const onLogoutClick = useCallback(() => {
        Dashboard.logout();
        onMenuClose();
    }, [ onMenuClose ]);

    const onSelectServerClick = useCallback(() => {
        Dashboard.selectServer();
        onMenuClose();
    }, [ onMenuClose ]);

    return (
        <DropdownMenu
            anchorEl={anchorEl}
            open={open}
            onClose={onMenuClose}
        >
            <Link
                className='expDropdownItem'
                to={`/userprofile?userId=${user?.Id}`}
                onClick={onMenuClose}
                role='menuitem'
            >
                <span className='expMenuIcon'><JfIcon svg={IconSvgs.avatar} /></span>
                {globalize.translate('Profile')}
            </Link>
            <Link
                className='expDropdownItem'
                to='/mypreferencesmenu'
                onClick={onMenuClose}
                role='menuitem'
            >
                <span className='expMenuIcon'><JfIcon svg={IconSvgs.settings} /></span>
                {globalize.translate('Settings')}
            </Link>

            {(appHost.supports(AppFeature.DownloadManagement) || appHost.supports(AppFeature.ClientSettings)) && (
                <div className='expDropdownDivider' />
            )}

            {appHost.supports(AppFeature.DownloadManagement) && (
                <button className='expDropdownItem' onClick={onDownloadManagerClick} role='menuitem'>
                    <span className='expMenuIcon'><JfIcon svg={IconSvgs.download} /></span>
                    {globalize.translate('DownloadManager')}
                </button>
            )}

            {appHost.supports(AppFeature.ClientSettings) && (
                <button className='expDropdownItem' onClick={onClientSettingsClick} role='menuitem'>
                    <span className='expMenuIcon'><JfIcon svg={IconSvgs.controls} /></span>
                    {globalize.translate('ClientSettings')}
                </button>
            )}

            {user?.Policy?.IsAdministrator && (
                <>
                    <div className='expDropdownDivider' />
                    <Link
                        className='expDropdownItem'
                        to='/dashboard'
                        onClick={onMenuClose}
                        role='menuitem'
                    >
                        <span className='expMenuIcon'><JfIcon svg={IconSvgs.dashboard} /></span>
                        {globalize.translate('TabDashboard')}
                    </Link>
                    <Link
                        className='expDropdownItem'
                        to='/metadata'
                        onClick={onMenuClose}
                        role='menuitem'
                    >
                        <span className='expMenuIcon'><JfIcon svg={IconSvgs.edit} /></span>
                        {globalize.translate('MetadataManager')}
                    </Link>
                </>
            )}

            <div className='expDropdownDivider' />
            {isQuickConnectEnabled && (
                <Link
                    className='expDropdownItem'
                    to='/quickconnect'
                    onClick={onMenuClose}
                    role='menuitem'
                >
                    <span className='expMenuIcon'><JfIcon svg={IconSvgs.quickConnect} /></span>
                    {globalize.translate('QuickConnect')}
                </Link>
            )}

            {appHost.supports(AppFeature.MultiServer) && (
                <button className='expDropdownItem' onClick={onSelectServerClick} role='menuitem'>
                    <span className='expMenuIcon'><JfIcon svg={IconSvgs.refresh} /></span>
                    {globalize.translate('SelectServer')}
                </button>
            )}

            <button className='expDropdownItem' onClick={onLogoutClick} role='menuitem'>
                <span className='expMenuIcon'><JfIcon svg={IconSvgs.signOut} /></span>
                {globalize.translate('ButtonSignOut')}
            </button>

            {appHost.supports(AppFeature.ExitMenu) && (
                <>
                    <div className='expDropdownDivider' />
                    <button className='expDropdownItem' onClick={onExitAppClick} role='menuitem'>
                        <span className='expMenuIcon'><JfIcon svg={IconSvgs.delete} /></span>
                        {globalize.translate('ButtonExitApp')}
                    </button>
                </>
            )}
        </DropdownMenu>
    );
};

export default ExperimentalUserMenu;

