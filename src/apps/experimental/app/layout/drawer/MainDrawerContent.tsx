import React from 'react';
import { useLocation } from 'react-router-dom';

import { Link } from 'react-router-dom';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'lib/globalize';

import { LibraryIcon } from 'apps/experimental/components/shared';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { ExperimentalDrawerHeader } from './ExperimentalDrawerHeader';

import styles from './MainDrawerContent.module.scss';

const MainDrawerContent = () => {
    const { user } = useApi();
    const location = useLocation();
    const { data: userViewsData } = useUserViews(user?.Id);
    const userViews = userViewsData?.Items || [];
    const webConfig = useWebConfig();

    const isHomeSelected = location.pathname === '/home' && (!location.search || location.search === '?tab=0');
    const isFavoritesSelected = location.pathname === '/home' && location.search === '?tab=1';

    return (
        <>
            {/* MAIN LINKS */}
            <div className={styles.section}>
                <ExperimentalDrawerHeader />

                <Link
                    className={`${styles.link} ${isHomeSelected ? styles.linkActive : ''}`}
                    to="/home"
                >
                    <span className={styles.icon}>
                        <SvgIcon svg={IconSvgs.home} size={20} />
                    </span>
                    <span className={styles.label}>{globalize.translate('Home')}</span>
                </Link>

                <Link
                    className={`${styles.link} ${isFavoritesSelected ? styles.linkActive : ''}`}
                    to="/home?tab=1"
                >
                    <span className={styles.icon}>
                        <SvgIcon svg={IconSvgs.heart} size={20} />
                    </span>
                    <span className={styles.label}>{globalize.translate('Favorites')}</span>
                </Link>
            </div>

            {/* CUSTOM LINKS */}
            {(!!webConfig.menuLinks && webConfig.menuLinks.length > 0) && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.section}>
                        {webConfig.menuLinks.map(menuLink => (
                            <a
                                key={`${menuLink.name}_${menuLink.url}`}
                                className={styles.link}
                                href={menuLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className={styles.icon}>
                                    <span className={styles.materialIcon}>{menuLink.icon ?? 'link'}</span>
                                </span>
                                <span className={styles.label}>{menuLink.name}</span>
                            </a>
                        ))}
                    </div>
                </>
            )}

            {/* LIBRARY LINKS */}
            {userViews.length > 0 && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.heading} id="libraries-subheader">
                        {globalize.translate('HeaderLibraries')}
                    </div>
                    <div className={styles.section} aria-labelledby="libraries-subheader">
                        {userViews.map(view => (
                            <Link
                                key={view.Id}
                                className={styles.link}
                                to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                            >
                                <span className={styles.icon}>
                                    <LibraryIcon item={view} />
                                </span>
                                <span className={styles.label}>{view.Name}</span>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </>
    );
};

export default MainDrawerContent;
