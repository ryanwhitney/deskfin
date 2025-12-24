import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import * as itemContextMenu from 'components/itemContextMenu';
import type { ItemDto } from 'types/base/models/item-dto';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs, getLegacyCommandIcon } from '../../../../assets/icons';
import { IconButton } from '../Elements/Button';

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

export const DetailsMoreMenu: FC<DetailsMoreMenuProps> = ({ item, queryKey, className }) => {
    const queryClient = useQueryClient();
    const { user } = useApi();
    const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [ commands, setCommands ] = useState<Command[]>([]);
    const menuPaperRef = useRef<HTMLDivElement | null>(null);

    const close = useCallback(() => setAnchorEl(null), []);
    const openMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    }, []);

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
            positionTo: anchorEl
        };
    }, [anchorEl, item, user]);

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            try {
                const cmds = await itemContextMenu.getCommands(menuOptions);
                setCommands(cmds as Command[]);
            } catch (e) {
                console.error('[DetailsMoreMenu] failed to get commands', e);
                setCommands([]);
            }
        };
        if (open) void load();
    }, [menuOptions, open, user]);

    // Prevent "click-through" when dismissing the menu by capturing outside click events.
    // IMPORTANT: do NOT close on pointerdown; that can remove the listener before the actual click fires.
    useEffect(() => {
        if (!open) return;

        const onWindowEvent = (e: Event) => {
            const target = e.target as Node | null;
            if (!target) return;

            // Allow clicks inside the menu and on the anchor button itself.
            if (menuPaperRef.current?.contains(target)) return;
            if (anchorEl?.contains(target)) return;

            e.preventDefault();
            e.stopPropagation();
            close();
        };

        window.addEventListener('click', onWindowEvent, true);
        return () => {
            window.removeEventListener('click', onWindowEvent, true);
        };
    }, [anchorEl, close, open]);

    const onCommandClick = useCallback(async (commandId: string) => {
        close();
        try {
            const result = await itemContextMenu.executeCommand(item, commandId, menuOptions);
            if (result?.updated || result?.deleted) {
                await queryClient.invalidateQueries({ queryKey, type: 'all', refetchType: 'active' });
            }
        } catch (e) {
            console.error('[DetailsMoreMenu] command failed', commandId, e);
        }
    }, [close, item, menuOptions, queryClient, queryKey]);

    return (
        <>
            <IconButton
                className={className}
                title={t('ButtonMore', 'More')}
                aria-label={t('ButtonMore', 'More')}
                onClick={openMenu}
                icon={<SvgIcon svg={IconSvgs.ellipsis} size={18} />}
            />

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { ref: menuPaperRef } }}
            >
                {commands.map((cmd, idx) => {
                    if (cmd.divider) {
                        // eslint-disable-next-line react/no-array-index-key
                        return <div key={`div-${idx}`} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />;
                    }
                    if (!cmd.id) return null;
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <MenuItem key={cmd.id ?? idx} onClick={() => onCommandClick(cmd.id!)}>
                            {cmd.icon ? (
                                <ListItemIcon>
                                    {getLegacyCommandIcon(cmd.icon) ? (
                                        <SvgIcon svg={getLegacyCommandIcon(cmd.icon)!} size={18} />
                                    ) : null}
                                </ListItemIcon>
                            ) : null}
                            <ListItemText primary={cmd.name ?? cmd.id} />
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
};
