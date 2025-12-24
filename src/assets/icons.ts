// Centralized SVG icon imports.
// We import both URL (for e.g. <img>/background-image) and RAW SVG (for inline + currentColor tinting).
// NOTE: Filenames contain spaces; keep imports explicit.

import iconHome from './img/icons/home.svg';
import iconSearch from './img/icons/search.svg';
import iconSettings from './img/icons/settings.svg';
import iconAvatar from './img/icons/avatar.svg';
import iconDashboard from './img/icons/dashboard.svg';
import iconControls from './img/icons/controls.svg';
import iconPlayback from './img/icons/playback.svg';
import iconLiveTv from './img/icons/live tv.svg';
import iconCollection from './img/icons/collection.svg';
import iconMovie from './img/icons/movie.svg';
import iconTv from './img/icons/tv.svg';
import iconHeart from './img/icons/heart.svg';
import iconStar from './img/icons/star.svg';
import iconCheckmark from './img/icons/checkmark 1.svg';
import iconEllipsis from './img/icons/ellipsis 1.svg';
import iconPlay from './img/icons/play.fill 1.svg';
import iconChevronDown from './img/icons/chevron.down 1.svg';
import iconCopy from './img/icons/copy.svg';
import iconDelete from './img/icons/delete.svg';
import iconDownload from './img/icons/download.svg';
import iconEdit from './img/icons/edit.svg';
import iconEditSubtitle from './img/icons/edit subtitle.svg';
import iconClosedCaptioning from './img/icons/closed captioning.svg';
import iconRefresh from './img/icons/refresh.svg';
import iconAddTo from './img/icons/add to.svg';
import iconInfo from './img/icons/info.svg';
import iconPhoto from './img/icons/photo.svg';
import iconQuickConnect from './img/icons/quick connect.svg';
import iconSignOut from './img/icons/sign out.svg';
import iconMacMini from './img/icons/mac mini.svg';

import iconHomeRaw from './img/icons/home.svg?raw';
import iconSearchRaw from './img/icons/search.svg?raw';
import iconSettingsRaw from './img/icons/settings.svg?raw';
import iconAvatarRaw from './img/icons/avatar.svg?raw';
import iconDashboardRaw from './img/icons/dashboard.svg?raw';
import iconControlsRaw from './img/icons/controls.svg?raw';
import iconPlaybackRaw from './img/icons/playback.svg?raw';
import iconLiveTvRaw from './img/icons/live tv.svg?raw';
import iconCollectionRaw from './img/icons/collection.svg?raw';
import iconMovieRaw from './img/icons/movie.svg?raw';
import iconTvRaw from './img/icons/tv.svg?raw';
import iconHeartRaw from './img/icons/heart.svg?raw';
import iconStarRaw from './img/icons/star.svg?raw';
import iconCheckmarkRaw from './img/icons/checkmark 1.svg?raw';
import iconEllipsisRaw from './img/icons/ellipsis 1.svg?raw';
import iconPlayRaw from './img/icons/play.fill 1.svg?raw';
import iconChevronDownRaw from './img/icons/chevron.down 1.svg?raw';
import iconCopyRaw from './img/icons/copy.svg?raw';
import iconDeleteRaw from './img/icons/delete.svg?raw';
import iconDownloadRaw from './img/icons/download.svg?raw';
import iconEditRaw from './img/icons/edit.svg?raw';
import iconEditSubtitleRaw from './img/icons/edit subtitle.svg?raw';
import iconClosedCaptioningRaw from './img/icons/closed captioning.svg?raw';
import iconRefreshRaw from './img/icons/refresh.svg?raw';
import iconAddToRaw from './img/icons/add to.svg?raw';
import iconInfoRaw from './img/icons/info.svg?raw';
import iconPhotoRaw from './img/icons/photo.svg?raw';
import iconQuickConnectRaw from './img/icons/quick connect.svg?raw';
import iconSignOutRaw from './img/icons/sign out.svg?raw';
import iconMacMiniRaw from './img/icons/mac mini.svg?raw';

export const Icons = {
    home: iconHome,
    search: iconSearch,
    settings: iconSettings,
    avatar: iconAvatar,
    dashboard: iconDashboard,
    controls: iconControls,
    playback: iconPlayback,
    liveTv: iconLiveTv,
    collection: iconCollection,
    movie: iconMovie,
    tv: iconTv,
    heart: iconHeart,
    star: iconStar,
    checkmark: iconCheckmark,
    ellipsis: iconEllipsis,
    play: iconPlay,
    chevronDown: iconChevronDown,
    copy: iconCopy,
    delete: iconDelete,
    download: iconDownload,
    edit: iconEdit,
    editSubtitle: iconEditSubtitle,
    closedCaptioning: iconClosedCaptioning,
    refresh: iconRefresh,
    addTo: iconAddTo,
    info: iconInfo,
    photo: iconPhoto,
    quickConnect: iconQuickConnect,
    signOut: iconSignOut,
    macMini: iconMacMini
} as const;

// Light normalization: ensure viewBox, strip width/height, tint to currentColor.
const toCurrentColorSvg = (svg: string) => {
    let out = svg;

    if (out.startsWith('<svg') && !out.includes('viewBox=')) {
        const widthMatch = out.match(/\swidth="([\d.]+)"/);
        const heightMatch = out.match(/\sheight="([\d.]+)"/);
        if (widthMatch?.[1] && heightMatch?.[1]) {
            out = out.replace('<svg', `<svg viewBox="0 0 ${widthMatch[1]} ${heightMatch[1]}"`);
        }
    }

    out = out.replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '');
    out = out.replace(/\sfill="(?!none)[^"]*"/g, ' fill="currentColor"');
    out = out.replace(/\sstroke="(?!none)[^"]*"/g, ' stroke="currentColor"');
    if (!/fill="/.test(out) && !/stroke="/.test(out) && out.startsWith('<svg')) {
        out = out.replace('<svg', '<svg fill="currentColor"');
    }

    return out;
};

const BaseIconSvgs = {
    home: toCurrentColorSvg(iconHomeRaw),
    search: toCurrentColorSvg(iconSearchRaw),
    settings: toCurrentColorSvg(iconSettingsRaw),
    avatar: toCurrentColorSvg(iconAvatarRaw),
    dashboard: toCurrentColorSvg(iconDashboardRaw),
    controls: toCurrentColorSvg(iconControlsRaw),
    playback: toCurrentColorSvg(iconPlaybackRaw),
    liveTv: toCurrentColorSvg(iconLiveTvRaw),
    collection: toCurrentColorSvg(iconCollectionRaw),
    movie: toCurrentColorSvg(iconMovieRaw),
    tv: toCurrentColorSvg(iconTvRaw),
    heart: toCurrentColorSvg(iconHeartRaw),
    star: toCurrentColorSvg(iconStarRaw),
    checkmark: toCurrentColorSvg(iconCheckmarkRaw),
    ellipsis: toCurrentColorSvg(iconEllipsisRaw),
    play: toCurrentColorSvg(iconPlayRaw),
    chevronDown: toCurrentColorSvg(iconChevronDownRaw),
    copy: toCurrentColorSvg(iconCopyRaw),
    delete: toCurrentColorSvg(iconDeleteRaw),
    download: toCurrentColorSvg(iconDownloadRaw),
    edit: toCurrentColorSvg(iconEditRaw),
    editSubtitle: toCurrentColorSvg(iconEditSubtitleRaw),
    closedCaptioning: toCurrentColorSvg(iconClosedCaptioningRaw),
    refresh: toCurrentColorSvg(iconRefreshRaw),
    addTo: toCurrentColorSvg(iconAddToRaw),
    info: toCurrentColorSvg(iconInfoRaw),
    photo: toCurrentColorSvg(iconPhotoRaw),
    quickConnect: toCurrentColorSvg(iconQuickConnectRaw),
    signOut: toCurrentColorSvg(iconSignOutRaw),
    macMini: toCurrentColorSvg(iconMacMiniRaw)
};

// Manual overrides for complex multi-path icons to avoid masking/clip issues.
const OverrideIconSvgs = {
    home: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.57202 17.3836V12.5028C7.57202 12.1209 7.82935 11.8719 8.21118 11.8719H11.4236C11.8137 11.8719 12.0544 12.1209 12.0544 12.5028V17.3836H7.57202ZM2.49194 16.8939C2.49194 18.0477 3.18921 18.72 4.35962 18.72H15.2751C16.4456 18.72 17.1345 18.0477 17.1345 16.8939V10.303L10.3113 4.58377C9.9959 4.31815 9.62231 4.32645 9.31519 4.58377L2.49194 10.303V16.8939ZM0.615967 10.1287C0.848389 10.1287 1.03931 10.0042 1.21362 9.86307L9.52271 2.88211C9.61401 2.80741 9.72192 2.7659 9.81323 2.7659C9.9128 2.7659 10.0125 2.80741 10.1038 2.88211L18.4211 9.86307C18.5872 10.0042 18.7781 10.1287 19.0105 10.1287C19.4587 10.1287 19.7244 9.80496 19.7244 9.46463C19.7244 9.27371 19.6497 9.0745 19.4587 8.92508L10.8093 1.6619C10.4939 1.39627 10.1536 1.26346 9.81323 1.26346C9.4729 1.26346 9.13257 1.39627 8.81714 1.6619L0.167725 8.92508C-0.0148926 9.0745 -0.0979004 9.27371 -0.0979004 9.46463C-0.0979004 9.80496 0.167725 10.1287 0.615967 10.1287ZM15.217 5.72098L17.3005 7.48075V3.73709C17.3005 3.37186 17.0681 3.13944 16.7029 3.13944H15.8147C15.4578 3.13944 15.217 3.37186 15.217 3.73709V5.72098Z" fill="currentColor"/></svg>',
    tv: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1.57056 15.4826H18.056C19.3841 15.4826 20.1893 14.6691 20.1893 13.3493V3.82834C20.1893 2.50851 19.3841 1.69504 18.056 1.69504H1.57056C0.250733 1.69504 -0.562744 2.50851 -0.562744 3.82834V13.3493C-0.562744 14.6691 0.250733 15.4826 1.57056 15.4826ZM1.59546 14.1462C1.08081 14.1462 0.773686 13.839 0.773686 13.3327V3.84494C0.773686 3.33859 1.08081 3.03147 1.59546 3.03147H18.0311C18.5457 3.03147 18.8528 3.33859 18.8528 3.84494V13.3327C18.8528 13.839 18.5457 14.1462 18.0311 14.1462H1.59546ZM5.63794 18.2966H13.9886C14.3538 18.2966 14.6609 17.9977 14.6609 17.6242C14.6609 17.2507 14.3538 16.9518 13.9886 16.9518H5.63794C5.27271 16.9518 4.96558 17.2507 4.96558 17.6242C4.96558 17.9977 5.27271 18.2966 5.63794 18.2966Z" fill="currentColor"/></svg>',
    liveTv: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1.57056 15.4826H18.056C19.3841 15.4826 20.1893 14.6691 20.1893 13.3493V3.82834C20.1893 2.50851 19.3841 1.69504 18.056 1.69504H1.57056C0.250733 1.69504 -0.562744 2.50851 -0.562744 3.82834V13.3493C-0.562744 14.6691 0.250733 15.4826 1.57056 15.4826ZM1.59546 14.1462C1.08081 14.1462 0.773686 13.839 0.773686 13.3327V3.84494C0.773686 3.33859 1.08081 3.03147 1.59546 3.03147H18.0311C18.5457 3.03147 18.8528 3.33859 18.8528 3.84494V13.3327C18.8528 13.839 18.5457 14.1462 18.0311 14.1462H1.59546ZM5.63794 18.2966H13.9886C14.3538 18.2966 14.6609 17.9977 14.6609 17.6242C14.6609 17.2507 14.3538 16.9518 13.9886 16.9518H5.63794C5.27271 16.9518 4.96558 17.2507 4.96558 17.6242C4.96558 17.9977 5.27271 18.2966 5.63794 18.2966Z" fill="currentColor"/><path d="M7.12378 12.0295C7.12378 12.4777 7.59693 12.6354 7.95386 12.4279L13.7146 9.03293C14.0633 8.82541 14.055 8.35227 13.7063 8.15305L7.95386 4.76633C7.59693 4.55881 7.12378 4.71652 7.12378 5.16477V12.0295Z" fill="currentColor"/></svg>',
    collection: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.0388 4.1604V4.30151H6.19409C3.82837 4.30151 2.45874 5.66284 2.45874 8.00366V14.5613H2.09351C0.358639 14.5613 -0.512939 13.7063 -0.512939 11.9881V4.1604C-0.512939 2.45044 0.358639 1.58716 2.09351 1.58716H13.4324C15.1672 1.58716 16.0388 2.45044 16.0388 4.1604Z" fill="currentColor"/><path d="M20.1394 8.00366V15.8313C20.1394 17.5413 19.2678 18.4046 17.533 18.4046H6.19409C4.45923 18.4046 3.58765 17.5496 3.58765 15.8313V8.00366C3.58765 6.2937 4.45923 5.43042 6.19409 5.43042H17.533C19.2678 5.43042 20.1394 6.2937 20.1394 8.00366ZM9.51439 8.91675V14.9183C9.51439 15.3084 9.92119 15.4578 10.2366 15.2669L15.2752 12.3035C15.574 12.1209 15.5657 11.7059 15.2669 11.5398L10.2366 8.56811C9.92119 8.3855 9.51439 8.52661 9.51439 8.91675Z" fill="currentColor"/></svg>',
    addTo: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.0388 4.1604V4.30151H6.19409C3.82837 4.30151 2.45874 5.66284 2.45874 8.00366V14.5613H2.09351C0.358639 14.5613 -0.512939 13.7063 -0.512939 11.9881V4.1604C-0.512939 2.45044 0.358639 1.58716 2.09351 1.58716H13.4324C15.1672 1.58716 16.0388 2.45044 16.0388 4.1604Z" fill="currentColor"/><path d="M20.1394 8.00366V15.8313C20.1394 17.5413 19.2678 18.4046 17.533 18.4046H6.19409C4.45923 18.4046 3.58765 17.5496 3.58765 15.8313V8.00366C3.58765 6.2937 4.45923 5.43042 6.19409 5.43042H17.533C19.2678 5.43042 20.1394 6.2937 20.1394 8.00366ZM11.1497 8.67602V11.1912H8.63452C8.19458 11.1912 7.89575 11.4817 7.89575 11.9217C7.89575 12.3367 8.20288 12.6272 8.63452 12.6272H11.1497V15.1507C11.1497 15.574 11.4319 15.8812 11.8552 15.8812C12.2869 15.8812 12.5857 15.574 12.5857 15.1507V12.6272H15.1091C15.5325 12.6272 15.8396 12.3367 15.8396 11.9217C15.8396 11.4817 15.5325 11.1912 15.1091 11.1912H12.5857V8.67602C12.5857 8.23608 12.2869 7.93725 11.8552 7.93725C11.4319 7.93725 11.1497 8.24438 11.1497 8.67602Z" fill="currentColor"/></svg>',
    movie: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.2593 1.31324L18.4751 2.12672C18.6992 2.9983 18.2842 3.75367 17.3711 3.9944L8.25683 6.43483H17.9688C18.9067 6.43483 19.5044 7.03248 19.5044 7.95387V15.6985C19.5044 17.3255 18.6826 18.1555 17.0142 18.1555H3.36767C1.70751 18.1555 0.869136 17.3338 0.869136 15.6985V8.42701L0.246577 6.1443C-0.168462 4.57545 0.437495 3.55445 2.02294 3.12281L15.2046 -0.421616C16.7983 -0.844956 17.8525 -0.272202 18.2593 1.31324ZM6.23144 7.72975L4.06494 7.82936L2.87792 10.0374H5.60888L6.854 7.72975H6.23144ZM9.38574 7.72975L8.14892 10.0374H11.0791L12.3242 7.72975H9.38574ZM14.856 7.72975L13.6191 10.0374H16.3418L17.5869 7.72975H14.856ZM3.10205 4.17701L2.47949 6.72535L5.12744 6.01149L5.72509 3.46315L3.10205 4.17701ZM8.18212 2.80738L7.58447 5.35572L10.415 4.60865L11.0127 2.05201L8.18212 2.80738ZM15.4619 0.848403L13.4614 1.39625L12.8555 3.94459L15.4951 3.23903L16.0845 0.707293C15.8853 0.748793 15.6777 0.790293 15.4619 0.848403Z" fill="currentColor"/></svg>',
    copy: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.3491 4.45093C12.3491 5.31421 12.8472 5.80395 13.7105 5.80395H18.3008V13.6814C18.3008 15.408 17.4458 16.2879 15.7276 16.2879H15.4121V11.2659C15.4204 10.0706 15.0552 9.11596 14.2915 8.33569L9.85889 3.82007C9.01221 2.94848 8.09082 2.55835 6.7959 2.55835H5.35157V2.0852C5.35157 0.458252 6.21485 -0.454838 7.92481 -0.454838H12.3491V4.45093ZM14.1753 0.400142L17.6865 3.97778C17.9854 4.26831 18.1597 4.50073 18.2095 4.76636H13.8682C13.5362 4.76636 13.4033 4.62524 13.4033 4.28491L13.395 -0.114498C13.6524 -0.0812979 13.8931 0.101322 14.1753 0.400142Z" fill="currentColor"/><path d="M8.47266 10.1287H14.1338C14.0425 9.80496 13.8516 9.50606 13.4864 9.12426L9.05371 4.60864C8.68018 4.23511 8.36475 3.98608 8.04932 3.89477V9.70536C8.04932 9.98756 8.19043 10.1287 8.47266 10.1287ZM3.89893 20.43H11.7017C13.4199 20.43 14.2749 19.5501 14.2749 17.8235V11.2659H8.48096C7.41016 11.2659 6.91211 10.7596 6.91211 9.69706V3.68725H3.89893C2.18897 3.68725 1.32569 4.55884 1.32569 6.2937V17.8235C1.32569 19.5584 2.18897 20.43 3.89893 20.43Z" fill="currentColor"/></svg>',
    photo: '<svg viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2.57495 17.0599H16.487C17.9895 17.0599 18.7449 16.2215 18.7449 14.6278L13.8142 9.99588C13.449 9.65555 13.009 9.48123 12.5608 9.48123C12.1042 9.48123 11.6975 9.63895 11.3157 9.97928L7.56372 13.3328L6.02807 11.9466C5.67944 11.6311 5.29761 11.4734 4.90747 11.4734C4.53393 11.4734 4.177 11.6228 3.83667 11.9383L0.674072 14.7938C0.723877 16.2962 1.33813 17.0599 2.57495 17.0599ZM2.63306 17.6409H16.9934C18.7366 17.6409 19.5998 16.786 19.5998 15.076V4.9324C19.5998 3.22244 18.7366 2.35916 16.9934 2.35916H2.63306C0.898193 2.35916 0.0266113 3.22244 0.0266113 4.9324V15.076C0.0266113 16.786 0.898193 17.6409 2.63306 17.6409ZM2.64966 16.3045C1.81958 16.3045 1.36304 15.8646 1.36304 15.0013V5.00711C1.36304 4.14383 1.81958 3.69559 2.64966 3.69559H16.9768C17.7986 3.69559 18.2634 4.14383 18.2634 5.00711V15.0013C18.2634 15.8646 17.7986 16.3045 16.9768 16.3045H2.64966Z" fill="currentColor"/><path d="M6.21069 10.0789C7.28149 10.0789 8.16138 9.199 8.16138 8.1199C8.16138 7.0491 7.28149 6.16092 6.21069 6.16092C5.13159 6.16092 4.25171 7.0491 4.25171 8.1199C4.25171 9.199 5.13159 10.0789 6.21069 10.0789Z" fill="currentColor"/></svg>'
};

export const IconSvgs = { ...BaseIconSvgs, ...OverrideIconSvgs } as const;
/**
 * Map legacy Material icon names (used by `itemContextMenu`) to local SVGs.
 * Return undefined for missing icons so we can list them and fall back gracefully.
 */
export function getLegacyCommandIcon(name: string | undefined): string | undefined {
    if (!name) return undefined;
    switch (name) {
        case 'play_arrow':
            return IconSvgs.play;
        case 'file_download':
            return IconSvgs.download;
        case 'content_copy':
            return IconSvgs.copy;
        case 'delete':
            return IconSvgs.delete;
        case 'edit':
            return IconSvgs.edit;
        case 'image':
            return IconSvgs.photo;
        case 'closed_caption':
            return IconSvgs.closedCaptioning;
        case 'refresh':
            return IconSvgs.refresh;
        case 'playlist_add':
            return IconSvgs.addTo;
        case 'library_add':
            return IconSvgs.addTo;
        case 'playlist_add_check':
            return IconSvgs.collection;
        case 'video_library':
        case 'collections':
        case 'collection':
            return IconSvgs.collection;
        case 'library_add_check':
            return IconSvgs.checkmark;
        case 'info':
            return IconSvgs.info;
        case 'person':
            return IconSvgs.avatar;
        // Best-effort fallbacks
        case 'playlist_remove':
            return IconSvgs.delete;
        case 'explore':
            return IconSvgs.info;
        case 'stop':
        case 'clear_all':
            return IconSvgs.controls;
        case 'fiber_manual_record':
            return IconSvgs.liveTv;
        default:
            return undefined;
    }
}


