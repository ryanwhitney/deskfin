import React, { type FC } from 'react';
import {
    Link,
    URLSearchParamsInit,
    createSearchParams,
    useLocation,
    useSearchParams
} from 'react-router-dom';
import globalize from 'lib/globalize';
import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../../../assets/icons';

const getUrlParams = (searchParams: URLSearchParams) => {
    const parentId =
        searchParams.get('parentId') || searchParams.get('topParentId');
    const collectionType = searchParams.get('collectionType');
    const params: URLSearchParamsInit = {};

    if (parentId) {
        params.parentId = parentId;
    }

    if (collectionType) {
        params.collectionType = collectionType;
    }
    return params;
};

const SearchButton: FC = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const isSearchPath = location.pathname === '/search';
    const search = createSearchParams(getUrlParams(searchParams));
    const createSearchLink =
        {
            pathname: '/search',
            search: search ? `?${search}` : undefined
        };

    return (
        <Link
            aria-label={globalize.translate('Search')}
            to={createSearchLink}
            className='expToolbarIconButton'
            onClick={e => {
                if (isSearchPath) {
                    e.preventDefault();
                }
            }}
        >
            <JfIcon svg={IconSvgs.search} />
        </Link>
    );
};

export default SearchButton;
