import React, { useState, useMemo, Suspense, useCallback } from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import "./index.css";

const Overview = React.lazy(() => import("./tabs/Overview"));
const Products = React.lazy(() => import("./tabs/Products/Products"));
const Clients = React.lazy(() => import("./tabs/Clients/Clients"));
const Suppliers = React.lazy(() => import("./tabs/Suppliers"));
const Quotations = React.lazy(() => import("./tabs/Quotations"));
const Orders = React.lazy(() => import("./tabs/Orders"));

const Skeleton = React.memo(() => (
    <div className="skeleton-wrapper">
        <div className="skeleton-block skeleton-title"></div>
        <div className="skeleton-block skeleton-row"></div>
        <div className="skeleton-block skeleton-row"></div>
        <div className="skeleton-block skeleton-row"></div>
    </div>
));

const TABS = [
    { key: "overview", label: "Visão Geral", component: Overview },
    { key: "products", label: "Produtos", component: Products },
    { key: "clients", label: "Clientes", component: Clients },
    { key: "suppliers", label: "Fornecedores", component: Suppliers },
    { key: "quotations", label: "Cotações", component: Quotations },
    { key: "orders", label: "Pedidos & Logística", component: Orders }
];

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");

    const handleTabChange = useCallback((key) => {
        setActiveTab(key);
    }, []);

    const currentTab = useMemo(() => {
        const found = TABS.find(t => t.key === activeTab);
        if (!found) return <Overview key="overview" />;
        const Component = found.component;
        return <Component key={activeTab} />;
    }, [activeTab]);

    const tabButtons = useMemo(
        () =>
            TABS.map(({ key, label }) => (
                <Button
                    key={key}
                    className="dashboard-tab-btn"
                    variant={activeTab === key ? "primary" : "outline-primary"}
                    onClick={() => handleTabChange(key)}
                >
                    {label}
                </Button>
            )),
        [activeTab, handleTabChange]
    );

    return (
        <div className="dashboard-container">
            <ButtonGroup className="dashboard-btn-group d-flex flex-wrap">
                {tabButtons}
            </ButtonGroup>
            <Suspense fallback={<Skeleton />}>
                {currentTab}
            </Suspense>
        </div>
    );
};

export default React.memo(Dashboard);
