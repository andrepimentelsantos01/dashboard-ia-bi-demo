import { getKpiVariation } from "../hooks/useKpiVariation";
import {
    buildOptionsFromRows,
    buildOrderOptions,
    cleanString
} from "./shared/dashboardSelectors";

const toMetricArray = (record = {}, type) =>
    Object.entries(record)
        .map(([name, valor]) => ({ name, valor, type }))
        .sort((a, b) => {
            if (b.valor !== a.valor) return b.valor - a.valor;
            return String(a.name).localeCompare(String(b.name), undefined, {
                numeric: true,
                sensitivity: "base"
            });
        });

const formatUsdCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });

const formatNumber = (value) =>
    Math.round(Number(value || 0)).toLocaleString("en-US");

export const normalizeAmazonSalesAnalytics = (rows = []) =>
    rows.map((row) => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const valorUnitario = Number(row.unit_price) || (quantidade ? valorTotal / quantidade : 0);
        const status = cleanString(row.item_status || row.logistics_status || row.status);

        return {
            ...row,
            data: row.order_date,
            cliente: cleanString(row.customer_location),
            fornecedor: cleanString(row.payment_method || row.supplier_name),
            categoria: cleanString(row.product_class_material_name),
            produto: cleanString(row.product_name),
            status,
            quantidade,
            valorTotal,
            valorUnitario,
            orderId: row.purchase_order_id,
            customerName: cleanString(row.customer_name || row.client_name),
            customerLocation: cleanString(row.customer_location),
            paymentMethod: cleanString(row.payment_method || row.supplier_name),
            quantity: quantidade,
            total: valorTotal
        };
    });

export const normalizeAmazonSalesTable = (rows = []) =>
    rows.map((row) => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const valorUnitario = Number(row.unit_price) || (quantidade ? valorTotal / quantidade : 0);
        const status = row.item_status || row.logistics_status || row.status;

        return {
            data: row.order_date,
            cliente: row.customer_location,
            fornecedor: row.payment_method || row.supplier_name,
            categoria: row.product_class_material_name,
            produto: row.product_name,
            quantidade,
            valorTotal,
            valorUnitario,
            purchase_order_id: row.purchase_order_id,
            order_date: row.order_date,
            year_months: row.year_months,
            customer_name: row.customer_name || row.client_name,
            customer_location: row.customer_location,
            product_name: row.product_name,
            product_class_material_name: row.product_class_material_name,
            payment_method: row.payment_method || row.supplier_name,
            quantity_requested: quantidade,
            unit_price: valorUnitario,
            total_amount: valorTotal,
            item_status: status,
            currency_code: row.currency_code || "USD"
        };
    });

export const buildAmazonSalesDerivedData = (analytics = []) => {
    const acc = {
        salesByMonth: {},
        ordersByMonth: {},
        unitsByMonth: {},
        unitPriceByMonth: {},
        categories: {},
        categoriesVolume: {},
        products: {},
        productsVolume: {},
        locations: {},
        locationsVolume: {},
        payments: {},
        paymentsVolume: {},
        statusTreemap: {}
    };

    let totalSales = 0;
    let totalUnits = 0;
    let totalOrders = 0;
    let completedOrders = 0;
    const customers = new Set();

    analytics.forEach((row) => {
        const monthKey = row.year_months;
        const sales = Number(row.valorTotal || 0);
        const quantity = Number(row.quantidade || 0);
        const category = row.categoria || "Categoria nao informada";
        const product = row.produto || "Produto nao informado";
        const location = row.cliente || "Localidade nao informada";
        const payment = row.fornecedor || "Pagamento nao informado";
        const status = row.status || "Desconhecido";
        const customerName = row.customerName || "Cliente nao informado";

        if (monthKey) {
            acc.salesByMonth[monthKey] = (acc.salesByMonth[monthKey] || 0) + sales;
            acc.ordersByMonth[monthKey] = (acc.ordersByMonth[monthKey] || 0) + 1;
            acc.unitsByMonth[monthKey] = (acc.unitsByMonth[monthKey] || 0) + quantity;

            if (!acc.unitPriceByMonth[monthKey]) {
                acc.unitPriceByMonth[monthKey] = { total: 0, quantity: 0 };
            }

            acc.unitPriceByMonth[monthKey].total += sales;
            acc.unitPriceByMonth[monthKey].quantity += quantity;
        }

        acc.categories[category] = (acc.categories[category] || 0) + sales;
        acc.categoriesVolume[category] = (acc.categoriesVolume[category] || 0) + quantity;
        acc.products[product] = (acc.products[product] || 0) + sales;
        acc.productsVolume[product] = (acc.productsVolume[product] || 0) + quantity;
        acc.locations[location] = (acc.locations[location] || 0) + sales;
        acc.locationsVolume[location] = (acc.locationsVolume[location] || 0) + quantity;
        acc.payments[payment] = (acc.payments[payment] || 0) + sales;
        acc.paymentsVolume[payment] = (acc.paymentsVolume[payment] || 0) + quantity;

        if (!acc.statusTreemap[status]) {
            acc.statusTreemap[status] = {
                name: status,
                statusKey: status,
                value: 0,
                volume: 0,
                categoriaValor: {},
                categoriaQtd: {},
                fornecedorValor: {},
                fornecedorQtd: {},
                produtoValor: {},
                produtoQtd: {},
                clientes: new Set(),
                filterPayload: { type: "status", value: status }
            };
        }

        acc.statusTreemap[status].value += 1;
        acc.statusTreemap[status].volume += quantity;
        acc.statusTreemap[status].categoriaValor[category] =
            (acc.statusTreemap[status].categoriaValor[category] || 0) + sales;
        acc.statusTreemap[status].categoriaQtd[category] =
            (acc.statusTreemap[status].categoriaQtd[category] || 0) + quantity;
        acc.statusTreemap[status].fornecedorValor[payment] =
            (acc.statusTreemap[status].fornecedorValor[payment] || 0) + sales;
        acc.statusTreemap[status].fornecedorQtd[payment] =
            (acc.statusTreemap[status].fornecedorQtd[payment] || 0) + quantity;
        acc.statusTreemap[status].produtoValor[product] =
            (acc.statusTreemap[status].produtoValor[product] || 0) + sales;
        acc.statusTreemap[status].produtoQtd[product] =
            (acc.statusTreemap[status].produtoQtd[product] || 0) + quantity;
        acc.statusTreemap[status].clientes.add(location);

        totalSales += sales;
        totalUnits += quantity;
        totalOrders += 1;
        customers.add(customerName);

        if (status === "Concluido" || status === "Concluído") {
            completedOrders += 1;
        }
    });

    const getLeader = (record = {}) =>
        Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const orderedMonths = Object.keys(acc.salesByMonth).sort((a, b) => String(a).localeCompare(String(b)));
    const salesHistory = orderedMonths.map((month) => acc.salesByMonth[month] || 0);
    const ordersHistory = orderedMonths.map((month) => acc.ordersByMonth[month] || 0);
    const unitsHistory = orderedMonths.map((month) => acc.unitsByMonth[month] || 0);
    const ticketHistory = orderedMonths.map((month) => {
        const monthOrders = acc.ordersByMonth[month] || 0;
        return monthOrders ? (acc.salesByMonth[month] || 0) / monthOrders : 0;
    });

    return {
        historicoMeses: orderedMonths,
        historicoValores: salesHistory,
        historicoPedidos: ordersHistory,
        historicoQuantidades: unitsHistory,
        categoriasPizza: toMetricArray(acc.categories, "categoria").map(({ name, valor }) => ({
            name,
            value: valor
        })),
        categoriasRanking: toMetricArray(acc.categories, "categoria"),
        categoriasRankingVolume: toMetricArray(acc.categoriesVolume, "categoria"),
        produtosRanking: toMetricArray(acc.products, "produto"),
        produtosRankingVolume: toMetricArray(acc.productsVolume, "produto"),
        locationsRanking: toMetricArray(acc.locations, "cliente"),
        locationsRankingVolume: toMetricArray(acc.locationsVolume, "cliente"),
        paymentRanking: toMetricArray(acc.payments, "fornecedor"),
        paymentRankingVolume: toMetricArray(acc.paymentsVolume, "fornecedor"),
        statusTreemap: Object.values(acc.statusTreemap).map((item) => ({
            ...item,
            categoriaLeaderValor: getLeader(item.categoriaValor),
            categoriaLeaderQtd: getLeader(item.categoriaQtd),
            fornecedorLeaderValor: getLeader(item.fornecedorValor),
            fornecedorLeaderQtd: getLeader(item.fornecedorQtd),
            produtoLeaderValor: getLeader(item.produtoValor),
            produtoLeaderQtd: getLeader(item.produtoQtd),
            clientesAtendidos: item.clientes.size
        })),
        unitPriceEvolution: orderedMonths.map((month) => ({
            time_bucket: month,
            metric_value: acc.unitPriceByMonth[month]?.quantity
                ? acc.unitPriceByMonth[month].total / acc.unitPriceByMonth[month].quantity
                : 0
        })),
        kpis: {
            "Receita Total": {
                value: formatUsdCurrency(totalSales),
                variation: getKpiVariation(salesHistory)
            },
            "Pedidos": {
                value: formatNumber(totalOrders),
                variation: getKpiVariation(ordersHistory)
            },
            "Ticket Medio": {
                value: formatUsdCurrency(totalOrders ? totalSales / totalOrders : 0),
                variation: getKpiVariation(ticketHistory)
            },
            "Unidades Vendidas": {
                value: formatNumber(totalUnits),
                variation: getKpiVariation(unitsHistory)
            }
        },
        alertas: {
            "Taxa de Conclusao": totalOrders ? `${((completedOrders / totalOrders) * 100).toFixed(1)}%` : "0%",
            "Clientes Atendidos": formatNumber(customers.size)
        }
    };
};

export const buildAmazonSalesAvailableFilters = (rows = []) => ({
    availableCustomers: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableLocations: [...new Set(rows.map((row) => row.customer_location).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableCategorias: [...new Set(rows.map((row) => row.product_class_material_name).filter(Boolean))],
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availablePayments: [...new Set(rows.map((row) => row.payment_method).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableStatus: [...new Set(rows.map((row) => row.item_status).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableOrders: buildOrderOptions(rows)
});
