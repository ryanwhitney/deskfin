import type { LibraryTabContent, SectionsView } from 'types/libraryTabContent';
import { SectionType } from 'types/sections';

/*
 * Library tab/section presets used by deskfin. Upstream removed these from types/ when the
 * modern app moved to per-view config, so deskfin keeps its own copies.
 */

export type LibraryTabMapping = Record<number, LibraryTabContent>;

export const MovieSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SectionType.ContinueWatchingMovies,
        SectionType.LatestMovies
    ],
    isMovieRecommendations: true
};

export const TvShowSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SectionType.ContinueWatchingEpisode,
        SectionType.LatestEpisode,
        SectionType.NextUp
    ]
};

export const MusicSuggestionsSectionsView: SectionsView = {
    suggestionSections: [
        SectionType.LatestMusic,
        SectionType.FrequentlyPlayedMusic,
        SectionType.RecentlyPlayedMusic
    ]
};

export const ProgramSectionsView: SectionsView = {
    programSections: [
        SectionType.ActivePrograms,
        SectionType.UpcomingEpisodes,
        SectionType.UpcomingMovies,
        SectionType.UpcomingSports,
        SectionType.UpcomingKids,
        SectionType.UpcomingNews
    ]
};

export const RecordingsSectionsView: SectionsView = {
    programSections: [
        SectionType.LatestRecordings,
        SectionType.RecordingFolders
    ]
};

export const ScheduleSectionsView: SectionsView = {
    programSections: [SectionType.ActiveRecordings],
    isLiveTvUpcomingRecordings: true
};
