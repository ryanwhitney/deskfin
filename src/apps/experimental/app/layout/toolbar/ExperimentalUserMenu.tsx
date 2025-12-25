import React, { type FC, useCallback } from 'react';

import SvgIcon from 'components/SvgIcon';
import { appHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { IconSvgs } from 'assets/icons';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import globalize from 'lib/globalize';
import shell from 'scripts/shell';
import Dashboard from 'utils/dashboard';
import DropdownMenu from './DropdownMenu';
import { ToolbarMenuDivider, ToolbarMenuIcon, ToolbarMenuItem } from 'apps/experimental/components/shared';

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
            <ToolbarMenuItem
                as="link"
                to={`/userprofile?userId=${user?.Id}`}
                onClick={onMenuClose}
                role="menuitem"
            >
                <ToolbarMenuIcon><SvgIcon svg={IconSvgs.avatar} size={18} /></ToolbarMenuIcon>
                {globalize.translate('Profile')}
            </ToolbarMenuItem>
            <ToolbarMenuItem
                as="link"
                to="/mypreferencesmenu"
                onClick={onMenuClose}
                role="menuitem"
            >
                <ToolbarMenuIcon><SvgIcon svg={IconSvgs.settings} size={18} /></ToolbarMenuIcon>
                {globalize.translate('Settings')}
            </ToolbarMenuItem>

            {(appHost.supports(AppFeature.DownloadManagement) || appHost.supports(AppFeature.ClientSettings)) && (
                <ToolbarMenuDivider />
            )}

            {appHost.supports(AppFeature.DownloadManagement) && (
                <ToolbarMenuItem as="button" onClick={onDownloadManagerClick} role="menuitem">
                    <ToolbarMenuIcon><SvgIcon svg={IconSvgs.download} size={18} /></ToolbarMenuIcon>
                    {globalize.translate('DownloadManager')}
                </ToolbarMenuItem>
            )}

            {appHost.supports(AppFeature.ClientSettings) && (
                <ToolbarMenuItem as="button" onClick={onClientSettingsClick} role="menuitem">
                    <ToolbarMenuIcon><SvgIcon svg={IconSvgs.controls} size={18} /></ToolbarMenuIcon>
                    {globalize.translate('ClientSettings')}
                </ToolbarMenuItem>
            )}

            {user?.Policy?.IsAdministrator && (
                <>
                    <ToolbarMenuDivider />
                    <ToolbarMenuItem
                        as="link"
                        to="/dashboard"
                        onClick={onMenuClose}
                        role="menuitem"
                    >
                        <ToolbarMenuIcon><SvgIcon svg={IconSvgs.dashboard} size={18} /></ToolbarMenuIcon>
                        {globalize.translate('TabDashboard')}
                    </ToolbarMenuItem>
                    <ToolbarMenuItem
                        as="link"
                        to="/metadata"
                        onClick={onMenuClose}
                        role="menuitem"
                    >
                        <ToolbarMenuIcon><SvgIcon svg={IconSvgs.edit} size={18} /></ToolbarMenuIcon>
                        {globalize.translate('MetadataManager')}
                    </ToolbarMenuItem>
                </>
            )}

            <ToolbarMenuDivider />
            {isQuickConnectEnabled && (
                <ToolbarMenuItem
                    as="link"
                    to="/quickconnect"
                    onClick={onMenuClose}
                    role="menuitem"
                >
                    <ToolbarMenuIcon><SvgIcon svg={IconSvgs.quickConnect} size={18} /></ToolbarMenuIcon>
                    {globalize.translate('QuickConnect')}
                </ToolbarMenuItem>
            )}

            {appHost.supports(AppFeature.MultiServer) && (
                <ToolbarMenuItem as="button" onClick={onSelectServerClick} role="menuitem">
                    <ToolbarMenuIcon><SvgIcon svg={IconSvgs.refresh} size={18} /></ToolbarMenuIcon>
                    {globalize.translate('SelectServer')}
                </ToolbarMenuItem>
            )}

            <ToolbarMenuItem as="button" onClick={onLogoutClick} role="menuitem">
                <ToolbarMenuIcon><SvgIcon svg={IconSvgs.signOut} size={18} /></ToolbarMenuIcon>
                {globalize.translate('ButtonSignOut')}
            </ToolbarMenuItem>

            {appHost.supports(AppFeature.ExitMenu) && (
                <>
                    <ToolbarMenuDivider />
                    <ToolbarMenuItem as="button" onClick={onExitAppClick} role="menuitem">
                        <ToolbarMenuIcon><SvgIcon svg={IconSvgs.delete} size={18} /></ToolbarMenuIcon>
                        {globalize.translate('ButtonExitApp')}
                    </ToolbarMenuItem>
                </>
            )}
        </DropdownMenu>
    );
};

export default ExperimentalUserMenu;

