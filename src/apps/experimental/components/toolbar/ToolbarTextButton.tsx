import React, { type FC } from 'react';
import { Button as RacButton, type ButtonProps as RacButtonProps } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

import styles from './ToolbarLink.module.scss';

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

type ToolbarTextButtonProps = Omit<RacButtonProps, 'className'> & {
    className?: string;
    isActive?: boolean;
};

export const ToolbarTextButton: FC<ToolbarTextButtonProps> = ({
    className,
    isActive,
    ...props
}) => {
    return (
        <FocusRing focusRingClass="focus-ring">
            <RacButton
                {...props}
                className={cx(
                    styles.link,
                    isActive ? styles.active : undefined,
                    className
                )}
            />
        </FocusRing>
    );
};
