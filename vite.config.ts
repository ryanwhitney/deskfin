/// <reference types="vitest" />
/// <reference types="vite/client" />
import { execSync } from 'child_process';
import fg from 'fast-glob';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';

const PACKAGE_JSON = JSON.parse(
    require('fs').readFileSync('./package.json', 'utf-8')
);

let COMMIT_SHA = '';
try {
    COMMIT_SHA = execSync('git describe --always --dirty')
        .toString()
        .trim();
} catch (err) {
    console.warn('Failed to get commit sha. Is git installed?', err);
}

const Assets = [
    'native-promise-only/npo.js',
    'libarchive.js/dist/worker-bundle.js',
    'libarchive.js/dist/libarchive.wasm',
    '@jellyfin/libass-wasm/dist/js/default.woff2',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.wasm',
    '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js',
    'pdfjs-dist/build/pdf.worker.mjs',
    'libpgs/dist/libpgs.worker.js'
];

const THEMES = fg.globSync('themes/**/*.scss', { cwd: path.resolve(__dirname, 'src') });

export default defineConfig({
    assetsInclude: ['**/controllers/**/*.html', '**/apps/**/*.html'],
    plugins: [
        react(),
        tsconfigPaths(),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets',
                    dest: '.'
                },
                {
                    src: 'src/config.json',
                    dest: '.'
                },
                {
                    src: 'src/robots.txt',
                    dest: '.'
                },
                {
                    src: 'node_modules/@jellyfin/ux-web/favicons/touchicon*.png',
                    dest: 'favicons'
                },
                ...Assets.map(asset => ({
                    src: path.resolve(__dirname, `node_modules/${asset}`),
                    dest: 'libraries'
                }))
            ]
        })
    ],
    define: {
        __COMMIT_SHA__: JSON.stringify(COMMIT_SHA),
        __JF_BUILD_VERSION__: JSON.stringify(
            process.env.JELLYFIN_VERSION || 'Vite Build'
        ),
        __PACKAGE_JSON_NAME__: JSON.stringify(PACKAGE_JSON.name),
        __PACKAGE_JSON_VERSION__: JSON.stringify(PACKAGE_JSON.version),
        __USE_SYSTEM_FONTS__: !!JSON.parse(process.env.USE_SYSTEM_FONTS || '0'),
        __WEBPACK_SERVE__: false
    },
    build: {
        outDir: 'dist',
        assetsDir: '.',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/index.html')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'main') {
                        return 'index.bundle.js';
                    }
                    if (chunkInfo.name === 'serviceworker') {
                        return '[name].js';
                    }
                    return '[name].bundle.js';
                },
                chunkFileNames: '[name].[hash].chunk.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'manifest.json') {
                        return '[name][extname]';
                    }
                    if (assetInfo.name?.startsWith('assets/') || assetInfo.name?.startsWith('themes/')) {
                        return '[name][extname]';
                    }
                    if (assetInfo.name?.includes('/theme.css')) {
                        return '[name][extname]';
                    }
                    return '[name].[hash][extname]';
                }
            }
        },
        target: 'es2015',
        cssCodeSplit: true,
        sourcemap: true,
        minify: 'esbuild' // Use esbuild instead of terser (no extra dependency)
    },
    worker: {
        format: 'es'
    },
    server: {
        port: 8080,
        host: true,
        open: true
    },
    preview: {
        port: 8080,
        host: true
    },
    test: {
        coverage: {
            include: ['src']
        },
        environment: 'jsdom',
        restoreMocks: true
    }
});
