import React, { type FC } from 'react';
import classNames from 'classnames';
import SvgIcon from 'components/SvgIcon';
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
        <div className={cssClass}>
            <SvgIcon svg={IconSvgs.closedCaptioning} size={14} />
        </div>
    );
};

export default CaptionMediaInfo;
