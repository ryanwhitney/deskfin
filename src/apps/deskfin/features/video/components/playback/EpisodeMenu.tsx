import React, { type FC, useState, useEffect, useCallback, useRef } from 'react';
import { Button as RacButton, DialogTrigger, Popover } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

import { playbackManager } from 'components/playback/playbackmanager';
import { useGetItems } from 'hooks/useFetchItems';
import { useApi } from 'hooks/useApi';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

import { useBlurOnMousePress } from './useBlurOnMousePress';
import styles from './EpisodeMenu.module.scss';

type MenuView = 'episodes' | 'seasons';

interface EpisodeMenuProps {
    player: any;
}

export const EpisodeMenu: FC<EpisodeMenuProps> = ({ player }) => {
    const { user } = useApi();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
    const [menuView, setMenuView] = useState<MenuView>('episodes');
    const { ref: buttonRef, handlePress, blurOnMenuClose } = useBlurOnMousePress();
    const listRef = useRef<HTMLDivElement>(null);

    // Get current item info
    const currentItem = playbackManager.currentItem(player) as ItemDto | null;
    const seriesId = (currentItem as any)?.SeriesId as string | undefined;
    const currentSeasonId = (currentItem as any)?.SeasonId as string | undefined;
    const currentEpisodeId = currentItem?.Id;
    const isEpisode = currentItem?.Type === 'Episode';

    // Initialize selectedSeasonId to current season
    useEffect(() => {
        if (currentSeasonId && !selectedSeasonId) {
            setSelectedSeasonId(currentSeasonId);
        }
    }, [currentSeasonId, selectedSeasonId]);

    // Reset to current season and episodes view when menu opens
    useEffect(() => {
        if (isOpen) {
            if (currentSeasonId) {
                setSelectedSeasonId(currentSeasonId);
            }
            setMenuView('episodes');
        }
    }, [isOpen, currentSeasonId]);

    // Fetch all seasons for the series (always fetch when open)
    const { data: seasonsResult, isLoading: seasonsLoading } = useGetItems({
        userId: user?.Id,
        parentId: seriesId,
        includeItemTypes: [BaseItemKind.Season],
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        enableTotalRecordCount: false
    }, { enabled: !!seriesId && !!user?.Id && isOpen });

    // Fetch episodes for the selected season
    const { data: episodesResult, isLoading: episodesLoading } = useGetItems({
        userId: user?.Id,
        parentId: selectedSeasonId ?? undefined,
        includeItemTypes: [BaseItemKind.Episode],
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        enableTotalRecordCount: false
    }, { enabled: !!selectedSeasonId && !!user?.Id && isOpen });

    const seasons = seasonsResult?.Items ?? [];
    const episodes = episodesResult?.Items ?? [];
    const hasMultipleSeasons = seasons.length > 1;

    // Get current season name
    const selectedSeason = seasons.find(s => s.Id === selectedSeasonId);
    const seasonName = selectedSeason?.Name ?? globalize.translate('Season');

    const handleEpisodeSelect = useCallback((episode: ItemDto) => {
        playbackManager.play({
            items: [episode]
        });
        setIsOpen(false);
    }, []);

    const handleSeasonSelect = useCallback((seasonId: string) => {
        setSelectedSeasonId(seasonId);
        setMenuView('episodes');
    }, []);

    const handleShowSeasons = useCallback(() => {
        setMenuView('seasons');
    }, []);

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
        if (!open) {
            blurOnMenuClose();
        }
    }, [blurOnMenuClose]);

    // Scroll to current episode when episodes load
    useEffect(() => {
        if (menuView === 'episodes' && !episodesLoading && episodes.length > 0 && listRef.current) {
            const currentEl = listRef.current.querySelector('[data-current="true"]');
            if (currentEl) {
                currentEl.scrollIntoView({ block: 'center' });
            }
        }
    }, [menuView, episodesLoading, episodes, currentEpisodeId]);

    // Don't render if not an episode or no series
    if (!isEpisode || !seriesId) {
        return null;
    }

    const isLoading = menuView === 'episodes' ? episodesLoading : seasonsLoading;

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
            <FocusRing focusRingClass="focus-ring">
                <RacButton
                    ref={buttonRef}
                    className={styles.iconButton}
                    aria-label={globalize.translate('Episodes')}
                    onPress={handlePress}
                >
                    <SvgIcon svg={IconSvgs.listBullet} size={20} />
                </RacButton>
            </FocusRing>

            <Popover
                className={styles.popover}
                placement="top"
                offset={8}
            >
                <div className={styles.container}>
                    {/* EPISODES VIEW */}
                    {menuView === 'episodes' && (
                        <>
                            {/* Season selector header - looks like "back" action if multiple seasons */}
                            {hasMultipleSeasons && (
                                <button
                                    type="button"
                                    className={styles.navItem}
                                    onClick={handleShowSeasons}
                                >
                                    <ChevronLeft className={styles.chevronLeft} />
                                    <span className={styles.itemText}>{seasonName}</span>
                                </button>
                            )}

                            {/* Single season header (non-interactive) */}
                            {!hasMultipleSeasons && seasons.length > 0 && (
                                <div className={styles.sectionHeader}>{seasonName}</div>
                            )}

                            {/* Separator */}
                            {seasons.length > 0 && <div className={styles.separator} />}

                            {/* Loading state */}
                            {isLoading && (
                                <div className={styles.loading}>
                                    <span className={styles.loadingText}>Loading...</span>
                                </div>
                            )}

                            {/* Episodes list */}
                            {!isLoading && (
                                <div className={styles.scrollList} ref={listRef}>
                                    {episodes.map((episode) => {
                                        const episodeNum = (episode as any).IndexNumber;
                                        const episodeName = episode.Name;
                                        const displayText = episodeNum
                                            ? `${episodeNum}. ${episodeName}`
                                            : episodeName;
                                        const isCurrent = episode.Id === currentEpisodeId;

                                        return (
                                            <button
                                                key={episode.Id}
                                                type="button"
                                                className={`${styles.listItem} ${isCurrent ? styles.current : ''}`}
                                                onClick={() => handleEpisodeSelect(episode)}
                                                data-current={isCurrent}
                                            >
                                                <span className={styles.itemText}>
                                                    {displayText}
                                                </span>
                                                {isCurrent && (
                                                    <SvgIcon
                                                        svg={IconSvgs.checkmark}
                                                        size={18}
                                                        className={styles.checkmark}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* SEASONS VIEW */}
                    {menuView === 'seasons' && (
                        <>
                            {/* Loading state */}
                            {isLoading && (
                                <div className={styles.loading}>
                                    <span className={styles.loadingText}>Loading...</span>
                                </div>
                            )}

                            {/* Seasons list - each season navigates forward to episodes */}
                            {!isLoading && (
                                <div className={styles.scrollList}>
                                    {seasons.map((season) => {
                                        const isSelected = season.Id === selectedSeasonId;

                                        return (
                                            <button
                                                key={season.Id}
                                                type="button"
                                                className={`${styles.listItem} ${isSelected ? styles.current : ''}`}
                                                onClick={() => handleSeasonSelect(season.Id!)}
                                            >
                                                <span className={styles.itemText}>
                                                    {season.Name}
                                                </span>
                                                <ChevronRight className={styles.chevronRight} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Popover>
        </DialogTrigger>
    );
};
