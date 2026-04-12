import React, { useState, useMemo, Suspense, useCallback, useEffect, startTransition } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import DashboardErrorBoundary from "./components/shared/DashboardErrorBoundary";
import { DashboardKpiSkeleton, DashboardOverviewSkeleton, DashboardTableSkeleton } from "./components/shared/DashboardAsyncState";
import { DASHBOARD_DEFAULT_TAB, DASHBOARD_TABS, DASHBOARD_TAB_IDS } from "./config/tabs.config";
import "./index.css";

const Skeleton = React.memo(() => (
    <div className="d-grid gap-4 pt-3">
        <DashboardKpiSkeleton />
        <DashboardOverviewSkeleton count={4} />
        <DashboardTableSkeleton />
    </div>
));

const TABS = DASHBOARD_TABS.map((tab) => ({
    ...tab,
    component: React.lazy(tab.loadComponent)
}));

const Dashboard = () => {
    const [activeTabId, setActiveTabId] = useState(DASHBOARD_DEFAULT_TAB);

    const tabConfigById = useMemo(
        () => new Map(TABS.map((tab) => [tab.id, tab])),
        []
    );

    const handleTabChange = useCallback((tabId) => {
        startTransition(() => {
            setActiveTabId(tabId);
        });
    }, []);

    const preloadTab = useCallback((tabId) => {
        tabConfigById.get(tabId)?.preload?.();
    }, [tabConfigById]);

    useEffect(() => {
        const preloadNonActiveTabs = () => {
            TABS.forEach(({ id, preload }) => {
                if (id !== activeTabId) preload?.();
            });
        };

        if (typeof window === "undefined") return undefined;

        if ("requestIdleCallback" in window) {
            const idleId = window.requestIdleCallback(preloadNonActiveTabs, { timeout: 1200 });
            return () => window.cancelIdleCallback?.(idleId);
        }

        const timeoutId = window.setTimeout(preloadNonActiveTabs, 600);
        return () => window.clearTimeout(timeoutId);
    }, [activeTabId]);

    const currentTabConfig = useMemo(
        () => tabConfigById.get(activeTabId) ?? null,
        [activeTabId, tabConfigById]
    );

    useEffect(() => {
        if (typeof document === "undefined") return undefined;

        const root = document.documentElement;
        root.setAttribute("data-dashboard-schema", currentTabConfig?.schema || "default");

        return () => {
            root.setAttribute("data-dashboard-schema", "default");
        };
    }, [currentTabConfig]);

    const tabButtons = useMemo(
        () =>
            TABS.map(({ id, label, schema }) => (
                <Button
                    key={id}
                    className={`dashboard-tab-btn ${schema !== "default" ? `dashboard-tab-btn--${schema}` : ""}`}
                    variant={activeTabId === id ? "primary" : "outline-primary"}
                    onClick={() => handleTabChange(id)}
                    onMouseEnter={() => preloadTab(id)}
                    onFocus={() => preloadTab(id)}
                >
                    {label}
                </Button>
            )),
        [activeTabId, handleTabChange, preloadTab]
    );

    const CurrentComponent = currentTabConfig?.component;

    return (
        <div
            className={`dashboard-container ${
                activeTabId === DASHBOARD_TAB_IDS.TAB1 ? "dashboard-container--adidas-active" : ""
            }`}
        >
            <ButtonGroup className="dashboard-btn-group d-flex flex-wrap">
                {tabButtons}
            </ButtonGroup>

            <DashboardErrorBoundary
                fallback={
                    <div className="alert alert-warning mt-3" role="alert">
                        Nao foi possivel carregar esta aba.
                    </div>
                }
            >
                <Suspense fallback={<Skeleton />}>
                    {CurrentComponent ? <CurrentComponent key={activeTabId} /> : null}
                </Suspense>
            </DashboardErrorBoundary>
        </div>
    );
};

export default React.memo(Dashboard);
