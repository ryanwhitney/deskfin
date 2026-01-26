import React, { type FC } from 'react';
import { Link as RacLink, type LinkProps as RacLinkProps } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import styles from './ToolbarLink.module.scss';

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

type ToolbarAnchorProps = Omit<RacLinkProps, 'className'> & {
    className?: string;
    isActive?: boolean;
};

export const ToolbarAnchor: FC<ToolbarAnchorProps> = ({
    className,
    isActive,
    ...props
}) => {
    return (
        <FocusRing focusRingClass="focus-ring">
            <RacLink
                {...props}
                className={cx(
                    styles.link,
                    isActive ? styles.active : undefined,
                    className
                )}
                aria-current={isActive ? 'page' : undefined}
            />
        </FocusRing>
    );
};
