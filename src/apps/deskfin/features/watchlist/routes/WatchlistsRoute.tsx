import React, { type FC, useState } from 'react';
import { Link } from 'react-router-dom';

import { useApi } from 'hooks/useApi';
import { useGetUserPlaylists } from '../hooks/useGetUserPlaylists';
import { CreateWatchlistDialog } from '../components/CreateWatchlistDialog';
import { Button } from 'apps/deskfin/components/button/Button';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';

import styles from './WatchlistsRoute.module.scss';

/**
 * Main watchlists page showing all user's playlists/lists.
 */
const WatchlistsRoute: FC = () => {
    const { user } = useApi();
    const { data: playlists = [], isPending, isError } = useGetUserPlaylists();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <Page
            id="watchlistsPage"
            className="mainAnimatedPage type-interior"
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {globalize.translate('HeaderMyPlaylists') || 'My Lists'}
                    </h1>
                    <Button
                        onPress={() => setIsCreateDialogOpen(true)}
                        className={styles.createButton}
                    >
                        <SvgIcon svg={IconSvgs.addTo} size={18} />
                        <span>Create New List</span>
                    </Button>
                </div>

                {isPending && (
                    <div className={styles.loading}>
                        {globalize.translate('Loading')}...
                    </div>
                )}

                {isError && (
                    <div className={styles.error}>
                        Failed to load lists. Please try again.
                    </div>
                )}

                {!isPending && !isError && playlists.length === 0 && (
                    <div className={styles.empty}>
                        <SvgIcon svg={IconSvgs.listBullet} size={48} />
                        <p className={styles.emptyText}>No lists yet</p>
                        <p className={styles.emptyHint}>
                            Create your first list to organize your favorite content
                        </p>
                        <Button
                            onPress={() => setIsCreateDialogOpen(true)}
                            className={styles.emptyButton}
                        >
                            Create Your First List
                        </Button>
                    </div>
                )}

                {!isPending && !isError && playlists.length > 0 && (
                    <div className={styles.grid}>
                        {playlists.map((playlist) => (
                            <Link
                                key={playlist.Id}
                                to={`/list?id=${playlist.Id}&serverId=${user?.ServerId}`}
                                className={styles.card}
                            >
                                <div className={styles.cardIcon}>
                                    <SvgIcon svg={IconSvgs.listBullet} size={32} />
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardTitle}>
                                        {playlist.Name || 'Unnamed List'}
                                    </h3>
                                    <p className={styles.cardMeta}>
                                        {playlist.ChildCount || 0} items
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <CreateWatchlistDialog
                    isOpen={isCreateDialogOpen}
                    onClose={() => setIsCreateDialogOpen(false)}
                />
            </div>
        </Page>
    );
};

export default WatchlistsRoute;
