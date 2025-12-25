import React, { type ButtonHTMLAttributes, type FC } from 'react';

import styles from './ToolbarLink.module.scss';

type ToolbarTextButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    className?: string;
    isActive?: boolean;
};

export const ToolbarTextButton: FC<ToolbarTextButtonProps> = ({
    className,
    isActive,
    type = 'button',
    ...props
}) => {
    const classes = [
        styles.link,
        isActive ? styles.active : '',
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


