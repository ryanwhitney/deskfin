import React, { type FC, useCallback } from 'react';
import { Button, DialogTrigger, Menu, MenuItem, MenuTrigger, Popover, Separator } from 'react-aria-components';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';

import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import type { LibraryViewSettings } from 'types/library';
import { ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import styles from './LibraryToolbar.module.scss';

const IMAGE_TYPE_EXCLUDED_VIEWS = [
    LibraryTab.Episodes,
    LibraryTab.Artists,
    LibraryTab.AlbumArtists,
    LibraryTab.Albums
];

const imageTypeOptions = [
    { label: 'Primary', value: ImageType.Primary },
    { label: 'Banner', value: ImageType.Banner },
    { label: 'Disc', value: ImageType.Disc },
    { label: 'Logo', value: ImageType.Logo },
    { label: 'Thumb', value: ImageType.Thumb }
];

interface ViewSettingsMenuProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

export const ViewSettingsMenu: FC<ViewSettingsMenuProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const isGridView = libraryViewSettings.ViewMode === ViewMode.GridView;
    const isImageTypeVisible = !IMAGE_TYPE_EXCLUDED_VIEWS.includes(viewType);

    const setViewMode = useCallback((mode: ViewMode) => {
        setLibraryViewSettings((prev) => ({ ...prev, ViewMode: mode }));
    }, [setLibraryViewSettings]);

    const setImageType = useCallback((type: ImageType) => {
        setLibraryViewSettings((prev) => ({ ...prev, ImageType: type }));
    }, [setLibraryViewSettings]);

    const toggleSetting = useCallback((key: 'ShowTitle' | 'ShowYear' | 'CardLayout') => {
        setLibraryViewSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }, [setLibraryViewSettings]);

    return (
        <MenuTrigger>
            <Button
                className={styles.toolbarButton}
                aria-label={globalize.translate('ViewSettings')}
            >
                <SvgIcon svg={IconSvgs.ellipsis} size={18} />
            </Button>
            <Popover className={styles.popover} placement="bottom end" offset={4}>
                <Menu className={styles.menu} aria-label="View settings">
                    {/* View mode */}
                    <div className={styles.sectionHeader}>{globalize.translate('View')}</div>
                    <MenuItem
                        className={styles.menuItem}
                        textValue={globalize.translate('GridView')}
                        onAction={() => setViewMode(ViewMode.GridView)}
                        data-selected={isGridView || undefined}
                    >
                        <span className={styles.menuItemText}>{globalize.translate('GridView')}</span>
                        {isGridView && <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />}
                    </MenuItem>
                    <MenuItem
                        className={styles.menuItem}
                        textValue={globalize.translate('ListView')}
                        onAction={() => setViewMode(ViewMode.ListView)}
                        data-selected={!isGridView || undefined}
                    >
                        <span className={styles.menuItemText}>{globalize.translate('ListView')}</span>
                        {!isGridView && <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />}
                    </MenuItem>

                    {isGridView && (
                        <>
                            {/* Image type */}
                            {isImageTypeVisible && (
                                <>
                                    <Separator className={styles.divider} />
                                    <div className={styles.sectionHeader}>{globalize.translate('LabelImageType')}</div>
                                    {imageTypeOptions.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            className={styles.menuItem}
                                            textValue={globalize.translate(option.label)}
                                            onAction={() => setImageType(option.value)}
                                            data-selected={libraryViewSettings.ImageType === option.value || undefined}
                                        >
                                            <span className={styles.menuItemText}>
                                                {globalize.translate(option.label)}
                                            </span>
                                            {libraryViewSettings.ImageType === option.value && (
                                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                                            )}
                                        </MenuItem>
                                    ))}
                                </>
                            )}

                            {/* Display options */}
                            <Separator className={styles.divider} />
                            <div className={styles.sectionHeader}>{globalize.translate('Display')}</div>
                            <MenuItem
                                className={styles.menuItem}
                                textValue={globalize.translate('ShowTitle')}
                                onAction={() => toggleSetting('ShowTitle')}
                            >
                                <span className={styles.menuItemText}>{globalize.translate('ShowTitle')}</span>
                                {libraryViewSettings.ShowTitle && (
                                    <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                                )}
                            </MenuItem>
                            {isImageTypeVisible && (
                                <MenuItem
                                    className={styles.menuItem}
                                    textValue={globalize.translate('ShowYear')}
                                    onAction={() => toggleSetting('ShowYear')}
                                >
                                    <span className={styles.menuItemText}>{globalize.translate('ShowYear')}</span>
                                    {libraryViewSettings.ShowYear && (
                                        <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                                    )}
                                </MenuItem>
                            )}
                            <MenuItem
                                className={styles.menuItem}
                                textValue={globalize.translate('EnableCardLayout')}
                                onAction={() => toggleSetting('CardLayout')}
                            >
                                <span className={styles.menuItemText}>{globalize.translate('EnableCardLayout')}</span>
                                {libraryViewSettings.CardLayout && (
                                    <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                                )}
                            </MenuItem>
                        </>
                    )}
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};

export default ViewSettingsMenu;
