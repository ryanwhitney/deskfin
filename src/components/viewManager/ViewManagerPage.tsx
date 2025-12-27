import { Action } from 'history';
import { FunctionComponent, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

import globalize from 'lib/globalize';
import type { RestoreViewFailResponse } from 'types/viewManager';

import viewManager from './viewManager';
import { AppType } from 'constants/appType';

export interface ViewManagerPageProps {
    appType?: AppType
    controller: string
    view: string
    type?: string
    isFullscreen?: boolean
    isNowPlayingBarEnabled?: boolean
    isThemeMediaSupported?: boolean
    transition?: string
}

interface ViewOptions {
    url: string
    type?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any
    autoFocus: boolean
    fullscreen?: boolean
    transition?: string
    options: {
        supportsThemeMedia?: boolean
        enableMediaControl?: boolean
    }
}

// Use Vite's glob imports to pre-bundle all controller modules
const dashboardControllers = import.meta.glob('../../apps/dashboard/controllers/**/*.js');
const wizardControllers = import.meta.glob('../../apps/wizard/controllers/**/*.js');
const stableControllers = import.meta.glob('../../controllers/**/*.js');

// Import HTML views as raw strings
const dashboardViews = import.meta.glob('../../apps/dashboard/controllers/**/*.html', { query: '?raw', import: 'default' });
const wizardViews = import.meta.glob('../../apps/wizard/controllers/**/*.html', { query: '?raw', import: 'default' });
const stableViews = import.meta.glob('../../controllers/**/*.html', { query: '?raw', import: 'default' });

const importController = async (
    appType: AppType,
    controller: string,
    view: string
) => {
    let controllers: Record<string, () => Promise<unknown>>;
    let views: Record<string, () => Promise<unknown>>;
    let basePath: string;

    switch (appType) {
        case AppType.Dashboard:
            controllers = dashboardControllers;
            views = dashboardViews;
            basePath = '../../apps/dashboard/controllers/';
            break;
        case AppType.Wizard:
            controllers = wizardControllers;
            views = wizardViews;
            basePath = '../../apps/wizard/controllers/';
            break;
        default:
            controllers = stableControllers;
            views = stableViews;
            basePath = '../../controllers/';
            break;
    }

    const controllerKey = `${basePath}${controller}.js`;
    const controllerIndexKey = `${basePath}${controller}/index.js`;
    const viewKey = `${basePath}${view}`;

    const controllerLoader = controllers[controllerKey] || controllers[controllerIndexKey];
    const viewLoader = views[viewKey];

    if (!controllerLoader) {
        console.error(`Controller not found: ${controller} (tried ${controllerKey}, ${controllerIndexKey})`);
        throw new Error(`Controller not found: ${controller}`);
    }

    const controllerFactory = await controllerLoader();
    let viewHtml = '';
    if (viewLoader) {
        viewHtml = await viewLoader() as string;
    }

    return [controllerFactory, globalize.translateHtml(viewHtml)];
};

const loadView = async (
    appType: AppType,
    controller: string,
    view: string,
    viewOptions: ViewOptions
) => {
    const [ controllerFactory, viewHtml ] = await importController(appType, controller, view);

    viewManager.loadView({
        ...viewOptions,
        controllerFactory,
        view: viewHtml
    });
};

/**
 * Page component that renders legacy views via the ViewManager.
 * NOTE: Any new pages should use the generic Page component instead.
 */
const ViewManagerPage: FunctionComponent<ViewManagerPageProps> = ({
    appType = AppType.Stable,
    controller,
    view,
    type,
    isFullscreen = false,
    isNowPlayingBarEnabled = true,
    isThemeMediaSupported = false,
    transition
}) => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const loadingPromiseRef = useRef<Promise<void> | null>(null);
    const lastViewKeyRef = useRef<string>('');

    useEffect(() => {
        const loadPage = () => {
            const viewOptions = {
                url: location.pathname + location.search,
                type,
                state: location.state,
                autoFocus: false,
                fullscreen: isFullscreen,
                transition,
                options: {
                    supportsThemeMedia: isThemeMediaSupported,
                    enableMediaControl: isNowPlayingBarEnabled
                }
            };

            if (navigationType !== Action.Pop) {
                console.debug('[ViewManagerPage] loading view [%s]', view);
                return loadView(appType, controller, view, viewOptions);
            }

            console.debug('[ViewManagerPage] restoring view [%s]', view);
            return viewManager.tryRestoreView(viewOptions)
                .catch(async (result?: RestoreViewFailResponse) => {
                    if (!result?.cancelled) {
                        console.debug('[ViewManagerPage] restore failed; loading view [%s]', view);
                        return loadView(appType, controller, view, viewOptions);
                    }
                });
        };

        // Prevent double-loading in React StrictMode by tracking if we've already loaded this view
        const viewKey = `${controller}:${view}:${location.pathname}:${location.search}`;

        if (loadingPromiseRef.current && lastViewKeyRef.current === viewKey) {
            return;
        }

        lastViewKeyRef.current = viewKey;
        const promise = loadPage();
        loadingPromiseRef.current = promise;

        // Clear promise when it completes
        promise?.then(() => {
            loadingPromiseRef.current = null;
        }).catch(() => {
            loadingPromiseRef.current = null;
        });
    },
    // location.state and navigationType are NOT included as dependencies here since dialogs will update state while the current view stays the same
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        controller,
        view,
        type,
        isFullscreen,
        isNowPlayingBarEnabled,
        isThemeMediaSupported,
        transition,
        location.pathname,
        location.search
    ]);

    return null;
};

export default ViewManagerPage;
