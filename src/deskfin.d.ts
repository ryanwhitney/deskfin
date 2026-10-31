/*
 * Module types for deskfin. This file sits at the src root and sorts before src/index.d.ts, so TypeScript
 * registers these patterns first: `*.module.scss` (CSS modules) then takes precedence over upstream's
 * catch-all `*.scss` declaration.
 */
declare module '*.module.scss' {
    const classes: { readonly [className: string]: string };
    export default classes;
}

/** Deskfin's icons are bundled as SVG source text (see rspack.config.js). */
declare module '*.svg' {
    const svg: string;
    export default svg;
}
