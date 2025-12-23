import React, { type CSSProperties, type FC } from 'react';
import classNames from 'classnames';

interface JfIconProps {
    /** Inline SVG markup (prefer `IconSvgs.*` from `src/assets/icons.ts`). */
    svg: string;
    className?: string;
    /**
     * Optional accessible label. If omitted, icon is treated as decorative.
     * Prefer using surrounding button/link `title`/`aria-label` when possible.
     */
    label?: string;
    style?: CSSProperties;
}

/**
 * Renders an inline SVG icon that inherits `currentColor`.
 * We inline SVG (vs CSS mask) because Safari/WebKit can be unreliable with mask vars.
 */
const JfIcon: FC<JfIconProps> = ({ svg, className, label, style }) => {
    const props: React.HTMLAttributes<HTMLSpanElement> = label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': 'true' };

    return (
        <span
            {...props}
            className={classNames('jfSvgIcon', className)}
            style={style}
            // We only inline our own local SVGs.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default JfIcon;


