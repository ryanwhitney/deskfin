import React, { type ButtonHTMLAttributes, type FC } from 'react';

import styles from './ToolbarIconButton.module.scss';

type ToolbarIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    className?: string;
    variant?: 'default' | 'hamburger';
};

export const ToolbarIconButton: FC<ToolbarIconButtonProps> = ({
    className,
    variant = 'default',
    type = 'button',
    ...props
}) => {
    const classes = [
        styles.button,
        variant === 'hamburger' ? styles.hamburger : '',
        className ?? ''
    ].filter(Boolean).join(' ');

    return (
        <button
            {...props}
            type={type}
            className={classes}
        />
    );
};


