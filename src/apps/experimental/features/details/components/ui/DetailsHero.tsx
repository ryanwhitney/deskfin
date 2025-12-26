import React, { type FC } from 'react';
import styles from '../../routes/DetailsRoute.module.scss';

interface DetailsHeroProps {
    backdropUrl: string;
}

export const DetailsHero: FC<DetailsHeroProps> = ({ backdropUrl }) => (
    <div className={styles.heroContainer}>
        <div
            className={styles.hero}
            style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined }}
        >
            <div className={styles.heroOverlay} />
        </div>
    </div>
);
