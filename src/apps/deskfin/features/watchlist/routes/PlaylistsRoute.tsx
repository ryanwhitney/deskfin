import React, { type FC, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, GridListItem } from 'react-aria-components';

import { useApi } from 'hooks/useApi';
import { useGetUserPlaylists } from '../hooks/useGetUserPlaylists';
import { CreateWatchlistDialog } from '../components/CreateWatchlistDialog';
import { getPlaylistPath, PlaylistCard, PlaylistCardStyles } from '../components/PlaylistCard';
import { CardList } from 'apps/deskfin/components/media/CardList';
import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import globalize from 'lib/globalize';
import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
import { useTitle } from 'apps/deskfin/hooks/useTitle';

import toolbarStyles from 'apps/deskfin/components/library/LibraryToolbar.module.scss';

/**
 * Main playlists page showing all user's playlists.
 */
const PlaylistsRoute: FC = () => {
    const { user } = useApi();
    const navigate = useNavigate();
    const { data: playlists = [], isPending, isError, refetch } = useGetUserPlaylists();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useTitle('Playlists');

    const handleOpenCreateDialog = useCallback(() => {
        setIsCreateDialogOpen(true);
    }, []);

    const handleCreateDialogClose = useCallback(() => {
        setIsCreateDialogOpen(false);
        void refetch();
    }, [refetch]);

    if (isPending) {
        return (
            <Page id='playlistsPage' className='mainAnimatedPage libraryPage backdropPage'>
                <h1>{globalize.translate('Playlists') || 'Playlists'}</h1>
                <Loading />
            </Page>
        );
    }

    if (isError) {
        return (
            <Page id='playlistsPage' className='mainAnimatedPage libraryPage backdropPage'>
                <h1>{globalize.translate('Playlists') || 'Playlists'}</h1>
                <NoItemsMessage message='Failed to load playlists. Please try again.' />
            </Page>
        );
    }

    return (
        <Page
            id='playlistsPage'
            className='mainAnimatedPage libraryPage backdropPage'
        >
            <h1>{globalize.translate('Playlists') || 'Playlists'}</h1>

            <div className={toolbarStyles.gridContainer}>
                <div className={toolbarStyles.gridHeader}>
                    <div className={toolbarStyles.itemCount}>
                        {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                    </div>
                    <div className={toolbarStyles.gridActions}>
                        <Button
                            onPress={handleOpenCreateDialog}
                            className={toolbarStyles.toolbarButton}
                        >
                            <SvgIcon svg={IconSvgs.addTo} size={16} />
                            <span>New Playlist</span>
                        </Button>
                    </div>
                </div>

                {playlists.length === 0 ? (
                    <NoItemsMessage message='No playlists yet. Create your first playlist to organize your favorite content.' />
                ) : (
                    <CardList
                        aria-label={globalize.translate('Playlists') || 'Playlists'}
                        className={toolbarStyles.grid}
                        data-variant='portrait'
                    >
                        {playlists.map((playlist) => (
                            <GridListItem
                                key={playlist.Id}
                                id={playlist.Id ?? ''}
                                textValue={playlist.Name ?? ''}
                                className={PlaylistCardStyles.gridItem}
                                onAction={() => navigate(getPlaylistPath(playlist.Id, user?.ServerId))}
                            >
                                <PlaylistCard
                                    playlist={playlist}
                                    serverId={user?.ServerId ?? undefined}
                                    onDeleted={() => { void refetch(); }}
                                />
                            </GridListItem>
                        ))}
                    </CardList>
                )}
            </div>

            <CreateWatchlistDialog
                isOpen={isCreateDialogOpen}
                onClose={handleCreateDialogClose}
            />
        </Page>
    );
};

export default PlaylistsRoute;
