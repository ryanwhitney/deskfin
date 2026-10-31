import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';

import { type AsyncRoute, toAsyncPageRoute } from 'components/router/AsyncRoute';

/** Lazy-loads a deskfin page module (default export) as its own chunk. */
const page = (load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] => (
    async () => ({ Component: (await load()).default })
);

/** Deskfin's own pages. */
const DESKFIN_PAGES: RouteObject[] = [
    { path: 'details', lazy: page(() => import(/* webpackChunkName: "deskfin-details" */ 'apps/deskfin/features/details/routes/DetailsRoute')) },
    { path: 'genre', lazy: page(() => import(/* webpackChunkName: "deskfin-genre" */ 'apps/deskfin/features/libraries/routes/GenreRoute')) },
    { path: 'collections', lazy: page(() => import(/* webpackChunkName: "deskfin-collections" */ 'apps/deskfin/features/libraries/routes/CollectionsRoute')) },
    { path: 'home', lazy: page(() => import(/* webpackChunkName: "deskfin-home" */ 'apps/deskfin/features/home/routes/HomeRoute')) },
    { path: 'homevideos', lazy: page(() => import(/* webpackChunkName: "deskfin-homevideos" */ 'apps/deskfin/features/libraries/routes/HomeVideosRoute')) },
    { path: 'list', lazy: page(() => import(/* webpackChunkName: "deskfin-list" */ 'apps/deskfin/features/libraries/routes/ListRoute')) },
    { path: 'books', lazy: page(() => import(/* webpackChunkName: "deskfin-books" */ 'apps/deskfin/features/libraries/routes/BooksRoute')) },
    { path: 'livetv', lazy: page(() => import(/* webpackChunkName: "deskfin-livetv" */ 'apps/deskfin/features/libraries/routes/LiveTvRoute')) },
    { path: 'movies', lazy: page(() => import(/* webpackChunkName: "deskfin-movies" */ 'apps/deskfin/features/libraries/routes/MoviesRoute')) },
    { path: 'music', lazy: page(() => import(/* webpackChunkName: "deskfin-music" */ 'apps/deskfin/features/libraries/routes/MusicRoute')) },
    { path: 'mypreferencesdisplay', lazy: page(() => import(/* webpackChunkName: "deskfin-preferences-display" */ 'apps/deskfin/features/preferences/routes/UserDisplayPreferencesRoute')) },
    { path: 'tv', lazy: page(() => import(/* webpackChunkName: "deskfin-tv" */ 'apps/deskfin/features/libraries/routes/ShowsRoute')) },
    { path: 'playlists', lazy: page(() => import(/* webpackChunkName: "deskfin-playlists" */ 'apps/deskfin/features/watchlist/routes/PlaylistsRoute')) }
];

/** Upstream (legacy app) pages deskfin still uses as-is: settings, search, profile. */
const UPSTREAM_PAGES: AsyncRoute[] = [
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search' },
    { path: 'userprofile', page: 'user/userprofile' }
];

export const ASYNC_USER_ROUTES: RouteObject[] = [
    ...DESKFIN_PAGES,
    ...UPSTREAM_PAGES.map(toAsyncPageRoute)
];
