import React, { forwardRef } from 'react';
import { Button as RacButton, type ButtonProps as RacButtonProps } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';
import styles from './Button.module.scss';

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

export interface ButtonProps extends Omit<RacButtonProps, 'className'> {
    className?: string;
    icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { icon, className, children, ...rest },
    ref
) {
    return (
        <FocusRing focusRingClass="focus-ring">
            <RacButton
                ref={ref}
                className={cx(styles.button, className)}
                {...rest}
            >
                {icon ?? null}
                {children}
            </RacButton>
        </FocusRing>
    );
});
