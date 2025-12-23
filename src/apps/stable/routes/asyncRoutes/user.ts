import { AsyncRoute } from '../../../../components/router/AsyncRoute';
import { AppType } from '../../../../constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'home', type: AppType.Experimental }, // Use modern React home
    { path: 'details', page: 'details', type: AppType.Experimental }, // Use modern React details
    { path: 'person', page: 'person', type: AppType.Experimental },
    { path: 'genre', page: 'genre', type: AppType.Experimental },
    { path: 'collections', page: 'collections', type: AppType.Experimental },
    { path: 'list', type: AppType.Experimental }, // Use modern React list redirector
    { path: 'books', type: AppType.Experimental }, // Use modern React books library page
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search', page: 'search' },
    { path: 'userprofile', page: 'user/userprofile' }
];
