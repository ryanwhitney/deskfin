import React, { type FC, type Key } from "react";
import {
    Tabs,
    TabList,
    Tab as RACTab,
    TabProps,
    composeRenderProps,
    SelectionIndicator
} from "react-aria-components";
import { useLocation, useSearchParams } from "react-router-dom";

import { LibraryRoutes } from "apps/experimental/features/libraries/constants/libraryRoutes";
import globalize from "lib/globalize";

import styles from "./LibraryToolbar.module.scss";

// Custom Tab wrapper with SelectionIndicator (per React Aria docs)
function Tab(props: TabProps) {
    return (
        <RACTab {...props} className={styles.tab}>
            {composeRenderProps(props.children, (children) => (
                <>
                    <span className={styles.tabLabel}>{children}</span>
                    <SelectionIndicator className={styles.indicator} />
                </>
            ))}
        </RACTab>
    );
}

export const LibraryViewMenu: FC = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get("tab") || "0";

    const currentRoute = LibraryRoutes.find(
        ({ path }) => path === location.pathname
    );

    if (!currentRoute) return null;

    const onSelectionChange = (key: Key) => {
        searchParams.set("tab", String(key));
        setSearchParams(searchParams, { replace: true });
    };

    return (
        <Tabs
            id="currentRoute"
            selectedKey={activeTab}
            onSelectionChange={onSelectionChange}
            className={styles.tabs}
        >
            <TabList className={styles.tabList} aria-label="Library sections">
                {currentRoute.views.map((tab) => (
                    <Tab key={tab.index} id={String(tab.index)}>
                        {globalize.translate(tab.label)}
                    </Tab>
                ))}
            </TabList>
        </Tabs>
    );
};

export default LibraryViewMenu;
