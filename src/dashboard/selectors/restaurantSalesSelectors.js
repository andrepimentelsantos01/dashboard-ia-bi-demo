import { getKpiVariation } from "../hooks/useKpiVariation";
import {
    buildOptionsFromRows,
    buildOrderOptions,
    cleanString
} from "./shared/dashboardSelectors";

const sortMetricArray = (record = {}, type) =>
    Object.entries(record)
        .map(([name, valor]) => ({ name, valor, type }))
        .sort((a, b) => {
            if (b.valor !== a.valor) return b.valor - a.valor;
            return String(a.name).localeCompare(String(b.name), undefined, {
                numeric: true,
                sensitivity: "base"
            });
        });

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

const formatNumber = (value) =>
    Math.round(Number(value || 0)).toLocaleString("pt-BR");

export const normalizeTab3Analytics = (rows = []) =>
    rows.map((row) => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const valorUnitario = Number(row.unit_price) || (quantidade ? valorTotal / quantidade : 0);

        return {
            ...row,
            data: row.order_date,
            cliente: cleanString(row.time_of_sale || row.client_name),
            fornecedor: cleanString(row.received_by || row.supplier_name),
            categoria: cleanString(row.product_class_material_name),
            produto: cleanString(row.product_name),
            status: cleanString(row.item_status || row.transaction_type || row.status),
            quantidade,
            valorTotal,
            valorUnitario,
            shift: cleanString(row.time_of_sale),
            attendant: cleanString(row.received_by),
            transactionType: cleanString(row.transaction_type || row.item_status)
        };
    });

export const normalizeTab3Table = (rows = []) =>
    rows.map((row) => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const valorUnitario = Number(row.unit_price) || (quantidade ? valorTotal / quantidade : 0);
        const status = row.item_status || row.transaction_type || row.status;

        return {
            purchase_order_id: row.purchase_order_id,
            order_date: row.order_date,
            year_months: row.year_months,
            customer_name: row.received_by,
            customer_location: row.time_of_sale,
            payment_method: row.transaction_type,
            product_id: row.product_id,
            product_name: row.product_name,
            product_class_material_name: row.product_class_material_name,
            quantity_requested: quantidade,
            unit_price: valorUnitario,
            total_amount: valorTotal,
            item_status: status,
            currency_code: row.currency_code || "BRL",
            data: row.order_date,
            cliente: row.time_of_sale,
            fornecedor: row.received_by,
            categoria: row.product_class_material_name,
            produto: row.product_name,
            status,
            quantidade,
            valorTotal,
            valorUnitario
        };
    });

export const buildTab3DerivedData = (analytics = []) => {
    const acc = {
        salesByMonth: {},
        ordersByMonth: {},
        quantityByMonth: {},
        avgPriceByMonth: {},
        categories: {},
        categoriesVolume: {},
        items: {},
        itemsVolume: {},
        shifts: {},
        shiftsVolume: {},
        attendants: {},
        attendantsVolume: {},
        transactions: {},
        statusTreemap: {}
    };

    let totalSales = 0;
    let totalOrders = 0;
    let totalUnits = 0;
    let onlineOrders = 0;

    analytics.forEach((row) => {
        const monthKey = row.year_months;
        const sales = Number(row.valorTotal || 0);
        const quantity = Number(row.quantidade || 0);
        const category = row.categoria || "Categoria nao informada";
        const item = row.produto || "Item nao informado";
        const shift = row.shift || "Turno nao informado";
        const attendant = row.attendant || "Atendente nao informado";
        const transactionType = row.transactionType || "Canal nao informado";

        if (monthKey) {
            acc.salesByMonth[monthKey] = (acc.salesByMonth[monthKey] || 0) + sales;
            acc.ordersByMonth[monthKey] = (acc.ordersByMonth[monthKey] || 0) + 1;
            acc.quantityByMonth[monthKey] = (acc.quantityByMonth[monthKey] || 0) + quantity;

            if (!acc.avgPriceByMonth[monthKey]) {
                acc.avgPriceByMonth[monthKey] = { total: 0, quantity: 0 };
            }

            acc.avgPriceByMonth[monthKey].total += sales;
            acc.avgPriceByMonth[monthKey].quantity += quantity;
        }

        acc.categories[category] = (acc.categories[category] || 0) + sales;
        acc.categoriesVolume[category] = (acc.categoriesVolume[category] || 0) + quantity;
        acc.items[item] = (acc.items[item] || 0) + sales;
        acc.itemsVolume[item] = (acc.itemsVolume[item] || 0) + quantity;
        acc.shifts[shift] = (acc.shifts[shift] || 0) + sales;
        acc.shiftsVolume[shift] = (acc.shiftsVolume[shift] || 0) + quantity;
        acc.attendants[attendant] = (acc.attendants[attendant] || 0) + sales;
        acc.attendantsVolume[attendant] = (acc.attendantsVolume[attendant] || 0) + quantity;
        acc.transactions[transactionType] = (acc.transactions[transactionType] || 0) + sales;

        if (!acc.statusTreemap[transactionType]) {
            acc.statusTreemap[transactionType] = {
                name: transactionType,
                statusKey: transactionType,
                value: 0,
                volume: 0,
                categoriaValor: {},
                categoriaQtd: {},
                fornecedorValor: {},
                fornecedorQtd: {},
                produtoValor: {},
                produtoQtd: {},
                clientes: new Set(),
                filterPayload: { type: "status", value: transactionType }
            };
        }

        acc.statusTreemap[transactionType].value += 1;
        acc.statusTreemap[transactionType].volume += quantity;
        acc.statusTreemap[transactionType].categoriaValor[category] =
            (acc.statusTreemap[transactionType].categoriaValor[category] || 0) + sales;
        acc.statusTreemap[transactionType].categoriaQtd[category] =
            (acc.statusTreemap[transactionType].categoriaQtd[category] || 0) + quantity;
        acc.statusTreemap[transactionType].fornecedorValor[attendant] =
            (acc.statusTreemap[transactionType].fornecedorValor[attendant] || 0) + sales;
        acc.statusTreemap[transactionType].fornecedorQtd[attendant] =
            (acc.statusTreemap[transactionType].fornecedorQtd[attendant] || 0) + quantity;
        acc.statusTreemap[transactionType].produtoValor[item] =
            (acc.statusTreemap[transactionType].produtoValor[item] || 0) + sales;
        acc.statusTreemap[transactionType].produtoQtd[item] =
            (acc.statusTreemap[transactionType].produtoQtd[item] || 0) + quantity;
        acc.statusTreemap[transactionType].clientes.add(shift);

        totalSales += sales;
        totalOrders += 1;
        totalUnits += quantity;

        if (transactionType === "Online") {
            onlineOrders += 1;
        }
    });

    const topLabel = (record = {}) =>
        Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const orderedMonths = Object.keys(acc.salesByMonth).sort((a, b) => String(a).localeCompare(String(b)));
    const salesHistory = orderedMonths.map((month) => acc.salesByMonth[month] || 0);
    const ordersHistory = orderedMonths.map((month) => acc.ordersByMonth[month] || 0);
    const quantityHistory = orderedMonths.map((month) => acc.quantityByMonth[month] || 0);
    const averageTicketHistory = orderedMonths.map((month) => {
        const monthOrders = acc.ordersByMonth[month] || 0;
        return monthOrders ? (acc.salesByMonth[month] || 0) / monthOrders : 0;
    });

    return {
        historicoMeses: orderedMonths,
        historicoValores: salesHistory,
        historicoPedidos: ordersHistory,
        historicoQuantidades: quantityHistory,
        categoriasPizza: sortMetricArray(acc.categories, "categoria").map(({ name, valor }) => ({
            name,
            value: valor
        })),
        categoriasRanking: sortMetricArray(acc.categories, "categoria"),
        categoriasRankingVolume: sortMetricArray(acc.categoriesVolume, "categoria"),
        itemsRanking: sortMetricArray(acc.items, "produto"),
        itemsRankingVolume: sortMetricArray(acc.itemsVolume, "produto"),
        shiftsRanking: sortMetricArray(acc.shifts, "cliente"),
        shiftsRankingVolume: sortMetricArray(acc.shiftsVolume, "cliente"),
        attendantsRanking: sortMetricArray(acc.attendants, "fornecedor"),
        attendantsRankingVolume: sortMetricArray(acc.attendantsVolume, "fornecedor"),
        transactionRanking: sortMetricArray(acc.transactions, "status"),
        statusTreemap: Object.values(acc.statusTreemap).map((item) => ({
            ...item,
            categoriaLeaderValor: topLabel(item.categoriaValor),
            categoriaLeaderQtd: topLabel(item.categoriaQtd),
            fornecedorLeaderValor: topLabel(item.fornecedorValor),
            fornecedorLeaderQtd: topLabel(item.fornecedorQtd),
            produtoLeaderValor: topLabel(item.produtoValor),
            produtoLeaderQtd: topLabel(item.produtoQtd),
            clientesAtendidos: item.clientes.size
        })),
        unitPriceEvolution: orderedMonths.map((month) => ({
            time_bucket: month,
            metric_value: acc.avgPriceByMonth[month]?.quantity
                ? acc.avgPriceByMonth[month].total / acc.avgPriceByMonth[month].quantity
                : 0
        })),
        kpis: {
            "Receita Total": {
                value: formatCurrency(totalSales),
                variation: getKpiVariation(salesHistory)
            },
            Pedidos: {
                value: formatNumber(totalOrders),
                variation: getKpiVariation(ordersHistory)
            },
            "Ticket Medio": {
                value: formatCurrency(totalOrders ? totalSales / totalOrders : 0),
                variation: getKpiVariation(averageTicketHistory)
            },
            "Itens Vendidos": {
                value: formatNumber(totalUnits),
                variation: getKpiVariation(quantityHistory)
            }
        },
        alertas: {
            "Participacao Online": totalOrders ? `${((onlineOrders / totalOrders) * 100).toFixed(1)}%` : "0%",
            "Turnos Ativos": formatNumber(Object.keys(acc.shifts).length)
        }
    };
};

export const buildTab3AvailableFilters = (rows = []) => ({
    availableShifts: [...new Set(rows.map((row) => row.time_of_sale).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableAttendants: [...new Set(rows.map((row) => row.received_by).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableCategorias: [...new Set(rows.map((row) => row.product_class_material_name).filter(Boolean))],
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableTransactions: [...new Set(rows.map((row) => row.transaction_type || row.item_status).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableOrders: buildOrderOptions(rows)
});
