import React, { type FC } from 'react';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import styles from '../../routes/DetailsRoute.module.scss';

interface Person {
    Id?: string | null;
    Name?: string | null;
    Role?: string | null;
    Type?: string | null;
    PrimaryImageTag?: string | null;
}

interface DetailsCastProps {
    title: string;
    people: Person[];
}

const buildPersonImageUrl = (person: Person): string => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !person.Id || !person.PrimaryImageTag) return '';

    return apiClient.getImageUrl(person.Id, {
        type: 'Primary',
        tag: person.PrimaryImageTag,
        maxWidth: 300
    });
};

export const DetailsCast: FC<DetailsCastProps> = ({ title, people }) => {
    if (!people.length) return null;

    return (
        <div className={styles.scrollSection}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <div className={styles.peopleRow}>
                {people.map((p, idx) => {
                    const imageUrl = buildPersonImageUrl(p);
                    const content = (
                        <>
                            <div className={styles.personThumb}>
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={p.Name || ''}
                                        className={styles.personImg}
                                    />
                                ) : (
                                    <span className={styles.personPlaceholder}>
                                        <SvgIcon svg={IconSvgs.avatar} size={40} />
                                    </span>
                                )}
                            </div>
                            <div className={styles.personMeta}>
                                <div className={styles.personName}>{p.Name}</div>
                                {p.Role && <div className={styles.personRole}>{p.Role}</div>}
                            </div>
                        </>
                    );

                    return p.Id ? (
                        <a
                            key={p.Id}
                            className={styles.personCard}
                            href={`#/details?id=${p.Id}`}
                        >
                            {content}
                        </a>
                    ) : (
                        <div
                            key={`${p.Name}-${idx}`}
                            className={`${styles.personCard} ${styles.personCardStatic}`}
                        >
                            {content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
