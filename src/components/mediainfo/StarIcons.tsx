import React, { type FC } from 'react';
import classNames from 'classnames';
import SvgIcon from 'components/SvgIcon';
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
        <div className={cssClass}>
            <span
                // Keep existing theme tint behavior.
                // eslint-disable-next-line react/jsx-no-bind
                style={{
                    color: 'var(--mui-palette-starIcon-main, #f5c84b)',
                    height: 16
                }}
            >
                <SvgIcon svg={IconSvgs.star} size={12} />
            </span>
            {communityRating.toFixed(1)}
        </div>
    );
};

export default StarIcons;
