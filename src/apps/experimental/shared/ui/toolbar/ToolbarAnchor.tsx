export * from '../../../components/shared/toolbar/ToolbarAnchor';

import React, { type AnchorHTMLAttributes, type FC } from 'react';

import styles from './ToolbarLink.module.scss';

type ToolbarAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
    className?: string;
    isActive?: boolean;
};

export const ToolbarAnchor: FC<ToolbarAnchorProps> = ({
    className,
    isActive,
    ...props
}) => {
    const classes = [
        styles.link,
        isActive ? styles.active : '',
        className ?? ''
    ].filter(Boolean).join(' ');

    return (
        <a
            {...props}
            className={classes}
            aria-current={isActive ? 'page' : undefined}
        />
    );
};


