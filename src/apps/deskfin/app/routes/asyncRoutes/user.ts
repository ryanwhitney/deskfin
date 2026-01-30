import { AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'details', page: 'details/routes/DetailsRoute', type: AppType.Deskfin },
    { path: 'genre', page: 'libraries/routes/GenreRoute', type: AppType.Deskfin },
    { path: 'collections', page: 'libraries/routes/CollectionsRoute', type: AppType.Deskfin },
    { path: 'home', page: 'home/routes/HomeRoute', type: AppType.Deskfin },
    { path: 'homevideos', page: 'libraries/routes/HomeVideosRoute', type: AppType.Deskfin },
    { path: 'list', page: 'libraries/routes/ListRoute', type: AppType.Deskfin },
    { path: 'books', page: 'libraries/routes/BooksRoute', type: AppType.Deskfin },
    { path: 'livetv', page: 'libraries/routes/LiveTvRoute', type: AppType.Deskfin },
    { path: 'movies', page: 'libraries/routes/MoviesRoute', type: AppType.Deskfin },
    { path: 'music', page: 'libraries/routes/MusicRoute', type: AppType.Deskfin },
    { path: 'mypreferencesdisplay', page: 'preferences/routes/UserDisplayPreferencesRoute', type: AppType.Deskfin },
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search' },
    { path: 'tv', page: 'libraries/routes/ShowsRoute', type: AppType.Deskfin },
    { path: 'userprofile', page: 'user/userprofile' },
    { path: 'playlists', page: 'watchlist/routes/PlaylistsRoute', type: AppType.Deskfin }
];
