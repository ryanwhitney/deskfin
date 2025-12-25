import React, { type FC } from 'react';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';
import styles from '../../routes/DetailsRoute.module.scss';

interface Person {
    Id?: string | null;
    Name?: string | null;
    Role?: string | null;
    Type?: string | null;
}

interface DetailsFactsProps {
    item: ItemDto;
    directors: Person[];
    writers: Person[];
}

export const DetailsFacts: FC<DetailsFactsProps> = ({ item, directors, writers }) => {
    const hasGenres = !!(item.GenreItems?.length || item.Genres?.length);
    const hasDirectors = directors.length > 0;
    const hasWriters = writers.length > 0;

    if (!hasGenres && !hasDirectors && !hasWriters) return null;

    return (
        <div className={styles.facts}>
            {item.GenreItems?.length ? (
                <div className={styles.factRow}>
                    <div className={styles.factLabel}>{globalize.translate('Genres')}</div>
                    <div className={styles.factValue}>
                        {item.GenreItems.map(g => (
                            <a key={g.Id || g.Name} className={styles.tag} href={`#/genre?id=${g.Id}`}>
                                {g.Name}
                            </a>
                        ))}
                    </div>
                </div>
            ) : item.Genres?.length ? (
                <div className={styles.factRow}>
                    <div className={styles.factLabel}>{globalize.translate('Genres')}</div>
                    <div className={styles.factValue}>
                        {item.Genres.map(g => <span key={g} className={styles.tag}>{g}</span>)}
                    </div>
                </div>
            ) : null}

            {hasDirectors && (
                <div className={styles.factRow}>
                    <div className={styles.factLabel}>{globalize.translate('Director')}</div>
                    <div className={styles.factValue}>
                        {directors.map(p => (
                            p.Id ? (
                                <a key={p.Id} className={styles.tag} href={`#/person?id=${p.Id}`}>{p.Name}</a>
                            ) : (
                                <span key={p.Name} className={styles.tag}>{p.Name}</span>
                            )
                        ))}
                    </div>
                </div>
            )}

            {hasWriters && (
                <div className={styles.factRow}>
                    <div className={styles.factLabel}>{globalize.translate('Writer')}</div>
                    <div className={styles.factValue}>
                        {writers.map(p => (
                            p.Id ? (
                                <a key={p.Id} className={styles.tag} href={`#/person?id=${p.Id}`}>{p.Name}</a>
                            ) : (
                                <span key={p.Name} className={styles.tag}>{p.Name}</span>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
