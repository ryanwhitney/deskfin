import React, { type FC, type MouseEvent, memo, useMemo, useState } from 'react';
import { Squircle } from 'apps/deskfin/components/squircle/Squircle';

import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs, getLegacyCommandIcon } from 'apps/deskfin/assets/icons';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ItemDto } from 'types/base/models/item-dto';
import { playbackManager } from 'components/playback/playbackmanager';

import {
    Button as RacButton,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    Separator
} from 'react-aria-components';
import { FocusRing, useFocusWithin } from 'react-aria';

import * as itemContextMenu from 'components/itemContextMenu';
import { ActionMenuStyles } from 'apps/deskfin/components/menu/ActionMenu';
import { type MenuCommand, withMenuKeys } from 'apps/deskfin/components/menu/menuKeys';
import { WatchlistMenuItem } from 'apps/deskfin/features/watchlist/components/WatchlistMenuItem';
import { CreateWatchlistDialog } from 'apps/deskfin/features/watchlist/components/CreateWatchlistDialog';
import { type PlaylistContext, usePlaylistItemActions } from 'apps/deskfin/features/watchlist/hooks/usePlaylistItemActions';

import styles from './MediaCard.module.scss';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

export type MediaCardVariant = 'portrait' | 'landscape';

export const MediaCardStyles = styles;

export type MediaCardProps = {
    item: ItemDto;
    user: UserDto | undefined;
    variant?: MediaCardVariant;
    imageUrl?: string;
    /** Load this card's image right away at high priority (cards visible at first paint); others load lazily. */
    isImagePriority?: boolean;
    overlayCount?: number;
    progressPct?: number;
    title: string;
    titleHref: string;
    subtitle?: string;
    subtitleHref?: string;
    isRovingFocused?: boolean;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    onAfterAction: () => void;
    playlistContext?: PlaylistContext;
};

const stopPropagation = (e: MouseEvent) => e.stopPropagation();

/** A menu row with a leading icon. */
const MenuRow: FC<{
    textValue: string;
    icon?: string;
    iconStyle?: React.CSSProperties;
    onAction: () => void;
    children: React.ReactNode;
}> = ({ textValue, icon, iconStyle, onAction, children }) => (
    <MenuItem className={ActionMenuStyles.item} textValue={textValue} onAction={onAction}>
        <span className={ActionMenuStyles.icon} aria-hidden='true' style={iconStyle}>
            {icon ? <SvgIcon svg={icon} size={18} /> : null}
        </span>
        <span className={ActionMenuStyles.text}>{children}</span>
    </MenuItem>
);

/** Reorder/remove options shown when the card is inside a playlist. */
const PlaylistItemMenuItems: FC<{
    playlistName: string;
    actions: ReturnType<typeof usePlaylistItemActions>;
}> = ({ playlistName, actions }) => (
    <>
        <MenuRow
            textValue='Move to front'
            icon={IconSvgs.chevronDown}
            iconStyle={{ transform: 'rotate(180deg)' }}
            onAction={() => { void actions.moveToFront(); }}
        >
            Move to front
        </MenuRow>
        <MenuRow textValue='Move to back' icon={IconSvgs.chevronDown} onAction={() => { void actions.moveToBack(); }}>
            Move to back
        </MenuRow>
        <MenuRow
            textValue={`Remove from ${playlistName}`}
            icon={IconSvgs.delete}
            onAction={() => { void actions.remove(); }}
        >
            Remove from {playlistName}
        </MenuRow>
    </>
);

interface MediaCardMenuProps {
    item: ItemDto;
    user: UserDto | undefined;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onToggleFavorite: (item: ItemDto) => void;
    onTogglePlayed: (item: ItemDto) => void;
    onAfterAction: () => void;
    onCreatePlaylist: () => void;
    playlistContext?: PlaylistContext;
}

/** The card's "More" menu: favorite/watched, upstream's item commands, and playlist options. */
const MediaCardMenu: FC<MediaCardMenuProps> = ({
    item,
    user,
    isOpen,
    onOpenChange,
    onToggleFavorite,
    onTogglePlayed,
    onAfterAction,
    onCreatePlaylist,
    playlistContext
}) => {
    const [ commands, setCommands ] = useState<MenuCommand[]>([]);
    const playlistActions = usePlaylistItemActions(item, playlistContext, onAfterAction);
    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;

    const menuOptions = useMemo(() => ({
        item,
        user,
        play: true,
        queue: true,
        shuffle: true,
        instantMix: true,
        playlist: true,
        edit: true,
        editImages: true,
        editSubtitles: true,
        deleteItem: true,
        positionTo: null
    }), [ item, user ]);

    // Load on first open.
    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (open && !commands.length) {
            void itemContextMenu
                .getCommands(menuOptions)
                .then((cmds) => setCommands(cmds as MenuCommand[]))
                .catch(() => setCommands([]));
        }
    };

    const onCommand = async (id: string) => {
        try {
            const result = await itemContextMenu.executeCommand(item, id, menuOptions);
            if (result?.updated || result?.deleted) {
                onAfterAction();
            }
        } catch (e) {
            console.error('[MediaCard] command failed', id, e);
        }
    };

    const renderCommand = (cmd: ReturnType<typeof withMenuKeys>[number]) => {
        // Skip AddToPlaylist - we'll use WatchlistMenuItem instead
        if (cmd.id === 'addtoplaylist') return null;
        if (cmd.divider) return <Separator key={cmd.key} className={ActionMenuStyles.divider} />;
        const id = cmd.id;
        if (!id) return null;

        const menuItem = (
            <MenuRow key={id} textValue={cmd.name ?? id} icon={getLegacyCommandIcon(cmd.icon)} onAction={() => { void onCommand(id); }}>
                {cmd.name ?? id}
            </MenuRow>
        );
        if (id !== 'addtocollection') return menuItem;

        // After AddToCollection, insert our playlist options
        return (
            <React.Fragment key={id}>
                {menuItem}
                <WatchlistMenuItem item={item as BaseItemDto} onCreateNew={onCreatePlaylist} />
                {playlistContext && item.PlaylistItemId && (
                    <PlaylistItemMenuItems playlistName={playlistContext.playlistName} actions={playlistActions} />
                )}
            </React.Fragment>
        );
    };

    return (
        <MenuTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
            <FocusRing focusRingClass='focus-ring'>
                <RacButton className={styles.iconBtn} aria-label='More'>
                    <SvgIcon svg={IconSvgs.ellipsis} size={18} />
                </RacButton>
            </FocusRing>
            <Popover className={ActionMenuStyles.popover}>
                <Menu className={ActionMenuStyles.menu} aria-label='More options'>
                    <MenuRow
                        textValue={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        icon={IconSvgs.heart}
                        iconStyle={{ color: isFavorite ? '#ff4d6d' : undefined }}
                        onAction={() => onToggleFavorite(item)}
                    >
                        {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    </MenuRow>
                    <MenuRow
                        textValue={isPlayed ? 'Mark as unwatched' : 'Mark as watched'}
                        icon={IconSvgs.checkmark}
                        iconStyle={{ color: isPlayed ? '#4ade80' : undefined }}
                        onAction={() => onTogglePlayed(item)}
                    >
                        {isPlayed ? 'Mark as unwatched' : 'Mark as watched'}
                    </MenuRow>
                    {commands.length > 0 && <Separator className={ActionMenuStyles.divider} />}
                    {withMenuKeys(commands).map(renderCommand)}
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};

/** Subtitle line: a link when it has a destination, plain text otherwise. */
const CardSubtitle: FC<{ subtitle?: string; subtitleHref?: string }> = ({ subtitle, subtitleHref }) => {
    if (!subtitle) return null;
    if (!subtitleHref) return <div className={styles.subTitle}>{subtitle}</div>;
    return (
        <FocusRing focusRingClass='focus-ring'>
            <a className={styles.subTitle} href={subtitleHref} onClick={stopPropagation}>
                {subtitle}
            </a>
        </FocusRing>
    );
};

const MediaCardView: FC<MediaCardProps> = ({
    item,
    user,
    variant = 'portrait',
    imageUrl,
    isImagePriority = false,
    overlayCount,
    progressPct = 0,
    title,
    titleHref,
    subtitle,
    subtitleHref,
    isRovingFocused = false,
    onToggleFavorite,
    onTogglePlayed,
    onAfterAction,
    playlistContext
}) => {
    const [ isMoreOpen, setIsMoreOpen ] = useState(false);
    const [ isCreateDialogOpen, setIsCreateDialogOpen ] = useState(false);
    const [ isFocusWithin, setIsFocusWithin ] = useState(false);
    const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setIsFocusWithin });
    const isActive = isRovingFocused || isFocusWithin || isMoreOpen;
    const isPlayed = !!item.UserData?.Played;
    // Lowercase attribute: React 18 doesn't know `fetchPriority` yet
    const priorityProps = isImagePriority ? { fetchpriority: 'high' } : undefined;

    const onOpenDetails = (e: MouseEvent) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest('a,button,[role="menu"],[role="menuitem"]')) return;

        if (e.metaKey || e.ctrlKey) {
            window.open(titleHref, '_blank');
        } else {
            window.location.href = titleHref;
        }
    };

    const onPlay = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        void playbackManager.play({
            items: [ item ],
            startPositionTicks: item.UserData?.PlaybackPositionTicks || 0
        });
    };

    const onCreatePlaylist = () => {
        setIsMoreOpen(false);
        setIsCreateDialogOpen(true);
    };

    return (
        // The whole card is clickable for pointer users; keyboard and screen-reader users open details via the
        // title link (and, in card rows, the grid's Enter key).
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={[
                styles.card,
                variant === 'landscape' ? styles.landscape : styles.portrait,
                isActive ? styles.active : '',
                isPlayed ? styles.watched : ''
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={onOpenDetails}
            {...focusWithinProps}
        >
            <Squircle
                radius={16}
                className={styles.thumbBorder}
            >
                <Squircle
                    radius={14}
                    className={styles.thumbWrap}
                >
                    <div
                        className={[
                            styles.thumb,
                            variant === 'landscape' ?
                                styles.thumbLandscape :
                                ''
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt='' // title is shown below
                                className={styles.thumbImg}
                                loading={isImagePriority ? 'eager' : 'lazy'}
                                decoding='async'
                                {...priorityProps}
                            />
                        ) : (
                            <div className={styles.thumbPlaceholder} />
                        )}

                        {typeof overlayCount === 'number' ? (
                            <div
                                className={styles.countBadge}
                                aria-hidden='true'
                            >
                                {overlayCount}
                            </div>
                        ) : null}

                        <div className={styles.actions}>
                            <MediaCardMenu
                                item={item}
                                user={user}
                                isOpen={isMoreOpen}
                                onOpenChange={setIsMoreOpen}
                                onToggleFavorite={onToggleFavorite}
                                onTogglePlayed={onTogglePlayed}
                                onAfterAction={onAfterAction}
                                onCreatePlaylist={onCreatePlaylist}
                                playlistContext={playlistContext}
                            />
                        </div>

                        {isPlayed && (
                            <div
                                className={styles.watchedBadge}
                                aria-label='Watched'
                                title='Watched'
                            >
                                <SvgIcon
                                    svg={IconSvgs.checkmark}
                                    size={12}
                                />
                            </div>
                        )}
                    </div>

                    {playbackManager.canPlay(item) ? (
                        <FocusRing focusRingClass='focus-ring'>
                            <button
                                type='button'
                                className={styles.playOverlay}
                                aria-label={`Play ${title}`}
                                title={`Play ${title}`}
                                onClick={onPlay}
                            >
                                <SvgIcon svg={IconSvgs.play} size={18} />
                            </button>
                        </FocusRing>
                    ) : null}
                </Squircle>
            </Squircle>

            {progressPct > 0 ? (
                <div className={styles.progress}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            ) : null}

            <div className={styles.meta}>
                <FocusRing focusRingClass='focus-ring'>
                    <a
                        className={styles.title}
                        href={titleHref}
                        onClick={stopPropagation}
                    >
                        {title}
                    </a>
                </FocusRing>
                <CardSubtitle subtitle={subtitle} subtitleHref={subtitleHref} />
            </div>

            <CreateWatchlistDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                initialItem={item as BaseItemDto}
            />
        </div>
    );
};

// Memoized: card lists re-render every card when keyboard focus moves, but only two cards' props change.
export const MediaCard = memo(MediaCardView);
