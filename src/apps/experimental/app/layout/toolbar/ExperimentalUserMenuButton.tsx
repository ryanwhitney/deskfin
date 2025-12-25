import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Menu, MenuItem, MenuTrigger, Popover, Separator } from 'react-aria-components';

import SvgIcon from 'components/SvgIcon';
import { appHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';
import { ActionMenuStyles } from 'apps/experimental/components/shared';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import shell from 'scripts/shell';
import Dashboard from 'utils/dashboard';

import toolbarIconStyles from 'apps/experimental/components/shared/toolbar/ToolbarIconButton.module.scss';

const ExperimentalUserMenuButton = () => {
    const navigate = useNavigate();
    const { user } = useApi();
    const { data: isQuickConnectEnabled } = useQuickConnectEnabled();

    const onDownloadManagerClick = useCallback(() => {
        shell.openDownloadManager();
    }, []);

    const onClientSettingsClick = useCallback(() => {
        shell.openClientSettings();
    }, []);

    const onExitAppClick = useCallback(() => {
        appHost.exit();
    }, []);

    const onLogoutClick = useCallback(() => {
        Dashboard.logout();
    }, []);

    const onSelectServerClick = useCallback(() => {
        Dashboard.selectServer();
    }, []);

    const go = useCallback((to: string) => {
        navigate(to);
    }, [ navigate ]);

    return (
        <MenuTrigger>
            <Button
                className={toolbarIconStyles.button}
                aria-label={globalize.translate('UserMenu')}
            >
                <SvgIcon svg={IconSvgs.avatar} size={24} />
            </Button>

            <Popover className={ActionMenuStyles.popover}>
                <Menu className={ActionMenuStyles.menu} aria-label={globalize.translate('UserMenu')}>
                    <MenuItem
                        className={ActionMenuStyles.item}
                        textValue={globalize.translate('Profile')}
                        onAction={() => go(`/userprofile?userId=${user?.Id}`)}
                    >
                        <span className={ActionMenuStyles.icon} aria-hidden="true">
                            <SvgIcon svg={IconSvgs.avatar} size={18} />
                        </span>
                        <span className={ActionMenuStyles.text}>{globalize.translate('Profile')}</span>
                    </MenuItem>

                    <MenuItem
                        className={ActionMenuStyles.item}
                        textValue={globalize.translate('Settings')}
                        onAction={() => go('/mypreferencesmenu')}
                    >
                        <span className={ActionMenuStyles.icon} aria-hidden="true">
                            <SvgIcon svg={IconSvgs.settings} size={18} />
                        </span>
                        <span className={ActionMenuStyles.text}>{globalize.translate('Settings')}</span>
                    </MenuItem>

                    {(appHost.supports(AppFeature.DownloadManagement) || appHost.supports(AppFeature.ClientSettings)) ? (
                        <Separator className={ActionMenuStyles.divider} />
                    ) : null}

                    {appHost.supports(AppFeature.DownloadManagement) ? (
                        <MenuItem
                            className={ActionMenuStyles.item}
                            textValue={globalize.translate('DownloadManager')}
                            onAction={onDownloadManagerClick}
                        >
                            <span className={ActionMenuStyles.icon} aria-hidden="true">
                                <SvgIcon svg={IconSvgs.download} size={18} />
                            </span>
                            <span className={ActionMenuStyles.text}>{globalize.translate('DownloadManager')}</span>
                        </MenuItem>
                    ) : null}

                    {appHost.supports(AppFeature.ClientSettings) ? (
                        <MenuItem
                            className={ActionMenuStyles.item}
                            textValue={globalize.translate('ClientSettings')}
                            onAction={onClientSettingsClick}
                        >
                            <span className={ActionMenuStyles.icon} aria-hidden="true">
                                <SvgIcon svg={IconSvgs.controls} size={18} />
                            </span>
                            <span className={ActionMenuStyles.text}>{globalize.translate('ClientSettings')}</span>
                        </MenuItem>
                    ) : null}

                    {user?.Policy?.IsAdministrator ? (
                        <>
                            <Separator className={ActionMenuStyles.divider} />
                            <MenuItem
                                className={ActionMenuStyles.item}
                                textValue={globalize.translate('TabDashboard')}
                                onAction={() => go('/dashboard')}
                            >
                                <span className={ActionMenuStyles.icon} aria-hidden="true">
                                    <SvgIcon svg={IconSvgs.dashboard} size={18} />
                                </span>
                                <span className={ActionMenuStyles.text}>{globalize.translate('TabDashboard')}</span>
                            </MenuItem>
                            <MenuItem
                                className={ActionMenuStyles.item}
                                textValue={globalize.translate('MetadataManager')}
                                onAction={() => go('/metadata')}
                            >
                                <span className={ActionMenuStyles.icon} aria-hidden="true">
                                    <SvgIcon svg={IconSvgs.edit} size={18} />
                                </span>
                                <span className={ActionMenuStyles.text}>{globalize.translate('MetadataManager')}</span>
                            </MenuItem>
                        </>
                    ) : null}

                    <Separator className={ActionMenuStyles.divider} />

                    {isQuickConnectEnabled ? (
                        <MenuItem
                            className={ActionMenuStyles.item}
                            textValue={globalize.translate('QuickConnect')}
                            onAction={() => go('/quickconnect')}
                        >
                            <span className={ActionMenuStyles.icon} aria-hidden="true">
                                <SvgIcon svg={IconSvgs.quickConnect} size={18} />
                            </span>
                            <span className={ActionMenuStyles.text}>{globalize.translate('QuickConnect')}</span>
                        </MenuItem>
                    ) : null}

                    {appHost.supports(AppFeature.MultiServer) ? (
                        <MenuItem
                            className={ActionMenuStyles.item}
                            textValue={globalize.translate('SelectServer')}
                            onAction={onSelectServerClick}
                        >
                            <span className={ActionMenuStyles.icon} aria-hidden="true">
                                <SvgIcon svg={IconSvgs.refresh} size={18} />
                            </span>
                            <span className={ActionMenuStyles.text}>{globalize.translate('SelectServer')}</span>
                        </MenuItem>
                    ) : null}

                    <MenuItem
                        className={ActionMenuStyles.item}
                        textValue={globalize.translate('ButtonSignOut')}
                        onAction={onLogoutClick}
                    >
                        <span className={ActionMenuStyles.icon} aria-hidden="true">
                            <SvgIcon svg={IconSvgs.signOut} size={18} />
                        </span>
                        <span className={ActionMenuStyles.text}>{globalize.translate('ButtonSignOut')}</span>
                    </MenuItem>

                    {appHost.supports(AppFeature.ExitMenu) ? (
                        <>
                            <Separator className={ActionMenuStyles.divider} />
                            <MenuItem
                                className={ActionMenuStyles.item}
                                textValue={globalize.translate('ButtonExitApp')}
                                onAction={onExitAppClick}
                            >
                                <span className={ActionMenuStyles.icon} aria-hidden="true">
                                    <SvgIcon svg={IconSvgs.delete} size={18} />
                                </span>
                                <span className={ActionMenuStyles.text}>{globalize.translate('ButtonExitApp')}</span>
                            </MenuItem>
                        </>
                    ) : null}
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};

export default ExperimentalUserMenuButton;

