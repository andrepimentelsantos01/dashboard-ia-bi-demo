import test from "node:test";
import assert from "node:assert/strict";
import {
    createDashboardFilters,
    buildDashboardApiFilters,
    createCrossFilterMap
} from "../src/dashboard/hooks/dashboardTabState.helpers.js";

test("createDashboardFilters monta estado base com overrides", () => {
    const filters = createDashboardFilters({ uf: "CA", mes: "2021-01" });

    assert.equal(filters.uf, "CA");
    assert.equal(filters.mes, "2021-01");
    assert.deepEqual(filters.clients, []);
    assert.deepEqual(filters.suppliers, []);
});

test("buildDashboardApiFilters traduz selecoes do dashboard para payload da API", () => {
    const payload = buildDashboardApiFilters({
        clients: [{ id: "state-california", name: "California" }],
        suppliers: [{ id: "retailer-west-gear", name: "West Gear" }],
        produtos: [{ id: "product-runner", name: "Runner" }],
        categorias: [{ name: "West" }],
        status: ["Online"],
        uf: "CA",
        mes: "2021-01",
        orders: [{ id: "INV-0001", name: "INV-0001" }]
    }, { includeOrders: true });

    assert.equal(payload.client_id, "state-california");
    assert.equal(payload.supplier_id, "retailer-west-gear");
    assert.equal(payload.product_id, "product-runner");
    assert.deepEqual(payload.product_class_material_name, ["West"]);
    assert.equal(payload.item_status, "Online");
    assert.equal(payload.client_state, "CA");
    assert.equal(payload.year_months, "2021-01");
    assert.equal(payload.purchase_order_id, "INV-0001");
});

test("createCrossFilterMap aplica mapeamentos de cross-filter", () => {
    const handlers = createCrossFilterMap({ includeOrders: true });

    assert.deepEqual(handlers.cliente({ id: "state-ny", value: "New York" }), {
        clients: [{ id: "state-ny", name: "New York" }]
    });

    assert.deepEqual(handlers.categoria({ value: "West" }), {
        categorias: [{ name: "West" }]
    });

    assert.deepEqual(handlers.status({ value: "Outlet" }), {
        status: ["Outlet"]
    });

    assert.deepEqual(handlers.orders({ value: "INV-99" }), {
        orders: [{ id: "INV-99", name: "INV-99" }]
    });
});
