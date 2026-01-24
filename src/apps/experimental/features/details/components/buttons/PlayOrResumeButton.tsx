import React, { FC, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ItemAction } from "constants/itemAction";
import { useApi } from "hooks/useApi";
import { getChannelQuery } from "hooks/api/liveTvHooks/useGetChannel";
import globalize from "lib/globalize";
import { playbackManager } from "components/playback/playbackmanager";
import type { ItemDto } from "types/base/models/item-dto";
import { ItemKind } from "types/base/models/item-kind";
import itemHelper from "components/itemHelper";
import SvgIcon from "components/SvgIcon";
import { IconSvgs } from "assets/icons";
import { Button } from "apps/experimental/components/button/Button";
import { IconButton } from "apps/experimental/components/button/IconButton";

interface PlayOrResumeButtonProps {
    item: ItemDto;
    isResumable?: boolean;
    selectedMediaSourceId?: string | null;
    selectedAudioTrack?: number;
    selectedSubtitleTrack?: number;
}

const PlayOrResumeButton: FC<PlayOrResumeButtonProps> = ({
    item,
    isResumable,
    selectedMediaSourceId,
    selectedAudioTrack,
    selectedSubtitleTrack,
}) => {
    const apiContext = useApi();
    const queryClient = useQueryClient();

    const playOptions = useMemo(() => {
        if (itemHelper.supportsMediaSourceSelection(item)) {
            return {
                startPositionTicks:
                    item.UserData && isResumable
                        ? item.UserData.PlaybackPositionTicks
                        : 0,
                mediaSourceId: selectedMediaSourceId,
                audioStreamIndex: selectedAudioTrack || null,
                subtitleStreamIndex: selectedSubtitleTrack,
            };
        }
    }, [
        item,
        isResumable,
        selectedMediaSourceId,
        selectedAudioTrack,
        selectedSubtitleTrack,
    ]);

    const onPlayClick = useCallback(async () => {
        if (item.Type === ItemKind.Program && item.ChannelId) {
            const channel = await queryClient.fetchQuery(
                getChannelQuery(apiContext, {
                    channelId: item.ChannelId,
                }),
            );
            playbackManager
                .play({
                    items: [channel],
                })
                .catch((err) => {
                    console.error("[PlayOrResumeButton] failed to play", err);
                });
            return;
        }

        playbackManager
            .play({
                items: [item],
                ...playOptions,
            })
            .catch((err) => {
                console.error("[PlayOrResumeButton] failed to play", err);
            });
    }, [apiContext, item, playOptions, queryClient]);

    const onRestartClick = useCallback(() => {
        playbackManager
            .play({
                items: [item],
                startPositionTicks: 0,
                mediaSourceId: selectedMediaSourceId,
                audioStreamIndex: selectedAudioTrack || null,
                subtitleStreamIndex: selectedSubtitleTrack,
            })
            .catch((err) => {
                console.error("[PlayOrResumeButton] failed to restart", err);
            });
    }, [
        item,
        selectedAudioTrack,
        selectedMediaSourceId,
        selectedSubtitleTrack,
    ]);

    return (
        <>
            <Button
                data-action={isResumable ? ItemAction.Resume : ItemAction.Play}
                aria-label={
                    isResumable
                        ? globalize.translate("ButtonResume")
                        : globalize.translate("Play")
                }
                onClick={onPlayClick}
            >
                {isResumable
                    ? globalize.translate("ButtonResume", "Continue")
                    : globalize.translate("Play")}
            </Button>
            {isResumable && (
                <IconButton
                    aria-label={globalize.translate("Restart", "Restart")}
                    onClick={onRestartClick}
                    icon={<SvgIcon svg={IconSvgs.refresh} size={20} />}
                />
            )}
        </>
    );
};

export default PlayOrResumeButton;
