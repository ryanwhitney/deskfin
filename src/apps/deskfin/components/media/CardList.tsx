import React from 'react';
import { GridList, type GridListProps } from 'react-aria-components';

/**
 * A keyboard-navigable collection of cards. The whole collection is one Tab stop: Up/Down move between cards,
 * Left/Right move through the focused card's buttons and links, and Enter opens the focused card. Rows and grids
 * are laid out with CSS; navigation follows card order.
 */
export function CardList<T extends object>(props: Readonly<GridListProps<T>>) {
    return <GridList selectionMode='none' {...props} />;
}
