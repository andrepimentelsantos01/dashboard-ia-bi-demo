const loadOverviewTab = () => import("../tabs/Overview");
const loadProductsTab = () => import("../tabs/Products/Products");
const loadClientsTab = () => import("../tabs/Clients/Clients");
const loadSuppliersTab = () => import("../tabs/Suppliers");

export const DASHBOARD_TABS = [
    {
        key: "overview",
        label: "Adidas Sales Dataset",
        schema: "adidas",
        preload: loadOverviewTab,
        loadComponent: loadOverviewTab
    },
    {
        key: "products",
        label: "Amazon Sales Dataset",
        schema: "amazon",
        preload: loadProductsTab,
        loadComponent: loadProductsTab
    },
    {
        key: "clients",
        label: "Restaurant Sales Dataset",
        schema: "restaurant",
        preload: loadClientsTab,
        loadComponent: loadClientsTab
    },
    {
        key: "suppliers",
        label: "Logistics Performance Dataset",
        schema: "default",
        preload: loadSuppliersTab,
        loadComponent: loadSuppliersTab
    }
];

export const DASHBOARD_DEFAULT_TAB = DASHBOARD_TABS[0]?.key ?? "overview";
