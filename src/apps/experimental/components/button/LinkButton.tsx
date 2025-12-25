import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

type Classy = { className?: string };

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & Classy & {
    icon?: React.ReactNode;
};

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
    { icon, className, children, ...rest },
    ref
) {
    return (
        <a ref={ref} className={cx(styles.button, className)} {...rest}>
            {icon ?? null}
            {children}
        </a>
    );
});

