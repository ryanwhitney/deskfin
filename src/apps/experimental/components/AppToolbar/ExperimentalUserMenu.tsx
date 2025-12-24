import React, { type FC, useCallback } from 'react';
import { Link } from 'react-router-dom';

import SvgIcon from 'components/SvgIcon';
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
                <span className='expMenuIcon'><SvgIcon svg={IconSvgs.avatar} size={18} /></span>
                {globalize.translate('Profile')}
            </Link>
            <Link
                className='expDropdownItem'
                to='/mypreferencesmenu'
                onClick={onMenuClose}
                role='menuitem'
            >
                <span className='expMenuIcon'><SvgIcon svg={IconSvgs.settings} size={18} /></span>
                {globalize.translate('Settings')}
            </Link>

            {(appHost.supports(AppFeature.DownloadManagement) || appHost.supports(AppFeature.ClientSettings)) && (
                <div className='expDropdownDivider' />
            )}

            {appHost.supports(AppFeature.DownloadManagement) && (
                <button className='expDropdownItem' onClick={onDownloadManagerClick} role='menuitem'>
                    <span className='expMenuIcon'><SvgIcon svg={IconSvgs.download} size={18} /></span>
                    {globalize.translate('DownloadManager')}
                </button>
            )}

            {appHost.supports(AppFeature.ClientSettings) && (
                <button className='expDropdownItem' onClick={onClientSettingsClick} role='menuitem'>
                    <span className='expMenuIcon'><SvgIcon svg={IconSvgs.controls} size={18} /></span>
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
                        <span className='expMenuIcon'><SvgIcon svg={IconSvgs.dashboard} size={18} /></span>
                        {globalize.translate('TabDashboard')}
                    </Link>
                    <Link
                        className='expDropdownItem'
                        to='/metadata'
                        onClick={onMenuClose}
                        role='menuitem'
                    >
                        <span className='expMenuIcon'><SvgIcon svg={IconSvgs.edit} size={18} /></span>
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
                    <span className='expMenuIcon'><SvgIcon svg={IconSvgs.quickConnect} size={18} /></span>
                    {globalize.translate('QuickConnect')}
                </Link>
            )}

            {appHost.supports(AppFeature.MultiServer) && (
                <button className='expDropdownItem' onClick={onSelectServerClick} role='menuitem'>
                    <span className='expMenuIcon'><SvgIcon svg={IconSvgs.refresh} size={18} /></span>
                    {globalize.translate('SelectServer')}
                </button>
            )}

            <button className='expDropdownItem' onClick={onLogoutClick} role='menuitem'>
                <span className='expMenuIcon'><SvgIcon svg={IconSvgs.signOut} size={18} /></span>
                {globalize.translate('ButtonSignOut')}
            </button>

            {appHost.supports(AppFeature.ExitMenu) && (
                <>
                    <div className='expDropdownDivider' />
                    <button className='expDropdownItem' onClick={onExitAppClick} role='menuitem'>
                        <span className='expMenuIcon'><SvgIcon svg={IconSvgs.delete} size={18} /></span>
                        {globalize.translate('ButtonExitApp')}
                    </button>
                </>
            )}
        </DropdownMenu>
    );
};

export default ExperimentalUserMenu;

