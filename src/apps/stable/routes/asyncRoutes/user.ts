import { AsyncRoute } from '../../../../components/router/AsyncRoute';
import { AppType } from '../../../../constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'home', type: AppType.Experimental }, // Use modern React home
    { path: 'details', page: 'details', type: AppType.Experimental }, // Use modern React details
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search', page: 'search' },
    { path: 'userprofile', page: 'user/userprofile' }
];
