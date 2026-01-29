import { AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'details', page: 'details', type: AppType.Deskfin },
    { path: 'genre', page: 'genre', type: AppType.Deskfin },
    { path: 'collections', page: 'collections', type: AppType.Deskfin },
    { path: 'home', type: AppType.Deskfin },
    { path: 'homevideos', type: AppType.Deskfin },
    { path: 'list', type: AppType.Deskfin },
    { path: 'books', type: AppType.Deskfin },
    { path: 'livetv', type: AppType.Deskfin },
    { path: 'movies', type: AppType.Deskfin },
    { path: 'music', type: AppType.Deskfin },
    { path: 'mypreferencesdisplay', page: 'user/display', type: AppType.Deskfin },
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search' },
    { path: 'tv', page: 'shows', type: AppType.Deskfin },
    { path: 'userprofile', page: 'user/userprofile' },
    { path: 'playlists', type: AppType.Deskfin }
];
