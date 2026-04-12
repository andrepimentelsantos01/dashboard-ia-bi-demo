import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTab1Analytics,
  normalizeTab1Table,
  buildTab1DerivedData,
  adaptTab1Kpis
} from "../src/dashboard/selectors/tab1Selectors.js";

test("normalizeTab1Analytics normaliza totais, quantidades e dimensoes Adidas", () => {
  const [row] = normalizeTab1Analytics([{
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
});

test("buildTab1DerivedData agrega receita e volume por mes, regiao e rankings", () => {
  const derived = buildTab1DerivedData([
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
});

test("normalizeTab1Table e adaptTab1Kpis preservam shape esperado", () => {
  const [tableRow] = normalizeTab1Table([{
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

  const kpis = adaptTab1Kpis({
        "Receita Total": 10,
        "Lucro Operacional": 4,
        "Margem Operacional Media": 0.4,
        "Unidades Vendidas": 2
    });

    assert.deepEqual(kpis, {
        "Total Sales": 10,
        "Operating Profit": 4,
        "Average Operating Margin": 0.4,
        "Units Sold": 2
    });
});
