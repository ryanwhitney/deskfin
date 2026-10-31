/** A count that may arrive as a number or a numeric string; 0 otherwise. */
export const toCount = (raw: unknown): number => {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') return parseInt(raw, 10);
    return 0;
};
