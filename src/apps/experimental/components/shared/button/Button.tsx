import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

type Classy = { className?: string };

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & Classy & {
    icon?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { icon, className, children, type = 'button', ...rest },
    ref
) {
    return (
        <button ref={ref} type={type} className={cx(styles.button, className)} {...rest}>
            {icon ?? null}
            {children}
        </button>
    );
});

