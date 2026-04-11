import assert from "node:assert/strict";
import {
    normalizeOverviewAnalytics,
    normalizeOverviewTable,
    buildOverviewDerivedData,
    adaptOverviewKpis
} from "../src/dashboard/selectors/overviewSelectors.js";
import {
    createDashboardFilters,
    buildDashboardApiFilters,
    createCrossFilterMap
} from "../src/dashboard/hooks/dashboardTabState.helpers.js";

const tests = [
    () => {
        const [row] = normalizeOverviewAnalytics([{
            quantity_requested: 12,
            total_amount: 240,
            logistics_status: "Online",
            product_class_material_name: "West",
            operating_profit: 60,
            operating_margin: 0.25,
            sales_method: "Online"
        }]);

        assert.equal(row.quantidade, 12);
        assert.equal(row.valorTotal, 240);
        assert.equal(row.valorUnitario, 20);
        assert.equal(row.region, "West");
        assert.equal(row.operatingProfit, 60);
        assert.equal(row.operatingMargin, 0.25);
        assert.equal(row.salesMethod, "Online");
    },
    () => {
        const derived = buildOverviewDerivedData([
            {
                year_months: "2021-01",
                valorTotal: 100,
                quantidade: 5,
                region: "West",
                product_name: "Runner",
                client_name: "California",
                supplier_name: "Retail A",
                salesMethod: "Online"
            },
            {
                year_months: "2021-01",
                valorTotal: 80,
                quantidade: 4,
                region: "West",
                product_name: "Runner",
                client_name: "California",
                supplier_name: "Retail A",
                salesMethod: "Online"
            },
            {
                year_months: "2021-02",
                valorTotal: 60,
                quantidade: 3,
                region: "South",
                product_name: "Street",
                client_name: "Texas",
                supplier_name: "Retail B",
                salesMethod: "Outlet"
            }
        ]);

        assert.deepEqual(derived.historicoMeses, ["2021-01", "2021-02"]);
        assert.deepEqual(derived.historicoValores, [180, 60]);
        assert.deepEqual(derived.historicoQuantidades, [9, 3]);
        assert.equal(derived.rankingRegioes.find((item) => item.name === "West")?.value, 180);
        assert.equal(derived.rankingRegioesQuantidade.find((item) => item.name === "West")?.valor, 9);
        assert.equal(derived.produtosRanking.find((item) => item.name === "Runner")?.valor, 180);
        assert.equal(derived.produtosRankingQuantidade.find((item) => item.name === "Runner")?.valor, 9);
        assert.equal(derived.rankingClientes.find((item) => item.name === "California")?.valor, 180);
        assert.equal(derived.fornecedoresEntrega.find((item) => item.name === "Retail A")?.valor, 180);
        assert.equal(derived.salesMethodTreemap.find((item) => item.name === "Online")?.value, 2);
    },
    () => {
        const [tableRow] = normalizeOverviewTable([{
            order_date: "2021-01-05T00:00:00.000Z",
            quantity_requested: 8,
            total_amount: 120,
            region: "Midwest",
            supplier_name: "Retail C",
            product_name: "Court",
            client_name: "Illinois",
            item_status: "In-store",
            currency_code: "USD",
            operating_profit: 20,
            operating_margin: 0.2
        }]);

        assert.equal(tableRow.data, "2021-01-05T00:00:00.000Z");
        assert.equal(tableRow.valorUnitario, 15);
        assert.equal(tableRow.fornecedor, "Retail C");
        assert.equal(tableRow.sales_method, "In-store");
        assert.equal(tableRow.operating_margin_percent, 20);
        assert.deepEqual(adaptOverviewKpis({ receita: 10 }, {}), { receita: 10 });
    },
    () => {
        const filters = createDashboardFilters({ uf: "CA", mes: "2021-01" });
        assert.equal(filters.uf, "CA");
        assert.equal(filters.mes, "2021-01");
        assert.deepEqual(filters.clients, []);
        assert.deepEqual(filters.suppliers, []);
    },
    () => {
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
    },
    () => {
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
    }
];

tests.forEach((run, index) => {
    run();
    console.log(`ok ${index + 1}`);
});

console.log(`tests passed: ${tests.length}`);
