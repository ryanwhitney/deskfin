import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import styles from './DropdownMenu.module.scss';

interface DropdownMenuProps {
    anchorEl: HTMLElement | null
    open: boolean
    onClose: () => void
    children: React.ReactNode
    align?: 'right' | 'left'
    id?: string
    className?: string
}

const DropdownMenu = ({
    anchorEl,
    open,
    onClose,
    children,
    align = 'right',
    id,
    className
}: DropdownMenuProps) => {
    const [ style, setStyle ] = useState<React.CSSProperties>({});
    const menuRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (!anchorEl || !open) return;
        const rect = anchorEl.getBoundingClientRect();
        const top = rect.bottom + window.scrollY + 4;
        const left = align === 'right'
            ? rect.right + window.scrollX
            : rect.left + window.scrollX;
        setStyle({
            position: 'absolute',
            top,
            left: align === 'right' ? left : left,
            transform: align === 'right' ? 'translateX(-100%)' : 'none',
            zIndex: 1300
        });
    }, [ anchorEl, open, align ]);

    useEffect(() => {
        if (!open) return;
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!menuRef.current || menuRef.current.contains(target)) {
                return;
            }
            if (anchorEl && anchorEl.contains(target)) {
                return;
            }
            onClose();
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleClick, true);
        window.addEventListener('keydown', handleEscape, true);
        return () => {
            window.removeEventListener('mousedown', handleClick, true);
            window.removeEventListener('keydown', handleEscape, true);
        };
    }, [ open, anchorEl, onClose ]);

    const content = useMemo(() => {
        if (!open) return null;
        const classes = [ styles.menu, className ?? '' ].filter(Boolean).join(' ');
        return (
            <div
                ref={menuRef}
                className={classes}
                id={id}
                style={style}
                role='menu'
            >
                {children}
            </div>
        );
    }, [ children, open, style, id, className ]);

    return content ? ReactDOM.createPortal(content, document.body) : null;
};

export default DropdownMenu;

