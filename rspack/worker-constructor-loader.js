/*
 * Upstream imports web workers webpack-4 style: `import Worker from './foo.worker.ts'; new Worker()`.
 * This loader turns such an import into a constructor that starts the same file as a module-bundled worker
 * (Rspack bundles `new Worker(new URL(...))` natively), so upstream code works unchanged without worker-loader.
 */
const path = require('path');

module.exports = function workerConstructorLoader() {
    const workerUrl = JSON.stringify(`./${path.basename(this.resourcePath)}?worker`);
    return `export default function WorkerConstructor(options) {
    return new Worker(new URL(${workerUrl}, import.meta.url), options);
}
`;
};
