import React, { useState, useMemo, Suspense, useCallback, useEffect, startTransition } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import DashboardErrorBoundary from "./components/shared/DashboardErrorBoundary";
import "./index.css";

const loadOverview = () => import("./tabs/Overview");
const loadProducts = () => import("./tabs/Products/Products");
const loadClients = () => import("./tabs/Clients/Clients");
const loadSuppliers = () => import("./tabs/Suppliers");
const loadQuotations = () => import("./tabs/Quotations");
const loadOrders = () => import("./tabs/Orders");

const Overview = React.lazy(loadOverview);
const Products = React.lazy(loadProducts);
const Clients = React.lazy(loadClients);
const Suppliers = React.lazy(loadSuppliers);
const Quotations = React.lazy(loadQuotations);
const Orders = React.lazy(loadOrders);

const Skeleton = React.memo(() => (
    <div className="skeleton-wrapper">
        <div className="skeleton-block skeleton-title"></div>
        <div className="skeleton-block skeleton-row"></div>
        <div className="skeleton-block skeleton-row"></div>
        <div className="skeleton-block skeleton-row"></div>
    </div>
));

const TABS = [
    { key: "overview", label: "Adidas Sales Dataset", component: Overview, preload: loadOverview, schema: "adidas" },
    { key: "products", label: "Produtos", component: Products, preload: loadProducts, schema: "default" },
    { key: "clients", label: "Clientes", component: Clients, preload: loadClients, schema: "default" },
    { key: "suppliers", label: "Fornecedores", component: Suppliers, preload: loadSuppliers, schema: "default" },
    { key: "quotations", label: "Cota\u00e7\u00f5es", component: Quotations, preload: loadQuotations, schema: "default" },
    { key: "orders", label: "Pedidos & Log\u00edstica", component: Orders, preload: loadOrders, schema: "default" }
];

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");

    const handleTabChange = useCallback((key) => {
        startTransition(() => {
            setActiveTab(key);
        });
    }, []);

    const preloadTab = useCallback((key) => {
        const found = TABS.find((tab) => tab.key === key);
        found?.preload?.();
    }, []);

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
        () => TABS.find((tab) => tab.key === activeTab) ?? null,
        [activeTab]
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
            TABS.map(({ key, label }) => (
                <Button
                    key={key}
                    className={`dashboard-tab-btn ${key === "overview" ? "dashboard-tab-btn--adidas" : ""}`}
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
