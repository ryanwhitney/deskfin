import React, { type FC } from 'react';
import { Button as RacButton, type ButtonProps as RacButtonProps } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import styles from './ToolbarIconButton.module.scss';

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

type ToolbarIconButtonProps = Omit<RacButtonProps, 'className'> & {
    className?: string;
    variant?: 'default' | 'hamburger';
};

export const ToolbarIconButton: FC<ToolbarIconButtonProps> = ({
    className,
    variant = 'default',
    ...props
}) => {
    return (
        <FocusRing focusRingClass="focus-ring">
            <RacButton
                {...props}
                className={cx(
                    styles.button,
                    variant === 'hamburger' ? styles.hamburger : undefined,
                    className
                )}
            />
        </FocusRing>
    );
};
