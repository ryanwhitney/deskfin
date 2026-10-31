import { AsyncRoute } from '../../../../components/router/AsyncRoute';
import { AppType } from '../../../../constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'home', type: AppType.Modern }, // Use modern React home
    { path: 'details', page: 'details', type: AppType.Modern }, // Use modern React details
    { path: 'person', page: 'person', type: AppType.Modern },
    { path: 'genre', page: 'genre', type: AppType.Modern },
    { path: 'collections', page: 'collections', type: AppType.Modern },
    { path: 'list', type: AppType.Modern }, // Use modern React list redirector
    { path: 'books', type: AppType.Modern }, // Use modern React books library page
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search', page: 'search' },
    { path: 'userprofile', page: 'user/userprofile' }
];
