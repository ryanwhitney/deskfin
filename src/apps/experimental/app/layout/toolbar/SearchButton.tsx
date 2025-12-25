import React, { type FC } from 'react';
import {
    URLSearchParamsInit,
    createSearchParams,
    useLocation,
    useSearchParams
} from 'react-router-dom';
import globalize from 'lib/globalize';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { ToolbarIconLink } from 'apps/experimental/components';

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
        <ToolbarIconLink
            aria-label={globalize.translate('Search')}
            to={createSearchLink}
            onClick={e => {
                if (isSearchPath) {
                    e.preventDefault();
                }
            }}
        >
            <SvgIcon svg={IconSvgs.search} size={18} />
        </ToolbarIconLink>
    );
};

export default SearchButton;
