import React, { type FC } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box';
import type {} from '@mui/material/themeCssVarsAugmentation';
import JfIcon from 'components/JfIcon';
import { IconSvgs } from '../../assets/icons';

interface StarIconsProps {
    className?: string;
    communityRating: number;
}

const StarIcons: FC<StarIconsProps> = ({ className, communityRating }) => {
    const cssClass = classNames(
        'mediaInfoItem',
        'starRatingContainer',
        className
    );

    return (
        <Box className={cssClass}>
            <span
                // Keep existing theme tint behavior.
                // eslint-disable-next-line react/jsx-no-bind
                style={{
                    color: 'var(--mui-palette-starIcon-main, #f5c84b)'
                }}
            >
                <JfIcon svg={IconSvgs.star} />
            </span>
            {communityRating.toFixed(1)}
        </Box>
    );
};

export default StarIcons;
