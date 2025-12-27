import React, {
    type FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    Button,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    Separator,
} from "react-aria-components";

import globalize from "lib/globalize";
import { useApi } from "hooks/useApi";
import * as itemContextMenu from "components/itemContextMenu";
import type { ItemDto } from "types/base/models/item-dto";
import SvgIcon from "components/SvgIcon";
import { IconSvgs, getLegacyCommandIcon } from "assets/icons";
import { ActionMenuStyles } from "apps/experimental/components/menu/ActionMenu";
import iconButtonStyles from "apps/experimental/components/button/Button.module.scss";

interface DetailsMoreMenuProps {
    item: ItemDto;
    queryKey: string[];
    className?: string;
}

type Command = {
    name?: string;
    id?: string;
    icon?: string;
    divider?: boolean;
};

const t = (key: string, fallback: string) => {
    return globalize.tryTranslate?.(key) ?? fallback;
};

export const DetailsMoreMenu: FC<DetailsMoreMenuProps> = ({
    item,
    queryKey,
    className,
}) => {
    const queryClient = useQueryClient();
    const { user } = useApi();
    const [commands, setCommands] = useState<Command[]>([]);

    const menuOptions = useMemo(() => {
        return {
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
            // We don't show multiselect here (details page), but keep a positionTo for parity.
            positionTo: null,
        };
    }, [item, user]);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                const cmds = await itemContextMenu.getCommands(menuOptions);
                setCommands(cmds as Command[]);
            } catch (e) {
                console.error("[DetailsMoreMenu] failed to get commands", e);
                setCommands([]);
            }
        };
        void load();
    }, [menuOptions, user]);

    const onCommandClick = useCallback(
        async (commandId: string) => {
            try {
                const result = await itemContextMenu.executeCommand(
                    item,
                    commandId,
                    menuOptions
                );
                if (result?.updated || result?.deleted) {
                    await queryClient.invalidateQueries({
                        queryKey,
                        type: "all",
                        refetchType: "active",
                    });
                }
            } catch (e) {
                console.error("[DetailsMoreMenu] command failed", commandId, e);
            }
        },
        [item, menuOptions, queryClient, queryKey]
    );

    return (
        <MenuTrigger>
            <Button
                className={[iconButtonStyles.iconButton, className ?? ""]
                    .filter(Boolean)
                    .join(" ")}
                aria-label={t("ButtonMore", "More")}
            >
                <SvgIcon svg={IconSvgs.ellipsis} size={18} />
            </Button>

            <Popover
                className={ActionMenuStyles.popover}
                placement="bottom end"
                offset={6}
            >
                <Menu
                    className={ActionMenuStyles.menu}
                    aria-label={t("ButtonMore", "More")}
                >
                    {commands.map((cmd, idx) => {
                        if (cmd.divider) {
                            // eslint-disable-next-line react/no-array-index-key
                            return (
                                <Separator
                                    key={`div-${idx}`}
                                    className={ActionMenuStyles.divider}
                                />
                            );
                        }
                        if (!cmd.id) return null;
                        const icon = cmd.icon
                            ? getLegacyCommandIcon(cmd.icon)
                            : undefined;
                        return (
                            <MenuItem
                                key={cmd.id}
                                className={ActionMenuStyles.item}
                                textValue={cmd.name ?? cmd.id}
                                onAction={() => {
                                    void onCommandClick(cmd.id!);
                                }}
                            >
                                {icon ? (
                                    <span
                                        className={ActionMenuStyles.icon}
                                        aria-hidden="true"
                                    >
                                        <SvgIcon svg={icon} size={18} />
                                    </span>
                                ) : (
                                    <span
                                        className={ActionMenuStyles.icon}
                                        aria-hidden="true"
                                    />
                                )}
                                <span className={ActionMenuStyles.text}>
                                    {cmd.name ?? cmd.id}
                                </span>
                            </MenuItem>
                        );
                    })}
                </Menu>
            </Popover>
        </MenuTrigger>
    );
};
