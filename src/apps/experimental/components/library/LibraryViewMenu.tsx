import React, { type FC, type Key } from "react";
import { Tabs, TabList, Tab } from "react-aria-components";
import { useLocation, useSearchParams } from "react-router-dom";

import { LibraryRoutes } from "apps/experimental/features/libraries/constants/libraryRoutes";
import useCurrentTab from "hooks/useCurrentTab";
import globalize from "lib/globalize";

import styles from "./LibraryToolbar.module.scss";

export const LibraryViewMenu: FC = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { activeTab } = useCurrentTab();

    const currentRoute = LibraryRoutes.find(
        ({ path }) => path === location.pathname
    );

    if (!currentRoute) return null;

    const onSelectionChange = (key: Key) => {
        searchParams.set("tab", String(key));
        setSearchParams(searchParams);
    };

    return (
        <Tabs
            id="currentRoute"
            selectedKey={String(activeTab)}
            onSelectionChange={onSelectionChange}
            className={styles.tabs}
        >
            <TabList className={styles.tabList} aria-label="Library sections">
                {currentRoute.views.map((tab) => (
                    <Tab
                        key={tab.index}
                        id={String(tab.index)}
                        className={styles.tab}
                    >
                        {globalize.translate(tab.label)}
                    </Tab>
                ))}
            </TabList>
        </Tabs>
    );
};

export default LibraryViewMenu;
