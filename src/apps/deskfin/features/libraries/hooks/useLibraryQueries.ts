import type { AxiosRequestConfig } from 'axios';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api';
import { getMovieApi } from '@jellyfin/sdk/lib/utils/api/movie-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { getYearApi } from '@jellyfin/sdk/lib/utils/api/year-api';
import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ParentId } from 'types/library';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

import { groupsUpcomingEpisodes } from '../utils/upcomingEpisodes';

/*
 * Library queries used by deskfin that upstream removed from hooks/useFetchItems.
 * Kept here so upstream syncs don't conflict on them.
 */

const fetchGetMovieRecommendations = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getMovieApi(api).getMovieRecommendations(
            {
                userId: user.Id,
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.MediaSourceCount
                ],
                parentId: parentId ?? undefined,
                categoryLimit: 6,
                itemLimit: 20
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetMovieRecommendations = (isMovieRecommendationEnabled: boolean, parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['MovieRecommendations', isMovieRecommendationEnabled, parentId],
        queryFn: ({ signal }) => fetchGetMovieRecommendations(currentApi, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && isMovieRecommendationEnabled
    });
};

const fetchGetGenres = async (
    currentApi: JellyfinApiContext,
    itemType: BaseItemKind[],
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getGenreApi(api).getGenres(
            {
                userId: user.Id,
                sortBy: [ItemSortBy.SortName],
                sortOrder: [SortOrder.Ascending],
                includeItemTypes: itemType,
                enableTotalRecordCount: false,
                parentId: parentId ?? undefined
            },
            {
                signal: options?.signal
            }
        );
        return response.data as ItemDtoQueryResult;
    }
};

export const useGetGenres = (itemType: BaseItemKind[], parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Genres', parentId],
        queryFn: ({ signal }) =>
            fetchGetGenres(currentApi, itemType, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId
    });
};

const fetchGetYears = async (
    currentApi: JellyfinApiContext,
    itemType: BaseItemKind[],
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getYearApi(api).getYears(
            {
                userId: user.Id,
                sortBy: [ItemSortBy.SortName],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: itemType,
                parentId: parentId ?? undefined,
                recursive: true
            },
            {
                signal: options?.signal
            }
        );
        return response.data as ItemDtoQueryResult;
    }
};

export const useGetYears = (itemType: BaseItemKind[], parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['Years', parentId],
        queryFn: ({ signal }) =>
            fetchGetYears(currentApi, itemType, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId
    });
};

const fetchGetGroupsUpcomingEpisodes = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getShowApi(api).getUpcomingEpisodes(
            {
                userId: user.Id,
                limit: 25,
                fields: [ItemFields.AirTime],
                parentId: parentId ?? undefined,
                imageTypeLimit: 1,
                enableImageTypes: [
                    ImageType.Primary,
                    ImageType.Backdrop,
                    ImageType.Thumb
                ]
            },
            {
                signal: options?.signal
            }
        );
        const items = (response.data.Items as ItemDto[]) || [];

        return groupsUpcomingEpisodes(items);
    }
};

export const useGetGroupsUpcomingEpisodes = (parentId: ParentId) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['GroupsUpcomingEpisodes', parentId],
        queryFn: ({ signal }) =>
            fetchGetGroupsUpcomingEpisodes(currentApi, parentId, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId
    });
};
