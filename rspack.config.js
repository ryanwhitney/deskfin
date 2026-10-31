/*
 * Deskfin's build (Rspack). Mirrors upstream's webpack.common.js / webpack.dev.js / webpack.prod.js, which are
 * kept in the repo untouched (and unused) so upstream syncs never conflict on them. When syncing, glance at
 * upstream changes to those files — new copied `Assets`, entries, or defines may need mirroring here.
 *
 * Differences from upstream's build, on purpose:
 *  - Modern browser targets. Upstream supports Chrome 27-era TVs (ES5 + core-js polyfills); deskfin is a
 *    desktop UI, so it ships modern syntax — smaller, faster bundles.
 *  - Rspack's built-in SWC and Lightning CSS replace Babel, ts-loader, PostCSS, autoprefixer and cssnano.
 *  - CSS modules (`*.module.scss`) with a default export, as deskfin components use them.
 *  - Deskfin's SVG icons load as source text so they can be inlined and tinted with currentColor.
 *  - Deskfin's own index.html (splash screen, branding) and favicons.
 *  - Production config.json lists the HTTPS server address (JELLYFIN_SERVERS overrides).
 *
 * Type checking is not part of the build: run `npm run build:check`.
 */
const path = require('path');
const fg = require('fast-glob');
const { rspack } = require('@rspack/core');
const packageJson = require('./package.json');

const SRC = path.resolve(__dirname, 'src');
const DESKFIN = path.join(SRC, 'apps/deskfin');
const DESKFIN_ICONS = path.join(DESKFIN, 'assets/icons');
const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

const BROWSERS = [
    'last 2 Chrome versions',
    'last 2 Edge versions',
    'last 2 Firefox versions',
    'Firefox ESR',
    'last 2 Safari major versions',
    'last 2 iOS major versions'
];

// Third-party polyfills imported by upstream's src/lib/legacy, dropped from deskfin's modern build.
// (Upstream's own small shims in lib/legacy still load; so do regenerator-runtime, which some prebuilt
// dependencies expect as a global, and resize-observer-polyfill, which defers to the native implementation.)
const LEGACY_POLYFILLS = [
    'core-js/stable',
    'element-closest-polyfill',
    'fast-text-encoding',
    'intersection-observer',
    'classlist.js',
    'whatwg-fetch',
    'abortcontroller-polyfill',
    'proxy-polyfill'
];

// Copied as-is into dist/libraries (same list as upstream's webpack.common.js).
const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    'libarchive.js/dist/libarchive.wasm',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'pdfjs-dist/build/pdf.worker.js'
];

// Server(s) prefilled into config.json for production builds, so new devices on https://media.home connect
// through the HTTPS proxy instead of the LAN address (which browsers block as mixed content).
const PRODUCTION_SERVERS = (process.env.JELLYFIN_SERVERS ?? 'https://jellyfin.home')
    .split(',').map(server => server.trim()).filter(Boolean);

let COMMIT_SHA = '';
try {
    COMMIT_SHA = require('child_process')
        // eslint-disable-next-line sonarjs/no-os-command-from-path
        .execSync('git describe --always --dirty')
        .toString()
        .trim();
} catch (err) {
    console.warn('Failed to get commit sha. Is git installed?', err);
}

const THEMES = fg.globSync('themes/**/*.scss', { cwd: SRC });
const THEMES_BY_ID = THEMES.reduce((acc, theme) => {
    acc[theme.substring(0, theme.lastIndexOf('/'))] = `./${theme}`;
    return acc;
}, {});

/** SWC options for JS/JSX or TS/TSX sources. */
const swc = (typescript, development) => ({
    loader: 'builtin:swc-loader',
    options: {
        jsc: {
            parser: typescript ?
                { syntax: 'typescript', tsx: true } :
                { syntax: 'ecmascript', jsx: true },
            transform: {
                react: { runtime: 'automatic', development }
            }
        },
        env: { targets: BROWSERS }
    }
});

/** Writes the production server list into the copied config.json. */
class PrefillServersPlugin {
    apply(compiler) {
        const { RawSource } = compiler.webpack.sources;
        compiler.hooks.thisCompilation.tap('PrefillServersPlugin', compilation => {
            compilation.hooks.processAssets.tap(
                { name: 'PrefillServersPlugin', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS + 1 },
                () => {
                    const asset = compilation.getAsset('config.json');
                    if (!asset) return;
                    const config = { ...JSON.parse(asset.source.source().toString()), servers: PRODUCTION_SERVERS };
                    compilation.updateAsset('config.json', new RawSource(JSON.stringify(config, null, 4) + '\n'));
                }
            );
        });
    }
}

module.exports = (env = {}) => {
    const PRODUCTION = process.env.NODE_ENV === 'production';
    const DEV_SERVER = !!(env.RSPACK_SERVE || process.env.RSPACK_SERVE);

    return {
        context: SRC,
        mode: PRODUCTION ? 'production' : 'development',
        target: `browserslist:${BROWSERS.join(', ')}`,
        devtool: PRODUCTION ? false : 'eval-cheap-module-source-map',
        entry: {
            'main.jellyfin': './index.jsx',
            ...THEMES_BY_ID,
            ...(PRODUCTION ? { serviceworker: './serviceworker.js' } : {})
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            // 'node_modules' (relative) keeps normal nested lookup, e.g. a package's own node_modules/
            modules: [SRC, 'node_modules'],
            // Upstream's lib/legacy polyfills features every deskfin target browser has natively.
            alias: Object.fromEntries(LEGACY_POLYFILLS.map(polyfill => [polyfill, false]))
        },
        experiments: {
            css: true
        },
        plugins: [
            new rspack.DefinePlugin({
                __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
                __JF_BUILD_VERSION__: JSON.stringify(
                    DEV_SERVER ? 'Dev Server' : process.env.JELLYFIN_VERSION || 'Release'),
                __PACKAGE_JSON_NAME__: JSON.stringify(packageJson.name),
                __PACKAGE_JSON_VERSION__: JSON.stringify(packageJson.version),
                __USE_SYSTEM_FONTS__: !!JSON.parse(process.env.USE_SYSTEM_FONTS || '0'),
                __WEBPACK_SERVE__: DEV_SERVER
            }),
            new rspack.HtmlRspackPlugin({
                filename: 'index.html',
                template: path.join(DESKFIN, 'index.html'),
                // Append file hashes to bundle urls for cache busting
                hash: true,
                chunks: ['main.jellyfin', 'serviceworker']
            }),
            new rspack.CopyRspackPlugin({
                patterns: [
                    { from: 'assets', to: 'assets' },
                    'config.json',
                    'manifest.json',
                    'robots.txt',
                    {
                        from: 'touchicon*.png',
                        context: path.resolve(__dirname, 'node_modules/@jellyfin/ux-web/favicons'),
                        to: 'favicons'
                    },
                    { from: path.join(DESKFIN, 'assets/favicons'), to: 'deskfin' },
                    ...Assets.map(asset => ({
                        from: path.resolve(__dirname, `node_modules/${asset}`),
                        to: 'libraries'
                    }))
                ]
            }),
            ...(PRODUCTION ? [new PrefillServersPlugin()] : []),
            // The libarchive.js worker-bundle is copied manually (see Assets).
            new rspack.IgnorePlugin({
                resourceRegExp: /worker-bundle\.js$/,
                contextRegExp: /libarchive.js/
            })
        ],
        output: {
            // Content-hashed names let the server cache bundles forever (deskfin's Caddy config marks them
            // immutable). The service worker keeps a stable name, as browsers require.
            filename: pathData => (
                pathData.chunk.name === 'serviceworker' ? '[name].js' : '[name].[contenthash].bundle.js'
            ),
            // Upstream's `webpackChunkName: "[request]"` yields an empty name for index routes; Rspack then emits
            // ".<hash>.chunk.js" but its runtime requests "<id>.<hash>.chunk.js". Name such chunks by id.
            chunkFilename: pathData => (pathData.chunk?.name ? '[name]' : '[id]') + '.[contenthash].chunk.js',
            cssFilename: pathData => (
                pathData.chunk?.name?.startsWith('themes/') ? '[name]/theme.css' : '[name].[contenthash].css'
            ),
            cssChunkFilename: pathData => (pathData.chunk?.name ? '[name]' : '[id]') + '.[contenthash].css',
            assetModuleFilename: pathData => {
                if (pathData.filename.startsWith('assets/') || pathData.filename.startsWith('themes/')) {
                    return '[path][base][query]';
                }
                return '[name].[hash][ext][query]';
            },
            path: path.resolve(__dirname, 'dist'),
            publicPath: '',
            clean: true
        },
        // Size hints flag lazily-loaded workers/WASM (PDF, subtitles, archives) and the uncompressed entry;
        // neither reflects what a page actually downloads up front.
        performance: { hints: false },
        optimization: {
            runtimeChunk: 'single',
            minimizer: [
                new rspack.SwcJsMinimizerRspackPlugin(),
                new rspack.LightningCssMinimizerRspackPlugin({ minimizerOptions: { targets: BROWSERS } })
            ],
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: Infinity,
                cacheGroups: {
                    node_modules: {
                        test(module) {
                            return NODE_MODULES_REGEX.test(module.context);
                        },
                        name(module) {
                            // get the name. E.g. node_modules/packageName/not/this/part.js
                            // or node_modules/packageName
                            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                            // if "packageName" is a namespace (i.e. @jellyfin) get the namespace + packageName
                            if (packageName.startsWith('@')) {
                                const parts = module.context
                                    .substring(module.context.lastIndexOf(packageName))
                                    .split(/[\\/]/);
                                return `node_modules.${parts[0]}.${parts[1]}`;
                            }

                            if (packageName === 'date-fns') {
                                const parts = module.context
                                    .substring(module.context.lastIndexOf(packageName))
                                    .split(/[\\/]/);

                                let name = `node_modules.${parts[0]}`;
                                if (parts[1]) {
                                    name += `.${parts[1]}`;

                                    if (parts[1] === 'locale' && parts[2]) {
                                        name += `.${parts[2]}`;
                                    }
                                }

                                return name;
                            }

                            return `node_modules.${packageName}`;
                        }
                    }
                }
            }
        },
        module: {
            parser: {
                'css/auto': { namedExports: false }
            },
            generator: {
                'css/auto': {
                    exportsConvention: 'as-is',
                    localIdentName: PRODUCTION ? '[hash]' : '[name]__[local]--[hash]'
                }
            },
            rules: [
                {
                    // Templates and legacy views are imported as strings.
                    test: /\.html$/,
                    type: 'asset/source'
                },
                {
                    // Upstream imports workers as constructors (worker-loader style).
                    test: /\.worker\.ts$/,
                    resourceQuery: { not: [/worker/] },
                    loader: path.resolve(__dirname, 'rspack/worker-constructor-loader.js')
                },
                {
                    test: /\.(ts|tsx)$/,
                    exclude: NODE_MODULES_REGEX,
                    use: [swc(true, !PRODUCTION)]
                },
                {
                    test: /\.(js|jsx|mjs)$/,
                    exclude: NODE_MODULES_REGEX,
                    use: [swc(false, !PRODUCTION)]
                },
                {
                    test: /\.(sa|sc|c)ss$/i,
                    use: [{ loader: 'sass-loader', options: { api: 'modern-compiler' } }],
                    type: 'css/auto'
                },
                {
                    test: /\.svg$/i,
                    include: DESKFIN_ICONS,
                    type: 'asset/source'
                },
                {
                    test: /\.(ico|png|jpg|gif|svg)$/i,
                    exclude: DESKFIN_ICONS,
                    type: 'asset/resource'
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    type: 'asset/resource'
                },
                {
                    test: /\.(mp3)$/i,
                    type: 'asset/resource'
                },
                {
                    test: require.resolve('jquery'),
                    loader: 'expose-loader',
                    options: {
                        exposes: ['$', 'jQuery']
                    }
                }
            ]
        },
        devServer: {
            port: 8080,
            compress: true,
            client: {
                overlay: {
                    errors: true,
                    warnings: false
                }
            }
        }
    };
};
