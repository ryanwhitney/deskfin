import React, { type FC, Fragment } from 'react';
import { FocusRing } from '@react-aria/focus';
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

const Separator = () => <span className={styles.factSeparator}>•</span>;

const PersonItem: FC<{ person: Person }> = ({ person }) => {
    if (person.Id) {
        return (
            <FocusRing focusRingClass='focus-ring'>
                <a className={styles.factItem} href={`#/details?id=${person.Id}`}>
                    {person.Name}
                </a>
            </FocusRing>
        );
    }
    return <span className={styles.factItem}>{person.Name}</span>;
};

const GenresRow: FC<{ item: ItemDto }> = ({ item }) => {
    if (item.GenreItems?.length) {
        return (
            <div className={styles.factRow}>
                <div className={styles.factLabel}>{globalize.translate('Genres')}</div>
                <div className={styles.factValue}>
                    {item.GenreItems.map((g, i) => (
                        <Fragment key={g.Id || g.Name}>
                            {i > 0 && <Separator />}
                            <FocusRing focusRingClass='focus-ring'>
                                <a className={styles.factItem} href={`#/genre?id=${g.Id}`}>
                                    {g.Name}
                                </a>
                            </FocusRing>
                        </Fragment>
                    ))}
                </div>
            </div>
        );
    }

    if (item.Genres?.length) {
        return (
            <div className={styles.factRow}>
                <div className={styles.factLabel}>{globalize.translate('Genres')}</div>
                <div className={styles.factValue}>
                    {item.Genres.map((g, i) => (
                        <Fragment key={g}>
                            {i > 0 && <Separator />}
                            <span className={styles.factItem}>{g}</span>
                        </Fragment>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

export const DetailsFacts: FC<DetailsFactsProps> = ({ item, directors, writers }) => {
    const hasGenres = !!(item.GenreItems?.length || item.Genres?.length);
    const hasDirectors = directors.length > 0;
    const hasWriters = writers.length > 0;

    if (!hasGenres && !hasDirectors && !hasWriters) return null;

    return (
        <div className={styles.facts}>
            <GenresRow item={item} />

            {hasDirectors && (
                <div className={styles.factRow}>
                    <div className={styles.factLabel}>{globalize.translate('Director')}</div>
                    <div className={styles.factValue}>
                        {directors.map((p, i) => (
                            <Fragment key={p.Id || p.Name}>
                                {i > 0 && <Separator />}
                                <PersonItem person={p} />
                            </Fragment>
                        ))}
                    </div>
                </div>
            )}

            {hasWriters && (
                <div className={styles.factRow}>
                    <div className={styles.factLabel}>{globalize.translate('Writer')}</div>
                    <div className={styles.factValue}>
                        {writers.map((p, i) => (
                            <Fragment key={p.Id || p.Name}>
                                {i > 0 && <Separator />}
                                <PersonItem person={p} />
                            </Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
