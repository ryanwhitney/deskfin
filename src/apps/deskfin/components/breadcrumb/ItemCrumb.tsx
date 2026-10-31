import React, { type AnchorHTMLAttributes, type FC } from 'react';

interface ItemCrumbProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> {
    itemId?: string | null;
    name?: string | null;
    linkClassName?: string;
    textClassName?: string;
}

/** A link to an item's details page (e.g. an episode's series or season), or plain text when only the name is known. */
export const ItemCrumb: FC<ItemCrumbProps> = ({ itemId, name, linkClassName, textClassName, ...linkProps }) => {
    if (!name) return null;
    if (!itemId) return <span className={textClassName}>{name}</span>;
    return (
        <a {...linkProps} href={`#/details?id=${itemId}`} className={linkClassName}>
            {name}
        </a>
    );
};
