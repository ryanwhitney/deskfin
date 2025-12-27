import type { RouteObject } from 'react-router-dom';

import { AppType } from 'constants/appType';

export interface AsyncRoute {
    /** The URL path for this route. */
    path: string
    /**
     * The relative path to the page component in the routes directory.
     * Will fallback to using the `path` value if not specified.
     */
    page?: string
    /** The app that this page is part of. */
    type?: AppType
}

// Use Vite's glob imports to pre-bundle all route modules
const dashboardRoutes = import.meta.glob('../../apps/dashboard/routes/**/*.tsx');
const experimentalRoutes = import.meta.glob('../../apps/experimental/routes/**/*.tsx');
const stableRoutes = import.meta.glob('../../apps/stable/routes/**/*.tsx');

interface RouteModule {
    default?: React.ComponentType;
    [key: string]: unknown;
}

const importRoute = (page: string, type: AppType): Promise<RouteModule> => {
    let routes: Record<string, () => Promise<unknown>>;
    let basePath: string;

    switch (type) {
        case AppType.Dashboard:
            routes = dashboardRoutes;
            basePath = '../../apps/dashboard/routes/';
            break;
        case AppType.Experimental:
            routes = experimentalRoutes;
            basePath = '../../apps/experimental/routes/';
            break;
        case AppType.Stable:
        default:
            routes = stableRoutes;
            basePath = '../../apps/stable/routes/';
            break;
    }

    // Try .tsx first, then .ts, then without extension (for index files)
    const key = `${basePath}${page}.tsx`;
    const keyTs = `${basePath}${page}.ts`;
    const keyIndex = `${basePath}${page}/index.tsx`;

    const loader = routes[key] || routes[keyTs] || routes[keyIndex];
    if (!loader) {
        console.error(`Route not found: ${page} (tried ${key}, ${keyTs}, ${keyIndex})`);
        return Promise.reject(new Error(`Route not found: ${page}`));
    }
    return loader() as Promise<RouteModule>;
};

export const toAsyncPageRoute = ({
    path,
    page,
    type = AppType.Stable
}: AsyncRoute): RouteObject => {
    return {
        path,
        lazy: async () => {
            const module = await importRoute(page ?? path, type);
            if (!module.default) {
                throw new Error(`Route module for ${page ?? path} has no default export`);
            }
            return {
                Component: module.default
            };
        }
    };
};
