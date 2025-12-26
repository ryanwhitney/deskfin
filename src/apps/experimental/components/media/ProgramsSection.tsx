import React, { type FC } from 'react';
import classNames from 'classnames';
import ItemsContainer, {
    type ItemsContainerProps
} from 'elements/emby-itemscontainer/ItemsContainer';
import Scroller from 'elements/emby-scroller/Scroller';
import Cards from 'components/cardbuilder/Card/Cards';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import type { CardOptions } from 'types/cardOptions';
import type { ItemDto } from 'types/base/models/item-dto';

import styles from './Section.module.scss';

interface ProgramsSectionProps {
    title: string;
    titleHref?: string;
    items: ItemDto[];
    cardOptions?: CardOptions;
    itemsContainerProps?: ItemsContainerProps;
    className?: string;
}

export const ProgramsSection: FC<ProgramsSectionProps> = ({
    title,
    titleHref,
    items = [],
    cardOptions = {},
    itemsContainerProps,
    className
}) => {
    if (!items.length) {
        return null;
    }

    return (
        <section className={classNames(styles.section, className)}>
            <div className={styles.header}>
                {titleHref && items.length > 5 ? (
                    <a href={titleHref} className={styles.titleLink}>
                        <h2 className={styles.title}>{title}</h2>
                        <SvgIcon svg={IconSvgs.chevronDown} size={20} className={styles.chevron} />
                    </a>
                ) : (
                    <h2 className={styles.titleStatic}>{title}</h2>
                )}
            </div>

            <Scroller>
                <ItemsContainer
                    className="scrollSlider"
                    {...itemsContainerProps}
                >
                    <Cards items={items} cardOptions={cardOptions} />
                </ItemsContainer>
            </Scroller>
        </section>
    );
};

export default ProgramsSection;
