import React, { type FC, useState, useCallback } from 'react';
import { Button } from 'react-aria-components';

import { useApi } from 'hooks/useApi';
import { useGetUserPlaylists } from '../hooks/useGetUserPlaylists';
import { CreateWatchlistDialog } from '../components/CreateWatchlistDialog';
import { PlaylistCard } from '../components/PlaylistCard';
import Page from 'components/Page';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { useTitle } from 'apps/deskfin/utils/useTitle';

import toolbarStyles from 'apps/deskfin/components/library/LibraryToolbar.module.scss';

/**
 * Main playlists page showing all user's playlists.
 */
const PlaylistsRoute: FC = () => {
    const { user } = useApi();
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
                    <div className={toolbarStyles.grid} data-variant='portrait'>
                        {playlists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.Id}
                                playlist={playlist}
                                serverId={user?.ServerId ?? undefined}
                                onDeleted={() => void refetch()}
                            />
                        ))}
                    </div>
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
