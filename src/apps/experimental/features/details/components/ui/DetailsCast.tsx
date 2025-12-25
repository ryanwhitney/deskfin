import React, { type FC } from 'react';
import globalize from 'lib/globalize';
import styles from '../../routes/DetailsRoute.module.scss';

interface Person {
    Id?: string | null;
    Name?: string | null;
    Role?: string | null;
    Type?: string | null;
}

interface DetailsCastProps {
    cast: Person[];
}

export const DetailsCast: FC<DetailsCastProps> = ({ cast }) => {
    if (!cast.length) return null;

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
                {globalize.tryTranslate?.('GuestStars') ?? 'Cast'}
            </h2>
            <div className={styles.people}>
                {cast.map(p => (
                    p.Id ? (
                        <a key={p.Id} className={styles.person} href={`#/person?id=${p.Id}`}>
                            <div className={styles.personName}>{p.Name}</div>
                            {p.Role ? <div className={styles.personRole}>{p.Role}</div> : null}
                        </a>
                    ) : (
                        <div key={p.Name} className={`${styles.person} ${styles.personStatic}`}>
                            <div className={styles.personName}>{p.Name}</div>
                            {p.Role ? <div className={styles.personRole}>{p.Role}</div> : null}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};
