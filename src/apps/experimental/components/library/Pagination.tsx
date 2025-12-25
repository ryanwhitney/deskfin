import React, { type FC, useCallback } from 'react';
import { Button } from 'react-aria-components';

import globalize from 'lib/globalize';
import type { LibraryViewSettings } from 'types/library';

import styles from './LibraryToolbar.module.scss';

interface PaginationProps {
    totalRecordCount: number;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
    isPlaceholderData?: boolean;
}

export const Pagination: FC<PaginationProps> = ({
    totalRecordCount,
    libraryViewSettings,
    setLibraryViewSettings,
    isPlaceholderData = false
}) => {
    const startIndex = libraryViewSettings.StartIndex || 0;
    // Use a default page size - this could be made configurable via user settings
    const limit = 100;

    const currentPage = Math.floor(startIndex / limit) + 1;
    const totalPages = Math.ceil(totalRecordCount / limit);

    const hasPrevious = startIndex > 0;
    const hasNext = startIndex + limit < totalRecordCount;

    const goToPage = useCallback((page: number) => {
        const newStartIndex = (page - 1) * limit;
        setLibraryViewSettings((prev) => ({
            ...prev,
            StartIndex: newStartIndex
        }));
    }, [limit, setLibraryViewSettings]);

    const goToPrevious = useCallback(() => {
        if (hasPrevious) {
            goToPage(currentPage - 1);
        }
    }, [hasPrevious, currentPage, goToPage]);

    const goToNext = useCallback(() => {
        if (hasNext) {
            goToPage(currentPage + 1);
        }
    }, [hasNext, currentPage, goToPage]);

    if (totalPages <= 1) {
        return null;
    }

    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + limit, totalRecordCount);

    return (
        <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
                {globalize.translate('ListPaging', startItem, endItem, totalRecordCount)}
            </span>
            <Button
                className={styles.paginationButton}
                onPress={goToPrevious}
                isDisabled={!hasPrevious || isPlaceholderData}
                aria-label={globalize.translate('Previous')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
            </Button>
            <Button
                className={styles.paginationButton}
                onPress={goToNext}
                isDisabled={!hasNext || isPlaceholderData}
                aria-label={globalize.translate('Next')}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
            </Button>
        </div>
    );
};

export default Pagination;
