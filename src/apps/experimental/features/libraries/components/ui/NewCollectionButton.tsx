import React, { FC, useCallback } from 'react';
import Add from '@mui/icons-material/Add';

import globalize from 'lib/globalize';

import styles from './GridActionButton.module.scss';

const NewCollectionButton: FC = () => {
    const showCollectionEditor = useCallback(() => {
        import('components/collectionEditor/collectionEditor').then(
            ({ default: CollectionEditor }) => {
                const serverId = window.ApiClient.serverId();
                const collectionEditor = new CollectionEditor();
                collectionEditor.show({
                    items: [],
                    serverId: serverId
                }).catch(() => {
                    // closed collection editor
                });
            }).catch(err => {
            console.error('[NewCollection] failed to load collection editor', err);
        });
    }, []);

    return (
        <button
            type="button"
            className={styles.actionButton}
            title={globalize.translate('NewCollection')}
            onClick={showCollectionEditor}
        >
            <Add sx={{ fontSize: 18 }} />
            <span>{globalize.translate('NewCollection')}</span>
        </button>
    );
};

export default NewCollectionButton;
