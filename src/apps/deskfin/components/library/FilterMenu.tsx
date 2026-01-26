import React, { type FC, useState, useCallback } from 'react';
import { Button, DialogTrigger, Popover } from 'react-aria-components';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';

import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { useGetQueryFiltersLegacy, useGetStudios } from 'hooks/useFetchItems';
import {
    type LibraryViewSettings,
    type ParentId,
    type Filters,
    FeatureFilters,
    EpisodeFilter,
    VideoBasicFilter
} from 'types/library';
import { LibraryTab } from 'types/libraryTab';

import styles from './LibraryToolbar.module.scss';

interface AccordionSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const AccordionSection: FC<AccordionSectionProps> = ({ title, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={styles.accordionSection}>
            <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <SvgIcon
                    svg={IconSvgs.chevronDown}
                    size={14}
                    className={styles.accordionChevron}
                    data-expanded={isOpen}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>
            {isOpen && <div className={styles.accordionContent}>{children}</div>}
        </div>
    );
};

interface CheckboxOptionProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const CheckboxOption: FC<CheckboxOptionProps> = ({ label, checked, onChange }) => (
    <label className={styles.checkboxLabel}>
        <input
            type="checkbox"
            className={styles.checkbox}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
    </label>
);

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

    // Helper to update a filter property
    const updateFilter = useCallback(<K extends keyof Filters>(
        key: K,
        value: Filters[K]
    ) => {
        setLibraryViewSettings((prev) => ({
            ...prev,
            StartIndex: 0,
            Filters: {
                ...prev.Filters,
                [key]: value
            }
        }));
    }, [setLibraryViewSettings]);

    // Toggle array filter helpers
    const toggleStatusFilter = useCallback((value: ItemFilter) => {
        const current = filters.Status || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('Status', updated.length > 0 ? updated : undefined);
    }, [filters.Status, updateFilter]);

    const toggleSeriesStatusFilter = useCallback((value: SeriesStatus) => {
        const current = filters.SeriesStatus || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('SeriesStatus', updated.length > 0 ? updated : undefined);
    }, [filters.SeriesStatus, updateFilter]);

    const toggleEpisodeFilter = useCallback((value: EpisodeFilter) => {
        const current = filters.EpisodeFilter || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('EpisodeFilter', updated.length > 0 ? updated : undefined);
    }, [filters.EpisodeFilter, updateFilter]);

    const toggleFeatureFilter = useCallback((value: FeatureFilters) => {
        const current = filters.Features || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('Features', updated.length > 0 ? updated : undefined);
    }, [filters.Features, updateFilter]);

    const toggleVideoBasicFilter = useCallback((value: VideoBasicFilter) => {
        const current = filters.VideoBasicFilter || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('VideoBasicFilter', updated.length > 0 ? updated : undefined);
    }, [filters.VideoBasicFilter, updateFilter]);

    const toggleGenreFilter = useCallback((value: string) => {
        const current = filters.Genres || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('Genres', updated.length > 0 ? updated : undefined);
    }, [filters.Genres, updateFilter]);

    const toggleRatingFilter = useCallback((value: string) => {
        const current = filters.OfficialRatings || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('OfficialRatings', updated.length > 0 ? updated : undefined);
    }, [filters.OfficialRatings, updateFilter]);

    const toggleTagFilter = useCallback((value: string) => {
        const current = filters.Tags || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('Tags', updated.length > 0 ? updated : undefined);
    }, [filters.Tags, updateFilter]);

    const toggleYearFilter = useCallback((value: number) => {
        const current = filters.Years || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('Years', updated.length > 0 ? updated : undefined);
    }, [filters.Years, updateFilter]);

    const toggleStudioFilter = useCallback((value: string) => {
        const current = filters.StudioIds || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        updateFilter('StudioIds', updated.length > 0 ? updated : undefined);
    }, [filters.StudioIds, updateFilter]);

    // Determine which filter sections to show based on view type
    const showStatusFilters = true;
    const showSeriesStatus = viewType === LibraryTab.Series;
    const showEpisodeStatus = viewType === LibraryTab.Episodes;
    const showFeatures = [LibraryTab.Movies, LibraryTab.Series, LibraryTab.Episodes].includes(viewType);
    const showVideoTypes = [LibraryTab.Movies, LibraryTab.Episodes].includes(viewType);
    const showGenres = filtersData?.Genres && filtersData.Genres.length > 0;
    const showRatings = filtersData?.OfficialRatings && filtersData.OfficialRatings.length > 0;
    const showTags = filtersData?.Tags && filtersData.Tags.length > 0;
    const showYears = filtersData?.Years && filtersData.Years.length > 0;
    const showStudios = [LibraryTab.Movies, LibraryTab.Series].includes(viewType) && studios && studios.length > 0;

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
            <Popover className={styles.popover} placement="bottom start" offset={4}>
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                    {/* Status filters */}
                    {showStatusFilters && (
                        <AccordionSection title={globalize.translate('Filters')} defaultOpen>
                            <div className={styles.checkboxGroup}>
                                <CheckboxOption
                                    label={globalize.translate('Played')}
                                    checked={(filters.Status || []).includes(ItemFilter.IsPlayed)}
                                    onChange={() => toggleStatusFilter(ItemFilter.IsPlayed)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('Unplayed')}
                                    checked={(filters.Status || []).includes(ItemFilter.IsUnplayed)}
                                    onChange={() => toggleStatusFilter(ItemFilter.IsUnplayed)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('Favorite')}
                                    checked={(filters.Status || []).includes(ItemFilter.IsFavorite)}
                                    onChange={() => toggleStatusFilter(ItemFilter.IsFavorite)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('ContinueWatching')}
                                    checked={(filters.Status || []).includes(ItemFilter.IsResumable)}
                                    onChange={() => toggleStatusFilter(ItemFilter.IsResumable)}
                                />
                            </div>
                        </AccordionSection>
                    )}

                    {/* Series status */}
                    {showSeriesStatus && (
                        <AccordionSection title={globalize.translate('HeaderSeriesStatus')}>
                            <div className={styles.checkboxGroup}>
                                <CheckboxOption
                                    label={globalize.translate('Continuing')}
                                    checked={(filters.SeriesStatus || []).includes(SeriesStatus.Continuing)}
                                    onChange={() => toggleSeriesStatusFilter(SeriesStatus.Continuing)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('Ended')}
                                    checked={(filters.SeriesStatus || []).includes(SeriesStatus.Ended)}
                                    onChange={() => toggleSeriesStatusFilter(SeriesStatus.Ended)}
                                />
                            </div>
                        </AccordionSection>
                    )}

                    {/* Episode status */}
                    {showEpisodeStatus && (
                        <AccordionSection title={globalize.translate('HeaderEpisodesStatus')}>
                            <div className={styles.checkboxGroup}>
                                <CheckboxOption
                                    label={globalize.translate('OptionMissingEpisode')}
                                    checked={(filters.EpisodeFilter || []).includes(EpisodeFilter.IsMissing)}
                                    onChange={() => toggleEpisodeFilter(EpisodeFilter.IsMissing)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('OptionUnairedEpisode')}
                                    checked={(filters.EpisodeFilter || []).includes(EpisodeFilter.IsUnaired)}
                                    onChange={() => toggleEpisodeFilter(EpisodeFilter.IsUnaired)}
                                />
                            </div>
                        </AccordionSection>
                    )}

                    {/* Features */}
                    {showFeatures && (
                        <AccordionSection title={globalize.translate('Features')}>
                            <div className={styles.checkboxGroup}>
                                <CheckboxOption
                                    label={globalize.translate('Subtitles')}
                                    checked={(filters.Features || []).includes(FeatureFilters.HasSubtitles)}
                                    onChange={() => toggleFeatureFilter(FeatureFilters.HasSubtitles)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('Trailers')}
                                    checked={(filters.Features || []).includes(FeatureFilters.HasTrailer)}
                                    onChange={() => toggleFeatureFilter(FeatureFilters.HasTrailer)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('SpecialFeatures')}
                                    checked={(filters.Features || []).includes(FeatureFilters.HasSpecialFeature)}
                                    onChange={() => toggleFeatureFilter(FeatureFilters.HasSpecialFeature)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('ThemeSongs')}
                                    checked={(filters.Features || []).includes(FeatureFilters.HasThemeSong)}
                                    onChange={() => toggleFeatureFilter(FeatureFilters.HasThemeSong)}
                                />
                                <CheckboxOption
                                    label={globalize.translate('ThemeVideos')}
                                    checked={(filters.Features || []).includes(FeatureFilters.HasThemeVideo)}
                                    onChange={() => toggleFeatureFilter(FeatureFilters.HasThemeVideo)}
                                />
                            </div>
                        </AccordionSection>
                    )}

                    {/* Video types */}
                    {showVideoTypes && (
                        <AccordionSection title={globalize.translate('HeaderVideoType')}>
                            <div className={styles.checkboxGroup}>
                                <CheckboxOption
                                    label="4K"
                                    checked={(filters.VideoBasicFilter || []).includes(VideoBasicFilter.Is4K)}
                                    onChange={() => toggleVideoBasicFilter(VideoBasicFilter.Is4K)}
                                />
                                <CheckboxOption
                                    label="HD"
                                    checked={(filters.VideoBasicFilter || []).includes(VideoBasicFilter.IsHD)}
                                    onChange={() => toggleVideoBasicFilter(VideoBasicFilter.IsHD)}
                                />
                                <CheckboxOption
                                    label="SD"
                                    checked={(filters.VideoBasicFilter || []).includes(VideoBasicFilter.IsSD)}
                                    onChange={() => toggleVideoBasicFilter(VideoBasicFilter.IsSD)}
                                />
                                <CheckboxOption
                                    label="3D"
                                    checked={(filters.VideoBasicFilter || []).includes(VideoBasicFilter.Is3D)}
                                    onChange={() => toggleVideoBasicFilter(VideoBasicFilter.Is3D)}
                                />
                            </div>
                        </AccordionSection>
                    )}

                    {/* Genres */}
                    {showGenres && (
                        <AccordionSection title={globalize.translate('Genres')}>
                            <div className={styles.checkboxGroup}>
                                {filtersData!.Genres!.map((genre) => (
                                    <CheckboxOption
                                        key={genre}
                                        label={genre}
                                        checked={(filters.Genres || []).includes(genre)}
                                        onChange={() => toggleGenreFilter(genre)}
                                    />
                                ))}
                            </div>
                        </AccordionSection>
                    )}

                    {/* Parental ratings */}
                    {showRatings && (
                        <AccordionSection title={globalize.translate('HeaderParentalRatings')}>
                            <div className={styles.checkboxGroup}>
                                {filtersData!.OfficialRatings!.map((rating) => (
                                    <CheckboxOption
                                        key={rating}
                                        label={rating}
                                        checked={(filters.OfficialRatings || []).includes(rating)}
                                        onChange={() => toggleRatingFilter(rating)}
                                    />
                                ))}
                            </div>
                        </AccordionSection>
                    )}

                    {/* Tags */}
                    {showTags && (
                        <AccordionSection title={globalize.translate('Tags')}>
                            <div className={styles.checkboxGroup}>
                                {filtersData!.Tags!.map((tag) => (
                                    <CheckboxOption
                                        key={tag}
                                        label={tag}
                                        checked={(filters.Tags || []).includes(tag)}
                                        onChange={() => toggleTagFilter(tag)}
                                    />
                                ))}
                            </div>
                        </AccordionSection>
                    )}

                    {/* Years */}
                    {showYears && (
                        <AccordionSection title={globalize.translate('HeaderYears')}>
                            <div className={styles.checkboxGroup}>
                                {filtersData!.Years!.map((year) => (
                                    <CheckboxOption
                                        key={year}
                                        label={String(year)}
                                        checked={(filters.Years || []).includes(year)}
                                        onChange={() => toggleYearFilter(year)}
                                    />
                                ))}
                            </div>
                        </AccordionSection>
                    )}

                    {/* Studios */}
                    {showStudios && (
                        <AccordionSection title={globalize.translate('Studios')}>
                            <div className={styles.checkboxGroup}>
                                {studios!.map((studio) => (
                                    <CheckboxOption
                                        key={studio.Id}
                                        label={studio.Name || ''}
                                        checked={(filters.StudioIds || []).includes(studio.Id!)}
                                        onChange={() => toggleStudioFilter(studio.Id!)}
                                    />
                                ))}
                            </div>
                        </AccordionSection>
                    )}
                </div>
            </Popover>
        </DialogTrigger>
    );
};

export default FilterMenu;
