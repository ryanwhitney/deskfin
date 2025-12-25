export * from '../../../components/shared/toolbar/ToolbarMenu';

import React, { type ButtonHTMLAttributes, type FC, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

import styles from './ToolbarMenu.module.scss';

export const ToolbarMenuDivider: FC = () => (
    <div className={styles.divider} />
);

export const ToolbarMenuIcon: FC<{ children: ReactNode }> = ({ children }) => (
    <span className={styles.icon}>{children}</span>
);

type ToolbarMenuItemBase = {
    children: ReactNode;
    className?: string;
};

type ToolbarMenuItemLinkProps = ToolbarMenuItemBase & Omit<LinkProps, 'className'> & {
    as: 'link';
};

type ToolbarMenuItemButtonProps = ToolbarMenuItemBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    as: 'button';
};

export const ToolbarMenuItem: FC<ToolbarMenuItemLinkProps | ToolbarMenuItemButtonProps> = (props) => {
    const classes = [ styles.item, props.className ?? '' ].filter(Boolean).join(' ');

    if (props.as === 'link') {
        const { as, className, ...rest } = props;
        return <Link {...rest} className={classes} />;
    }

    const { as, className, type = 'button', ...rest } = props;
    return <button {...rest} type={type} className={classes} />;
};


