import React, { type FC } from 'react';
import { GridListItem } from 'react-aria-components';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { CardList } from 'apps/deskfin/components/media/CardList';
import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';
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
            <CardList aria-label={title} className={styles.peopleRow}>
                {people.map(p => {
                    const key = `${p.Id ?? p.Name}-${p.Type}-${p.Role ?? ''}`;
                    const imageUrl = buildPersonImageUrl(p);
                    const href = p.Id ? `#/details?id=${p.Id}` : undefined;

                    return (
                        <GridListItem
                            // The same person can appear more than once (e.g. as writer and director)
                            id={key}
                            key={key}
                            textValue={[p.Name, p.Role].filter(Boolean).join(', ')}
                            className={href ? styles.personCard : `${styles.personCard} ${styles.personCardStatic}`}
                            href={href}
                        >
                            <div className={styles.personThumb}>
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt='' // name is shown below
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
                        </GridListItem>
                    );
                })}
            </CardList>
        </div>
    );
};
