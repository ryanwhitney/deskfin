import React, { type FC, useRef } from 'react';
import {
    Button,
    Dialog,
    DialogTrigger,
    Disclosure,
    DisclosureGroup,
    DisclosurePanel,
    Heading,
    ListBox,
    ListBoxItem,
    Popover,
    type Selection
} from 'react-aria-components';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';

import globalize from 'lib/globalize';
import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
import { useGetQueryFiltersLegacy, useGetStudios } from 'hooks/useFetchItems';
import {
    type LibraryViewSettings,
    type ParentId,
    type Filters,
    FeatureFilters,
    EpisodeFilter,
    VideoBasicFilter
} from 'types/library';
import { LibraryTab } from 'apps/deskfin/types/libraryTab';

import styles from './LibraryToolbar.module.scss';

/** The filters this menu sets. All hold strings except Years, which holds numbers. */
type FilterKey = 'Status' | 'SeriesStatus' | 'EpisodeFilter' | 'Features' | 'VideoBasicFilter' | 'Genres'
    | 'OfficialRatings' | 'Tags' | 'Years' | 'StudioIds';

interface FilterSection {
    filter: FilterKey;
    title: string;
    options: { id: string; value: string; label: string }[];
    isExpanded?: boolean;
}

// `id` is for the ListBox's item collection
const option = (value: string, label = value) => ({ id: value, value, label });

interface FilterMenuProps {
    parentId: ParentId;
    itemType: BaseItemKind[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

export const FilterMenu: FC<FilterMenuProps> = ({
    parentId,
    itemType,
    viewType,
    hasFilters,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const { data: filtersData } = useGetQueryFiltersLegacy(parentId, itemType);
    const { data: studios } = useGetStudios(parentId, itemType);

    const filters = libraryViewSettings.Filters || {};
    const firstHeaderRef = useRef<HTMLButtonElement>(null);

    const setFilters = (update: (prev: Filters | undefined) => Filters) => {
        setLibraryViewSettings((prev) => ({ ...prev, StartIndex: 0, Filters: update(prev.Filters) }));
    };

    const setFilter = (filter: FilterKey, values: string[]) => {
        const value = filter === 'Years' ? values.map(Number) : values;
        setFilters(prev => ({ ...prev, [filter]: value.length ? value : undefined }));
    };

    const isMoviesOrSeries = [LibraryTab.Movies, LibraryTab.Series].includes(viewType);
    const isVideo = [LibraryTab.Movies, LibraryTab.Episodes].includes(viewType);

    // Sections with no options aren't shown
    const sections: FilterSection[] = [
        {
            filter: 'Status',
            title: globalize.translate('Filters'),
            isExpanded: true,
            options: [
                option(ItemFilter.IsPlayed, globalize.translate('Played')),
                option(ItemFilter.IsUnplayed, globalize.translate('Unplayed')),
                option(ItemFilter.IsFavorite, globalize.translate('Favorite')),
                option(ItemFilter.IsResumable, globalize.translate('ContinueWatching'))
            ]
        },
        {
            filter: 'SeriesStatus',
            title: globalize.translate('HeaderSeriesStatus'),
            options: viewType === LibraryTab.Series ? [
                option(SeriesStatus.Continuing, globalize.translate('Continuing')),
                option(SeriesStatus.Ended, globalize.translate('Ended'))
            ] : []
        },
        {
            filter: 'EpisodeFilter',
            title: globalize.translate('HeaderEpisodesStatus'),
            options: viewType === LibraryTab.Episodes ? [
                option(EpisodeFilter.IsMissing, globalize.translate('OptionMissingEpisode')),
                option(EpisodeFilter.IsUnaired, globalize.translate('OptionUnairedEpisode'))
            ] : []
        },
        {
            filter: 'Features',
            title: globalize.translate('Features'),
            options: isMoviesOrSeries || viewType === LibraryTab.Episodes ? [
                option(FeatureFilters.HasSubtitles, globalize.translate('Subtitles')),
                option(FeatureFilters.HasTrailer, globalize.translate('Trailers')),
                option(FeatureFilters.HasSpecialFeature, globalize.translate('SpecialFeatures')),
                option(FeatureFilters.HasThemeSong, globalize.translate('ThemeSongs')),
                option(FeatureFilters.HasThemeVideo, globalize.translate('ThemeVideos'))
            ] : []
        },
        {
            filter: 'VideoBasicFilter',
            title: globalize.translate('HeaderVideoType'),
            options: isVideo ? [
                option(VideoBasicFilter.Is4K, '4K'),
                option(VideoBasicFilter.IsHD, 'HD'),
                option(VideoBasicFilter.IsSD, 'SD'),
                option(VideoBasicFilter.Is3D, '3D')
            ] : []
        },
        {
            filter: 'Genres',
            title: globalize.translate('Genres'),
            options: (filtersData?.Genres ?? []).map(genre => option(genre))
        },
        {
            filter: 'OfficialRatings',
            title: globalize.translate('HeaderParentalRatings'),
            options: (filtersData?.OfficialRatings ?? []).map(rating => option(rating))
        },
        {
            filter: 'Tags',
            title: globalize.translate('Tags'),
            options: (filtersData?.Tags ?? []).map(tag => option(tag))
        },
        {
            filter: 'Years',
            title: globalize.translate('HeaderYears'),
            options: (filtersData?.Years ?? []).map(year => option(String(year)))
        },
        {
            filter: 'StudioIds',
            title: globalize.translate('Studios'),
            options: isMoviesOrSeries ?
                (studios ?? []).filter(studio => studio.Id).map(studio => option(studio.Id!, studio.Name ?? '')) :
                []
        }
    ];

    const visibleSections = sections
        .filter(section => section.options.length)
        .map(section => {
            const values = (filters[section.filter] ?? []).map(String);
            return { ...section, selected: section.options.filter(o => values.includes(o.value)) };
        });
    const activeCount = visibleSections.reduce((count, section) => count + section.selected.length, 0);

    return (
        <DialogTrigger>
            <Button
                className={styles.toolbarButton}
                aria-label={globalize.translate('Filter')}
            >
                <span className={hasFilters ? styles.badge : undefined}>
                    <SvgIcon svg={IconSvgs.settings} size={18} />
                    {hasFilters && <span className={styles.badgeDot} />}
                </span>
                <span>{globalize.translate('Filter')}</span>
            </Button>
            <Popover className={styles.popover} placement='bottom start' offset={4}>
                <Dialog className={styles.filterDialog} aria-label={globalize.translate('Filter')}>
                    <div className={styles.filterSummaryBar}>
                        <span>{activeCount ? `${activeCount} active` : 'No filters'}</span>
                        <Button
                            className={styles.clearButton}
                            isDisabled={!activeCount}
                            onPress={() => {
                                // This button disables itself once nothing is active; keep focus in the menu
                                firstHeaderRef.current?.focus();
                                setFilters(() => ({}));
                            }}
                        >
                            Clear all
                        </Button>
                    </div>
                    <DisclosureGroup
                        allowsMultipleExpanded
                        defaultExpandedKeys={visibleSections.filter(s => s.isExpanded || s.selected.length).map(s => s.filter)}
                    >
                        {visibleSections.map((section, index) => (
                            <Disclosure key={section.filter} id={section.filter} className={styles.accordionSection}>
                                <Heading level={3} className={styles.accordionHeading}>
                                    <Button
                                        ref={index === 0 ? firstHeaderRef : undefined}
                                        slot='trigger'
                                        className={styles.accordionHeader}
                                        // Like the Sort menu, opening starts on the first option, so focus is visible
                                        // eslint-disable-next-line jsx-a11y/no-autofocus
                                        autoFocus={index === 0}
                                    >
                                        <span className={styles.accordionTitle}>
                                            <span>{section.title}</span>
                                            {section.selected.length > 0 && (
                                                <span className={styles.accordionSummary}>
                                                    {section.selected.map(o => o.label).join(', ')}
                                                </span>
                                            )}
                                        </span>
                                        <SvgIcon svg={IconSvgs.chevronDown} size={14} className={styles.accordionChevron} />
                                    </Button>
                                </Heading>
                                <DisclosurePanel className={styles.accordionContent}>
                                    <ListBox
                                        aria-label={section.title}
                                        className={styles.optionList}
                                        selectionMode='multiple'
                                        // Escape closes the menu rather than clearing this section's choices
                                        escapeKeyBehavior='none'
                                        items={section.options}
                                        selectedKeys={section.selected.map(o => o.value)}
                                        onSelectionChange={(keys: Selection) => setFilter(
                                            section.filter,
                                            keys === 'all' ? section.options.map(o => o.value) : [...keys].map(String)
                                        )}
                                    >
                                        {opt => (
                                            <ListBoxItem id={opt.value} textValue={opt.label} className={styles.option}>
                                                <span className={styles.checkbox} aria-hidden='true'>
                                                    <SvgIcon svg={IconSvgs.checkmark} size={12} />
                                                </span>
                                                {opt.label}
                                            </ListBoxItem>
                                        )}
                                    </ListBox>
                                </DisclosurePanel>
                            </Disclosure>
                        ))}
                    </DisclosureGroup>
                </Dialog>
            </Popover>
        </DialogTrigger>
    );
};

export default FilterMenu;
