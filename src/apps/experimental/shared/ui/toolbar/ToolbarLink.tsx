export * from '../../../components/shared/toolbar/ToolbarLink';

import React, { type ComponentProps, type FC } from 'react';
import { Link } from 'react-router-dom';

import styles from './ToolbarLink.module.scss';

type ToolbarLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
    isActive?: boolean;
    className?: string;
};

export const ToolbarLink: FC<ToolbarLinkProps> = ({
    isActive,
    className,
    ...props
}) => {
    const classes = [
        styles.link,
        isActive ? styles.active : '',
        className ?? ''
    ].filter(Boolean).join(' ');

    return (
        <Link
            {...props}
            className={classes}
            aria-current={isActive ? 'page' : undefined}
        />
    );
};


