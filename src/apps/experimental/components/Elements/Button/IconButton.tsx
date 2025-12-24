import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

type Classy = { className?: string };

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & Classy & {
    icon?: React.ReactNode;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { icon, className, children, type = 'button', ...rest },
    ref
) {
    return (
        <button ref={ref} type={type} className={cx(styles.iconButton, className)} {...rest}>
            {icon ?? children}
        </button>
    );
});

