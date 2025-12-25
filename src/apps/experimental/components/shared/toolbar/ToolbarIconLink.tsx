import React, { type ComponentProps, type FC } from 'react';
import { Link } from 'react-router-dom';

import styles from './ToolbarIconButton.module.scss';

type ToolbarIconLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
    className?: string;
    variant?: 'default' | 'hamburger';
};

export const ToolbarIconLink: FC<ToolbarIconLinkProps> = ({
    className,
    variant = 'default',
    ...props
}) => {
    const classes = [
        styles.button,
        variant === 'hamburger' ? styles.hamburger : '',
        className ?? ''
    ].filter(Boolean).join(' ');

    return (
        <Link
            {...props}
            className={classes}
        />
    );
};


