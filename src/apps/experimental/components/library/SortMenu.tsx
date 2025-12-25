import React, { type FC, useCallback } from 'react';
import { Button, Menu, MenuItem, MenuTrigger, Popover, Section, Header } from 'react-aria-components';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import type { LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import styles from './LibraryToolbar.module.scss';

type SortOption = {
    label: string;
    value: ItemSortBy;
};

// Sort options per content type - matched to legacy app
const sortOptionsMapping: Record<string, SortOption[]> = {
    [LibraryTab.Movies]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionCriticRating', value: ItemSortBy.CriticRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ],
    [LibraryTab.Favorites]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionCriticRating', value: ItemSortBy.CriticRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime }
    ],
    [LibraryTab.Collections]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.Series]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionDateShowAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDateEpisodeAdded', value: ItemSortBy.DateLastContentAdded },
        { label: 'OptionDatePlayed', value: ItemSortBy.SeriesDatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate }
    ],
    [LibraryTab.Episodes]: [
        { label: 'Name', value: ItemSortBy.SeriesSortName },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionParentalRating', value: ItemSortBy.OfficialRating },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'Runtime', value: ItemSortBy.Runtime },
        { label: 'OptionRandom', value: ItemSortBy.Random }
    ],
    [LibraryTab.Albums]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'AlbumArtist', value: ItemSortBy.AlbumArtist },
        { label: 'OptionCommunityRating', value: ItemSortBy.CommunityRating },
        { label: 'OptionCriticRating', value: ItemSortBy.CriticRating },
        { label: 'OptionReleaseDate', value: ItemSortBy.ProductionYear },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.Songs]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'Album', value: ItemSortBy.Album },
        { label: 'AlbumArtist', value: ItemSortBy.AlbumArtist },
        { label: 'Artist', value: ItemSortBy.Artist },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'OptionReleaseDate', value: ItemSortBy.PremiereDate },
        { label: 'Runtime', value: ItemSortBy.Runtime },
        { label: 'OptionRandom', value: ItemSortBy.Random }
    ],
    [LibraryTab.Artists]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.AlbumArtists]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.PhotoAlbums]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.Photos]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionRandom', value: ItemSortBy.Random },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated }
    ],
    [LibraryTab.Videos]: [
        { label: 'Name', value: ItemSortBy.SortName },
        { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
        { label: 'OptionDatePlayed', value: ItemSortBy.DatePlayed },
        { label: 'OptionPlayCount', value: ItemSortBy.PlayCount },
        { label: 'Runtime', value: ItemSortBy.Runtime },
        { label: 'OptionRandom', value: ItemSortBy.Random }
    ]
};

const defaultSortOptions: SortOption[] = [
    { label: 'Name', value: ItemSortBy.SortName },
    { label: 'OptionDateAdded', value: ItemSortBy.DateCreated },
    { label: 'OptionRandom', value: ItemSortBy.Random }
];

const getSortOptions = (viewType: LibraryTab): SortOption[] => {
    return sortOptionsMapping[viewType] || defaultSortOptions;
};

interface SortMenuProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

export const SortMenu: FC<SortMenuProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const sortOptions = getSortOptions(viewType);
    const currentSortBy = libraryViewSettings.SortBy;
    const currentSortOrder = libraryViewSettings.SortOrder;

    const onSortBySelect = useCallback((value: ItemSortBy) => {
        setLibraryViewSettings((prev) => ({
            ...prev,
            StartIndex: 0,
            SortBy: value
        }));
    }, [setLibraryViewSettings]);

    const onSortOrderSelect = useCallback((value: SortOrder) => {
        setLibraryViewSettings((prev) => ({
            ...prev,
            StartIndex: 0,
            SortOrder: value
        }));
    }, [setLibraryViewSettings]);

    return (
        <MenuTrigger>
            <Button
                className={styles.toolbarButton}
                aria-label={globalize.translate('Sort')}
            >
                <SvgIcon svg={IconSvgs.sort} size={18} />
            </Button>
            <Popover className={styles.popover} placement="bottom start" offset={4}>
                <Menu className={styles.menu} aria-label="Sort options">
                    <Section>
                        <Header className={styles.sectionHeader}>
                            {globalize.translate('LabelSortBy')}
                        </Header>
                        {sortOptions.map((option) => (
                            <MenuItem
                                key={option.value}
                                id={`sort-${option.value}`}
                                className={styles.menuItem}
                                onAction={() => onSortBySelect(option.value)}
                            >
                                <span className={styles.menuItemText}>
                                    {globalize.translate(option.label)}
                                </span>
                                {option.value === currentSortBy && (
                                    <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                                )}
                            </MenuItem>
                        ))}
                    </Section>
                    <Section>
                        <Header className={styles.sectionHeader}>
                            {globalize.translate('LabelSortOrder')}
                        </Header>
                        <MenuItem
                            id="sort-order-asc"
                            className={styles.menuItem}
                            onAction={() => onSortOrderSelect(SortOrder.Ascending)}
                        >
                            <span className={styles.menuItemText}>{globalize.translate('Ascending')}</span>
                            {currentSortOrder === SortOrder.Ascending && (
                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                            )}
                        </MenuItem>
                        <MenuItem
                            id="sort-order-desc"
                            className={styles.menuItem}
                            onAction={() => onSortOrderSelect(SortOrder.Descending)}
                        >
                            <span className={styles.menuItemText}>{globalize.translate('Descending')}</span>
                            {currentSortOrder === SortOrder.Descending && (
                                <SvgIcon svg={IconSvgs.checkmark} size={16} className={styles.menuItemCheck} />
                            )}
                        </MenuItem>
                    </Section>
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};

export default SortMenu;
