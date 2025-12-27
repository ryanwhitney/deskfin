import React, { type FC, useMemo, useState } from "react";
import { Squircle } from "@squircle-js/react";

import SvgIcon from "components/SvgIcon";
import { IconSvgs, getLegacyCommandIcon } from "assets/icons";
import type { ItemDto } from "types/base/models/item-dto";
import { playbackManager } from "components/playback/playbackmanager";

import {
    Button as RacButton,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    Separator,
} from "react-aria-components";
import { FocusRing } from "@react-aria/focus";

import * as itemContextMenu from "components/itemContextMenu";
import { ActionMenuStyles } from "apps/experimental/components/menu/ActionMenu";

import styles from "./MediaCard.module.scss";

type Command = { name?: string; id?: string; icon?: string; divider?: boolean };

export type MediaCardVariant = "portrait" | "landscape";

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
    variant = "portrait",
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
    onAfterAction,
}) => {
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isFocusWithin, setIsFocusWithin] = useState(false);
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
            items: [item],
            startPositionTicks: item.UserData?.PlaybackPositionTicks || 0,
        });
    };

    const [commands, setCommands] = useState<Command[]>([]);
    const menuOptions = useMemo(
        () => ({
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
            positionTo: null,
        }),
        [item, user]
    );

    // Load on first open.
    const onOpenChange = (open: boolean) => {
        setIsMoreOpen(open);
        if (open && !commands.length) {
            void itemContextMenu
                .getCommands(menuOptions)
                .then((cmds) => setCommands(cmds as Command[]))
                .catch(() => setCommands([]));
        }
    };

    const onCommand = async (id: string) => {
        try {
            const result = await itemContextMenu.executeCommand(
                item,
                id,
                menuOptions
            );
            if (result?.updated || result?.deleted) {
                onAfterAction();
            }
        } catch (e) {
            console.error("[MediaCard] command failed", id, e);
        }
    };

    return (
        <div
            className={[
                styles.card,
                variant === "landscape" ? styles.landscape : styles.portrait,
                isActive ? styles.active : "",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={onOpenDetails}
            onFocusCapture={() => setIsFocusWithin(true)}
            onBlurCapture={(e) => {
                const next = e.relatedTarget as Node | null;
                if (!next || !(e.currentTarget as HTMLElement).contains(next)) {
                    setIsFocusWithin(false);
                }
            }}
        >
            <Squircle
                cornerRadius={16}
                cornerSmoothing={1}
                className={styles.thumbBorder}
            >
                <Squircle
                    cornerRadius={14}
                    cornerSmoothing={1}
                    className={styles.thumbWrap}
                >
                    <div
                        className={[
                            styles.thumb,
                            variant === "landscape"
                                ? styles.thumbLandscape
                                : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={title}
                                className={styles.thumbImg}
                            />
                        ) : (
                            <div className={styles.thumbPlaceholder} />
                        )}

                        {typeof overlayCount === "number" ? (
                            <div
                                className={styles.countBadge}
                                aria-hidden="true"
                            >
                                {overlayCount}
                            </div>
                        ) : null}

                        <div
                            className={styles.actions}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MenuTrigger
                                isOpen={isMoreOpen}
                                onOpenChange={onOpenChange}
                            >
                                <FocusRing focusRingClass="focus-ring">
                                    <RacButton
                                        className={styles.iconBtn}
                                        aria-label="More"
                                    >
                                        <SvgIcon
                                            svg={IconSvgs.ellipsis}
                                            size={18}
                                        />
                                    </RacButton>
                                </FocusRing>
                                <Popover className={ActionMenuStyles.popover}>
                                    <Menu
                                        className={ActionMenuStyles.menu}
                                        aria-label="More options"
                                    >
                                        <MenuItem
                                            className={ActionMenuStyles.item}
                                            textValue={
                                                isFavorite
                                                    ? "Remove from favorites"
                                                    : "Add to favorites"
                                            }
                                            onAction={() =>
                                                onToggleFavorite(item)
                                            }
                                        >
                                            <span
                                                className={
                                                    ActionMenuStyles.icon
                                                }
                                                aria-hidden="true"
                                                style={{
                                                    color: isFavorite
                                                        ? "#ff4d6d"
                                                        : undefined,
                                                }}
                                            >
                                                <SvgIcon
                                                    svg={IconSvgs.heart}
                                                    size={18}
                                                />
                                            </span>
                                            <span
                                                className={
                                                    ActionMenuStyles.text
                                                }
                                            >
                                                {isFavorite
                                                    ? "Remove from favorites"
                                                    : "Add to favorites"}
                                            </span>
                                        </MenuItem>
                                        <MenuItem
                                            className={ActionMenuStyles.item}
                                            textValue={
                                                isPlayed
                                                    ? "Mark as unwatched"
                                                    : "Mark as watched"
                                            }
                                            onAction={() =>
                                                onTogglePlayed(item)
                                            }
                                        >
                                            <span
                                                className={
                                                    ActionMenuStyles.icon
                                                }
                                                aria-hidden="true"
                                                style={{
                                                    color: isPlayed
                                                        ? "#4ade80"
                                                        : undefined,
                                                }}
                                            >
                                                <SvgIcon
                                                    svg={IconSvgs.checkmark}
                                                    size={18}
                                                />
                                            </span>
                                            <span
                                                className={
                                                    ActionMenuStyles.text
                                                }
                                            >
                                                {isPlayed
                                                    ? "Mark as unwatched"
                                                    : "Mark as watched"}
                                            </span>
                                        </MenuItem>
                                        {commands.length > 0 && (
                                            <Separator
                                                className={
                                                    ActionMenuStyles.divider
                                                }
                                            />
                                        )}
                                        {commands.map((cmd, idx) => {
                                            if (cmd.divider)
                                                return (
                                                    <Separator
                                                        key={`div-${idx}`}
                                                        className={
                                                            ActionMenuStyles.divider
                                                        }
                                                    />
                                                );
                                            if (!cmd.id) return null;
                                            return (
                                                <MenuItem
                                                    key={cmd.id}
                                                    className={
                                                        ActionMenuStyles.item
                                                    }
                                                    textValue={
                                                        cmd.name ?? cmd.id
                                                    }
                                                    onAction={() => {
                                                        void onCommand(cmd.id!);
                                                    }}
                                                >
                                                    <span
                                                        className={
                                                            ActionMenuStyles.icon
                                                        }
                                                        aria-hidden="true"
                                                    >
                                                        {getLegacyCommandIcon(
                                                            cmd.icon
                                                        ) && (
                                                            <SvgIcon
                                                                svg={
                                                                    getLegacyCommandIcon(
                                                                        cmd.icon
                                                                    )!
                                                                }
                                                                size={18}
                                                            />
                                                        )}
                                                    </span>
                                                    <span
                                                        className={
                                                            ActionMenuStyles.text
                                                        }
                                                    >
                                                        {cmd.name ?? cmd.id}
                                                    </span>
                                                </MenuItem>
                                            );
                                        })}
                                    </Menu>
                                </Popover>
                            </MenuTrigger>
                        </div>
                    </div>

                    {playbackManager.canPlay(item) ? (
                        <FocusRing focusRingClass="focus-ring">
                            <button
                                type="button"
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
                <FocusRing focusRingClass="focus-ring">
                    <a
                        className={styles.title}
                        href={titleHref}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {title}
                    </a>
                </FocusRing>
                {subtitle ? (
                    subtitleHref ? (
                        <FocusRing focusRingClass="focus-ring">
                            <a
                                className={styles.subTitle}
                                href={subtitleHref}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {subtitle}
                            </a>
                        </FocusRing>
                    ) : (
                        <div className={styles.subTitle}>{subtitle}</div>
                    )
                ) : null}
            </div>
        </div>
    );
};
