import React, { FC, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ItemAction } from 'constants/itemAction';
import { useApi } from 'hooks/useApi';
import { getChannelQuery } from 'hooks/api/liveTvHooks/useGetChannel';
import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';
import itemHelper from 'components/itemHelper';
import SvgIcon from 'components/SvgIcon';
import { IconSvgs } from 'assets/icons';
import { Button, IconButton } from 'apps/experimental/components/shared';

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
    selectedSubtitleTrack
}) => {
    const apiContext = useApi();
    const queryClient = useQueryClient();

    const playOptions = useMemo(() => {
        if (itemHelper.supportsMediaSourceSelection(item)) {
            return {
                startPositionTicks:
                    item.UserData && isResumable ?
                        item.UserData.PlaybackPositionTicks :
                        0,
                mediaSourceId: selectedMediaSourceId,
                audioStreamIndex: selectedAudioTrack || null,
                subtitleStreamIndex: selectedSubtitleTrack
            };
        }
    }, [
        item,
        isResumable,
        selectedMediaSourceId,
        selectedAudioTrack,
        selectedSubtitleTrack
    ]);

    const onPlayClick = useCallback(async () => {
        if (item.Type === ItemKind.Program && item.ChannelId) {
            const channel = await queryClient.fetchQuery(
                getChannelQuery(apiContext, {
                    channelId: item.ChannelId
                })
            );
            playbackManager.play({
                items: [channel]
            }).catch(err => {
                console.error('[PlayOrResumeButton] failed to play', err);
            });
            return;
        }

        playbackManager.play({
            items: [item],
            ...playOptions
        }).catch(err => {
            console.error('[PlayOrResumeButton] failed to play', err);
        });
    }, [apiContext, item, playOptions, queryClient]);

    const onRestartClick = useCallback(() => {
        playbackManager.play({
            items: [ item ],
            startPositionTicks: 0,
            mediaSourceId: selectedMediaSourceId,
            audioStreamIndex: selectedAudioTrack || null,
            subtitleStreamIndex: selectedSubtitleTrack
        }).catch(err => {
            console.error('[PlayOrResumeButton] failed to restart', err);
        });
    }, [ item, selectedAudioTrack, selectedMediaSourceId, selectedSubtitleTrack ]);

    return (
        <div className='detailsPrimaryActions'>
            <Button
                data-action={isResumable ? ItemAction.Resume : ItemAction.Play}
                title={
                    isResumable ?
                        globalize.translate('ButtonResume') :
                        globalize.translate('Play')
                }
                onClick={onPlayClick}
                icon={<SvgIcon svg={IconSvgs.play} size={18} />}
            >
                {isResumable ? globalize.translate('ButtonResume', 'Continue') : globalize.translate('Play')}
            </Button>
            {isResumable && (
                <IconButton
                    title={globalize.translate('Restart', 'Restart')}
                    aria-label={globalize.translate('Restart', 'Restart')}
                    onClick={onRestartClick}
                    icon={<SvgIcon svg={IconSvgs.refresh} size={18} />}
                />
            )}
        </div>
    );
};

export default PlayOrResumeButton;
