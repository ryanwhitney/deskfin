import React, { forwardRef } from 'react';
import { Link as RacLink, type LinkProps as RacLinkProps } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';
import styles from './Button.module.scss';

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

export interface LinkButtonProps extends Omit<RacLinkProps, 'className'> {
    className?: string;
    icon?: React.ReactNode;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
    { icon, className, children, ...rest },
    ref
) {
    return (
        <FocusRing focusRingClass="focus-ring">
            <RacLink
                ref={ref}
                className={cx(styles.button, className)}
                {...rest}
            >
                {icon ?? null}
                {children}
            </RacLink>
        </FocusRing>
    );
});
