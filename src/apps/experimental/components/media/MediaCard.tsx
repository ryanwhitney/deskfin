import React, { type FC, useMemo, useState } from 'react';

import IconButton from '@mui/material/IconButton';

import SvgIcon from 'components/SvgIcon';
import { IconSvgs, getLegacyCommandIcon } from 'assets/icons';
import type { ItemDto } from 'types/base/models/item-dto';
import { playbackManager } from 'components/playback/playbackmanager';

import { Button as RacButton, Menu, MenuItem, MenuTrigger, Popover, Separator } from 'react-aria-components';

import * as itemContextMenu from 'components/itemContextMenu';
import { ActionMenuStyles } from 'apps/experimental/components';

import styles from './MediaCard.module.scss';

type Command = { name?: string; id?: string; icon?: string; divider?: boolean };

export type MediaCardVariant = 'portrait' | 'landscape';

export const MediaCardStyles = styles;

export type MediaCardProps = {
    item: ItemDto;
    user: any;
    variant?: MediaCardVariant;
    imageUrl?: string;
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
};

export const MediaCard: FC<MediaCardProps> = ({
    item,
    user,
    variant = 'portrait',
    imageUrl,
    overlayCount,
    progressPct = 0,
    title,
    titleHref,
    subtitle,
    subtitleHref,
    isRovingFocused = false,
    onToggleFavorite,
    onTogglePlayed,
    onAfterAction
}) => {
    const [ isMoreOpen, setIsMoreOpen ] = useState(false);
    const [ isFocusWithin, setIsFocusWithin ] = useState(false);
    const isActive = isRovingFocused || isFocusWithin || isMoreOpen;

    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;

    const onOpenDetails: React.MouseEventHandler = (e) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest('a,button,[role="menu"],[role="menuitem"]')) return;
        window.location.href = titleHref;
    };

    const onPlay: React.MouseEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        void playbackManager.play({
            items: [ item ],
            startPositionTicks: item.UserData?.PlaybackPositionTicks || 0
        });
    };

    const [ commands, setCommands ] = useState<Command[]>([]);
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
    const onOpenChange = (open: boolean) => {
        setIsMoreOpen(open);
        if (open && !commands.length) {
            void itemContextMenu.getCommands(menuOptions).then((cmds) => setCommands(cmds as Command[])).catch(() => setCommands([]));
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

    return (
        <div
            className={[
                styles.card,
                variant === 'landscape' ? styles.landscape : styles.portrait,
                isActive ? styles.active : ''
            ].filter(Boolean).join(' ')}
            onClick={onOpenDetails}
            onFocusCapture={() => setIsFocusWithin(true)}
            onBlurCapture={(e) => {
                const next = e.relatedTarget as Node | null;
                if (!next || !(e.currentTarget as HTMLElement).contains(next)) {
                    setIsFocusWithin(false);
                }
            }}
        >
            <div className={styles.thumbWrap}>
                <div
                    className={[ styles.thumb, variant === 'landscape' ? styles.thumbLandscape : '' ].filter(Boolean).join(' ')}
                    style={{
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(135deg, #1f1f1f, #2a2a2a)'
                    }}
                    aria-label={title}
                >
                    {typeof overlayCount === 'number' ? (
                        <div className={styles.countBadge} aria-hidden="true">{overlayCount}</div>
                    ) : null}

                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        <IconButton
                            className={styles.iconBtn}
                            size="small"
                            tabIndex={isActive ? 0 : -1}
                            title={isFavorite ? 'Favorite' : 'Add to favorites'}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(item); }}
                        >
                            <span style={{ color: isFavorite ? '#ff4d6d' : undefined }}>
                                <SvgIcon svg={IconSvgs.heart} size={18} />
                            </span>
                        </IconButton>

                        <IconButton
                            className={styles.iconBtn}
                            size="small"
                            tabIndex={isActive ? 0 : -1}
                            title={isPlayed ? 'Watched' : 'Mark played'}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePlayed(item); }}
                        >
                            <span style={{ color: isPlayed ? '#4ade80' : undefined }}>
                                <SvgIcon svg={IconSvgs.checkmark} size={18} />
                            </span>
                        </IconButton>

                        <MenuTrigger isOpen={isMoreOpen} onOpenChange={onOpenChange}>
                            <RacButton
                                className={styles.iconBtn}
                                aria-label="More"
                                excludeFromTabOrder={!isActive}
                            >
                                <SvgIcon svg={IconSvgs.ellipsis} size={18} />
                            </RacButton>
                            <Popover className={ActionMenuStyles.popover}>
                                <Menu className={ActionMenuStyles.menu} aria-label="More options">
                                    {commands.map((cmd, idx) => {
                                        if (cmd.divider) return <Separator key={`div-${idx}`} className={ActionMenuStyles.divider} />;
                                        if (!cmd.id) return null;
                                        return (
                                            <MenuItem
                                                key={cmd.id}
                                                className={ActionMenuStyles.item}
                                                textValue={cmd.name ?? cmd.id}
                                                onAction={() => { void onCommand(cmd.id!); }}
                                            >
                                                <span className={ActionMenuStyles.icon} aria-hidden="true">
                                                    {getLegacyCommandIcon(cmd.icon) && (
                                                        <SvgIcon svg={getLegacyCommandIcon(cmd.icon)!} size={18} />
                                                    )}
                                                </span>
                                                <span className={ActionMenuStyles.text}>{cmd.name ?? cmd.id}</span>
                                            </MenuItem>
                                        );
                                    })}
                                </Menu>
                            </Popover>
                        </MenuTrigger>
                    </div>
                </div>

                {playbackManager.canPlay(item) ? (
                    <button
                        type="button"
                        className={styles.playOverlay}
                        aria-label={`Play ${title}`}
                        title={`Play ${title}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={onPlay}
                    >
                        <SvgIcon svg={IconSvgs.play} size={18} />
                    </button>
                ) : null}
            </div>

            {progressPct > 0 ? (
                <div className={styles.progress}>
                    <div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
                </div>
            ) : null}

            <div className={styles.meta}>
                <a className={styles.title} href={titleHref} tabIndex={isActive ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                    {title}
                </a>
                {subtitle ? (
                    subtitleHref ? (
                        <a className={styles.subTitle} href={subtitleHref} tabIndex={isActive ? 0 : -1} onClick={(e) => e.stopPropagation()}>
                            {subtitle}
                        </a>
                    ) : (
                        <div className={styles.subTitle}>{subtitle}</div>
                    )
                ) : null}
            </div>
        </div>
    );
};


