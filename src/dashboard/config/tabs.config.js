const loadTab1 = () => import("../tabs/Tab1");
const loadTab2 = () => import("../tabs/Tab2");
const loadTab3 = () => import("../tabs/Tab3");
const loadTab4 = () => import("../tabs/Tab4");

export const DASHBOARD_TAB_IDS = Object.freeze({
    TAB1: "Tab1",
    TAB2: "Tab2",
    TAB3: "Tab3",
    TAB4: "Tab4"
});

export const DASHBOARD_TABS = [
    {
        id: DASHBOARD_TAB_IDS.TAB1,
        label: "Vendas Adidas",
        schema: "adidas",
        preload: loadTab1,
        loadComponent: loadTab1
    },
    {
        id: DASHBOARD_TAB_IDS.TAB2,
        label: "Vendas Amazon",
        schema: "amazon",
        preload: loadTab2,
        loadComponent: loadTab2
    },
    {
        id: DASHBOARD_TAB_IDS.TAB3,
        label: "Vendas Restaurante",
        schema: "restaurant",
        preload: loadTab3,
        loadComponent: loadTab3
    },
    {
        id: DASHBOARD_TAB_IDS.TAB4,
        label: "Performance Logistica",
        schema: "logistics",
        preload: loadTab4,
        loadComponent: loadTab4
    }
];

export const DASHBOARD_DEFAULT_TAB = DASHBOARD_TABS[0]?.id ?? DASHBOARD_TAB_IDS.TAB1;
