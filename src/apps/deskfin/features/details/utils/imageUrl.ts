import { ServerConnections } from "lib/jellyfin-apiclient";
import type { ItemDto } from "types/base/models/item-dto";

export const buildImageUrl = (
    item: ItemDto | undefined,
    type: "Primary" | "Backdrop" | "logo",
    maxWidth = 900,
): string => {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient || !item?.Id) return "";

    const primaryTag = item.ImageTags?.Primary || item.PrimaryImageTag;
    const backdropTag = item.BackdropImageTags?.[0];
    const tag = type === "Primary" ? primaryTag : backdropTag;
    if (!tag) return "";

    return apiClient.getImageUrl(item.Id, {
        type,
        tag,
        maxWidth,
    });
};
