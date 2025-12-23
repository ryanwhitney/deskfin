import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import globalize from 'lib/globalize';
import { useApi } from 'hooks/useApi';
import * as itemContextMenu from 'components/itemContextMenu';
import type { ItemDto } from 'types/base/models/item-dto';

interface DetailsMoreMenuProps {
    item: ItemDto;
    queryKey: string[];
}

type Command = {
    name?: string;
    id?: string;
    icon?: string;
    divider?: boolean;
};

const t = (key: string, fallback: string) => {
    try {
        return globalize.translate(key);
    } catch {
        return fallback;
    }
};

export const DetailsMoreMenu: FC<DetailsMoreMenuProps> = ({ item, queryKey }) => {
    const queryClient = useQueryClient();
    const { user } = useApi();
    const [ anchorEl, setAnchorEl ] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [ commands, setCommands ] = useState<Command[]>([]);

    const close = useCallback(() => setAnchorEl(null), []);
    const openMenu = useCallback((e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget), []);

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
            <IconButton className='detailsIconBtn' size='small' title={t('ButtonMore', 'More')} onClick={openMenu}>
                <MoreVertIcon />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
                                    <span className='material-icons' aria-hidden='true'>{cmd.icon}</span>
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


