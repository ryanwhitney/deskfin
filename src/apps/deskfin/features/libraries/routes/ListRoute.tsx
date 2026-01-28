import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";

import Page from "components/Page";
import globalize from "lib/globalize";
import { ServerConnections } from "lib/jellyfin-apiclient";
import { useItem } from "hooks/useItem";
import { PlaylistView } from "apps/deskfin/features/watchlist/components/PlaylistView";

/**
 * Compatibility route for legacy `#/list?parentId=...`.
 * Also handles playlist viewing via `?id=...`.
 * Redirects into the correct modern library page whenever possible.
 */
export default function ListRoute() {
    const [params] = useSearchParams();
    const playlistId = params.get("id") || "";
    const parentId = params.get("topParentId") || params.get("parentId") || "";
    const genreId = params.get("genreId") || "";
    const musicGenreId = params.get("musicGenreId") || "";
    const studioId = params.get("studioId") || "";

    // If we have a playlist ID, show the playlist view
    if (playlistId) {
        return <PlaylistView playlistId={playlistId} />;
    }

    // If we have a genreId/studioId/musicGenreId, we need to redirect to the legacy list
    // controller which handles these special item types properly
    const hasSpecialFilter = genreId || musicGenreId || studioId;

    const { data: parent, isLoading } = useItem(parentId || undefined);

    if (!parentId && !hasSpecialFilter) {
        return (
            <Page id="listPage" className="mainAnimatedPage libraryPage">
                {globalize.tryTranslate?.("MessageNoItemsAvailable") ??
                    "No items available"}
            </Page>
        );
    }

    // For genre/studio links, redirect to legacy list which handles them properly
    if (hasSpecialFilter) {
        const serverId =
            params.get("serverId") ||
            ServerConnections.currentApiClient()?.serverId() ||
            "";
        const serverIdParam = serverId
            ? `&serverId=${encodeURIComponent(serverId)}`
            : "";
        const parentIdParam = parentId
            ? `&parentId=${encodeURIComponent(parentId)}`
            : "";
        const genreParam = genreId
            ? `&genreId=${encodeURIComponent(genreId)}`
            : "";
        const musicGenreParam = musicGenreId
            ? `&musicGenreId=${encodeURIComponent(musicGenreId)}`
            : "";
        const studioParam = studioId
            ? `&studioId=${encodeURIComponent(studioId)}`
            : "";

        // Build URL without leading &
        const queryParams = [
            parentIdParam,
            genreParam,
            musicGenreParam,
            studioParam,
            serverIdParam,
        ]
            .filter(Boolean)
            .join("")
            .replace(/^&/, "");

        return <Navigate replace to={`/legacylist?${queryParams}`} />;
    }

    if (isLoading) {
        return (
            <Page id="listPage" className="mainAnimatedPage libraryPage"></Page>
        );
    }

    const collectionType = parent?.CollectionType;

    if (collectionType === CollectionType.Movies) {
        return <Navigate replace to={`/movies?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Tvshows) {
        return <Navigate replace to={`/tv?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Music) {
        return <Navigate replace to={`/music?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Homevideos) {
        return <Navigate replace to={`/homevideos?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Books) {
        return <Navigate replace to={`/books?topParentId=${parentId}`} />;
    }
    if (collectionType === CollectionType.Livetv) {
        return <Navigate replace to={"/livetv"} />;
    }
    if (collectionType === CollectionType.Boxsets) {
        return (
            <Navigate
                replace
                to={`/collections?topParentId=${parentId}&collectionType=${CollectionType.Boxsets}`}
            />
        );
    }

    // Unknown / legacy library type: fall back to the legacy list ViewManager route.
    // (We can add a generic React "folder browser" later once we inventory remaining collection types.)
    const serverId = ServerConnections.currentApiClient()?.serverId();
    const serverIdParam = serverId
        ? `&serverId=${encodeURIComponent(serverId)}`
        : "";
    return (
        <Navigate
            replace
            to={`/legacylist?parentId=${encodeURIComponent(
                parentId
            )}${serverIdParam}`}
        />
    );
}
