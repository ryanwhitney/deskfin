import type { RecommendationDto } from '@jellyfin/sdk/lib/generated-client/models/recommendation-dto';
import { RecommendationType } from '@jellyfin/sdk/lib/generated-client/models/recommendation-type';
import React, { type FC, useCallback } from 'react';

import {
    useGetMovieRecommendations,
    useGetSuggestionSectionsWithItems
} from 'hooks/useFetchItems';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import type { ParentId } from 'types/library';
import { type Section as SectionData, type SectionType, SectionType as SectionTypeEnum } from 'types/sections';
import type { ItemDto } from 'types/base/models/item-dto';

import { Section } from 'apps/deskfin/components/media/Section';
import { ItemGrid } from 'apps/deskfin/components/media/ItemGrid';

interface SuggestionsSectionViewProps {
    parentId: ParentId;
    sectionType: SectionType[];
    isMovieRecommendationEnabled: boolean | undefined;
}

const SuggestionsSectionView: FC<SuggestionsSectionViewProps> = ({
    parentId,
    sectionType,
    isMovieRecommendationEnabled = false
}) => {
    const { isLoading, data: sectionsWithItems, refetch } =
        useGetSuggestionSectionsWithItems(parentId, sectionType);

    const {
        isLoading: isRecommendationsLoading,
        data: movieRecommendationsItems,
        refetch: refetchRecommendations
    } = useGetMovieRecommendations(isMovieRecommendationEnabled, parentId);

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const onAfterAction = useCallback(() => {
        void refetch();
        void refetchRecommendations();
    }, [refetch, refetchRecommendations]);

    const onToggleFavorite = useCallback(async (item: ItemDto) => {
        await toggleFavorite({ itemId: item.Id!, isFavorite: !!item.UserData?.IsFavorite });
        onAfterAction();
    }, [onAfterAction, toggleFavorite]);

    const onTogglePlayed = useCallback(async (item: ItemDto) => {
        await togglePlayed({ itemId: item.Id!, isPlayed: !!item.UserData?.Played });
        onAfterAction();
    }, [onAfterAction, togglePlayed]);

    if (isLoading || isRecommendationsLoading) {
        return <Loading />;
    }

    if (!sectionsWithItems?.length && !movieRecommendationsItems?.length) {
        return <NoItemsMessage />;
    }

    const getRecommendationTitle = (recommendation: RecommendationDto) => {
        let title = '';

        switch (recommendation.RecommendationType) {
            case RecommendationType.SimilarToRecentlyPlayed:
                title = globalize.translate(
                    'RecommendationBecauseYouWatched',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.SimilarToLikedItem:
                title = globalize.translate(
                    'RecommendationBecauseYouLike',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.HasDirectorFromRecentlyPlayed:
            case RecommendationType.HasLikedDirector:
                title = globalize.translate(
                    'RecommendationDirectedBy',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.HasActorFromRecentlyPlayed:
            case RecommendationType.HasLikedActor:
                title = globalize.translate(
                    'RecommendationStarring',
                    recommendation.BaselineItemName
                );
                break;
        }
        return title;
    };

    // Determine card variant based on section type
    const getVariantForSection = (section: SectionData): 'portrait' | 'landscape' => {
        // Resumable sections typically show landscape/thumb images
        if (section.type === SectionTypeEnum.ContinueWatchingMovies ||
            section.type === SectionTypeEnum.ContinueWatchingEpisode ||
            section.type === SectionTypeEnum.RecentlyPlayedMusic) {
            return 'landscape';
        }
        return 'portrait';
    };

    return (
        <>
            {sectionsWithItems?.map(({ section, items }) => (
                <Section
                    key={section.type}
                    title={globalize.translate(section.name)}
                >
                    <ItemGrid
                        items={items}
                        variant={getVariantForSection(section)}
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        onAfterAction={onAfterAction}
                    />
                </Section>
            ))}

            {movieRecommendationsItems?.map((recommendation, index) => (
                <Section
                    key={`${recommendation.CategoryId}-${index}`}
                    title={getRecommendationTitle(recommendation)}
                    titleHref={undefined}
                >
                    <ItemGrid
                        items={recommendation.Items as ItemDto[]}
                        variant="portrait"
                        onToggleFavorite={onToggleFavorite}
                        onTogglePlayed={onTogglePlayed}
                        onAfterAction={onAfterAction}
                    />
                </Section>
            ))}
        </>
    );
};

export default SuggestionsSectionView;
