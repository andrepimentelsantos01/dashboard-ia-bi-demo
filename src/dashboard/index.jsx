import React, { useState, useMemo, Suspense, useCallback, useEffect, startTransition } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import DashboardErrorBoundary from "./components/shared/DashboardErrorBoundary";
import { DashboardKpiSkeleton, DashboardOverviewSkeleton, DashboardTableSkeleton } from "./components/shared/DashboardAsyncState";
import { DASHBOARD_DEFAULT_TAB, DASHBOARD_TABS } from "./config/tabs.config";
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
    const [activeTab, setActiveTab] = useState(DASHBOARD_DEFAULT_TAB);

    const tabMap = useMemo(
        () => new Map(TABS.map((tab) => [tab.key, tab])),
        []
    );

    const handleTabChange = useCallback((key) => {
        startTransition(() => {
            setActiveTab(key);
        });
    }, []);

    const preloadTab = useCallback((key) => {
        tabMap.get(key)?.preload?.();
    }, [tabMap]);

    useEffect(() => {
        const preloadNonActiveTabs = () => {
            TABS.forEach(({ key, preload }) => {
                if (key !== activeTab) preload?.();
            });
        };

        if (typeof window === "undefined") return undefined;

        if ("requestIdleCallback" in window) {
            const idleId = window.requestIdleCallback(preloadNonActiveTabs, { timeout: 1200 });
            return () => window.cancelIdleCallback?.(idleId);
        }

        const timeoutId = window.setTimeout(preloadNonActiveTabs, 600);
        return () => window.clearTimeout(timeoutId);
    }, [activeTab]);

    const currentTabConfig = useMemo(
        () => tabMap.get(activeTab) ?? null,
        [activeTab, tabMap]
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
            TABS.map(({ key, label, schema }) => (
                <Button
                    key={key}
                    className={`dashboard-tab-btn ${schema !== "default" ? `dashboard-tab-btn--${schema}` : ""}`}
                    variant={activeTab === key ? "primary" : "outline-primary"}
                    onClick={() => handleTabChange(key)}
                    onMouseEnter={() => preloadTab(key)}
                    onFocus={() => preloadTab(key)}
                >
                    {label}
                </Button>
            )),
        [activeTab, handleTabChange, preloadTab]
    );

    const CurrentComponent = currentTabConfig?.component;

    return (
        <div className={`dashboard-container ${activeTab === "overview" ? "dashboard-container--adidas-active" : ""}`}>
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
                    {CurrentComponent ? <CurrentComponent key={activeTab} /> : null}
                </Suspense>
            </DashboardErrorBoundary>
        </div>
    );
};

export default React.memo(Dashboard);
