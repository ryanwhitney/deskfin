import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../assets/icons';

interface CaptionMediaInfoProps {
    className?: string;
}

const CaptionMediaInfo: FC<CaptionMediaInfoProps> = ({ className }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'closedCaptionMediaInfoText',
        className
    );

    return (
        <Box className={cssClass}>
            <JfIcon svg={IconSvgs.closedCaptioning} />
        </Box>
    );
};

export default CaptionMediaInfo;
