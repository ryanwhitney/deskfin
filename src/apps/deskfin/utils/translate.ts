import globalize from 'lib/globalize';

/** Translates `key`, or returns `fallback` while the dictionary is still loading or if the key is unknown. */
export const translateOr = (key: string, fallback: string): string => {
    const value = globalize.translate(key);
    return value && value !== key ? value : fallback;
};
