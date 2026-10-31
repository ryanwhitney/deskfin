import React, { type FC } from 'react';
import classNames from 'classnames';
import SvgIcon from 'apps/deskfin/components/icons/SvgIcon';
import { IconSvgs } from 'apps/deskfin/assets/icons';

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
