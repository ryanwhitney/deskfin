import React, { type CSSProperties, type FC } from 'react';
import classNames from 'classnames';
import styles from './SvgIcon.module.scss';

export interface SvgIconProps {
    /** Inline SVG markup (prefer `IconSvgs.*` from `src/assets/icons.ts`). */
    svg: string;
    className?: string;
    /**
     * Default is **18px**. You can override per-usage (e.g. 22, '1.2em', '24px').
     * We apply the size to the wrapper so SVGs with `width/height="1em"` still scale correctly.
     */
    size?: number | string;
    /**
     * Optional accessible label. If omitted, icon is treated as decorative.
     * Prefer using surrounding button/link `title`/`aria-label` when possible.
     */
    label?: string;
    style?: CSSProperties;
}

const toCssSize = (size: number | string | undefined) => {
    if (size == null) return '18px';
    return typeof size === 'number' ? `${size}px` : size;
};

/**
 * Renders an inline SVG icon that inherits `currentColor`.
 */
export const SvgIcon: FC<SvgIconProps> = ({ svg, className, label, size, style }) => {
    const props: React.HTMLAttributes<HTMLSpanElement> = label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': 'true' };

    const s = toCssSize(size);

    return (
        <span
            {...props}
            className={classNames(styles.svgIcon, className)}
            style={{ width: s, height: s, ...style }}
            // We only inline our own local SVGs.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default SvgIcon;


