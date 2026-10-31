import React, { type CSSProperties, type FC, type HTMLAttributes, useLayoutEffect, useRef, useState } from 'react';

import styles from './Squircle.module.scss';

// eslint-disable-next-line compat/compat -- deskfin targets current browsers (see rspack.config.js)
const SUPPORTS_CORNER_SHAPE = typeof CSS !== 'undefined' && CSS.supports('corner-shape', 'superellipse(2)');

const toRad = (degrees: number) => degrees * Math.PI / 180;

/**
 * SVG path for a Figma-style squircle (as figma-squircle / @squircle-js draw it), for browsers without
 * `corner-shape`. Smoothing shrinks when the corner doesn't fit, as Figma does.
 */
const squirclePath = (width: number, height: number, radius: number, smoothing = 1) => {
    const budget = Math.min(width, height) / 2;
    const r = Math.min(radius, budget);
    const s = Math.max(0, Math.min(smoothing, budget / r - 1));
    const p = Math.min((1 + s) * r, budget);

    const arcMeasure = 90 * (1 - s);
    const arc = Math.sin(toRad(arcMeasure / 2)) * r * Math.SQRT2;
    const angleAlpha = (90 - arcMeasure) / 2;
    const p3ToP4 = r * Math.tan(toRad(angleAlpha / 2));
    const angleBeta = 45 * s;
    const c = p3ToP4 * Math.cos(toRad(angleBeta));
    const d = c * Math.tan(toRad(angleBeta));
    const b = (p - arc - c - d) / 3;
    const a = 2 * b;
    const e = a + b + c;

    return [
        `M ${width - p} 0`,
        `c ${a} 0 ${a + b} 0 ${e} ${d}`,
        `a ${r} ${r} 0 0 1 ${arc} ${arc}`,
        `c ${d} ${c} ${d} ${b + c} ${d} ${e}`,
        `L ${width} ${height - p}`,
        `c 0 ${a} 0 ${a + b} ${-d} ${e}`,
        `a ${r} ${r} 0 0 1 ${-arc} ${arc}`,
        `c ${-c} ${d} ${-(b + c)} ${d} ${-e} ${d}`,
        `L ${p} ${height}`,
        `c ${-a} 0 ${-(a + b)} 0 ${-e} ${-d}`,
        `a ${r} ${r} 0 0 1 ${-arc} ${-arc}`,
        `c ${-d} ${-c} ${-d} ${-(b + c)} ${-d} ${-e}`,
        `L 0 ${p}`,
        `c 0 ${-a} 0 ${-(a + b)} ${d} ${-e}`,
        `a ${r} ${r} 0 0 1 ${arc} ${-arc}`,
        `c ${c} ${-d} ${b + c} ${-d} ${e} ${-d}`,
        'Z'
    ].join(' ');
};

export interface SquircleProps extends HTMLAttributes<HTMLDivElement> {
    /** Nominal corner radius in px, as in Figma with corner smoothing at 100%. */
    radius: number;
}

/** A div with squircle corners: native `corner-shape` where supported, an exact clip-path elsewhere. */
export const Squircle: FC<SquircleProps> = ({ radius, className, style, ...rest }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [ clipPath, setClipPath ] = useState<string>();

    useLayoutEffect(() => {
        const element = ref.current;
        if (SUPPORTS_CORNER_SHAPE || !element) return;

        // eslint-disable-next-line compat/compat -- deskfin targets current browsers (see rspack.config.js)
        const observer = new ResizeObserver(([ entry ]) => {
            const { inlineSize: width, blockSize: height } = entry.borderBoxSize[0];
            setClipPath(width && height ? `path('${squirclePath(width, height, radius)}')` : undefined);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [ radius ]);

    return (
        <div
            ref={ref}
            className={className ? `${styles.squircle} ${className}` : styles.squircle}
            style={{ '--squircle-radius': `${radius}px`, clipPath, ...style } as CSSProperties}
            {...rest}
        />
    );
};
