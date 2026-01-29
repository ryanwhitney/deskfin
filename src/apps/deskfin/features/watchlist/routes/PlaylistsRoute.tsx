import React, { type FC, useState, useCallback } from 'react';
import { Button } from 'react-aria-components';

import { useApi } from 'hooks/useApi';
import { useGetUserPlaylists } from '../hooks/useGetUserPlaylists';
import { CreateWatchlistDialog } from '../components/CreateWatchlistDialog';
import { PlaylistCard } from '../components/PlaylistCard';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { useTitle } from 'apps/deskfin/utils/useTitle';

import styles from './PlaylistsRoute.module.scss';
import layoutStyles from '../../libraries/components/ui/PageLayout.module.scss';
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

    return (
        <Page
            id="playlistsPage"
            className="mainAnimatedPage libraryPage backdropPage"
        >
            <h1>{globalize.translate('Playlists') || 'Playlists'}</h1>

            <div className={layoutStyles.toolbar}>
                <div className={styles.toolbarContent}>
                    <div className={styles.itemCount}>
                        {!isPending && !isError && (
                            <>
                                {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                            </>
                        )}
                    </div>
                    <div className={styles.actions}>
                        <Button
                            onPress={handleOpenCreateDialog}
                            className={toolbarStyles.toolbarButton}
                        >
                            <SvgIcon svg={IconSvgs.addTo} size={16} />
                            <span>New Playlist</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className={layoutStyles.content}>
                {isPending && (
                    <div className={styles.loading}>
                        {globalize.translate('Loading')}...
                    </div>
                )}

                {isError && (
                    <div className={styles.error}>
                        Failed to load playlists. Please try again.
                    </div>
                )}

                {!isPending && !isError && playlists.length === 0 && (
                    <div className={styles.empty}>
                        <SvgIcon svg={IconSvgs.listBullet} size={48} />
                        <p className={styles.emptyText}>No playlists yet</p>
                        <p className={styles.emptyHint}>
                            Create your first playlist to organize your favorite content
                        </p>
                        <Button
                            onPress={handleOpenCreateDialog}
                            className={styles.emptyButton}
                        >
                            Create Your First Playlist
                        </Button>
                    </div>
                )}

                {!isPending && !isError && playlists.length > 0 && (
                    <div className={styles.grid}>
                        {playlists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.Id}
                                playlist={playlist}
                                serverId={user?.ServerId ?? undefined}
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
