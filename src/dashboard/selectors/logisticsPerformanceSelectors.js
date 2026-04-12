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

const formatUsdCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });

const formatNumber = (value) =>
    Math.round(Number(value || 0)).toLocaleString("en-US");

const topLabel = (record = {}) =>
    Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

export const normalizeTab4Analytics = (rows = []) =>
    rows.map((row) => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const valorUnitario = Number(row.unit_price) || 0;
        const status = cleanString(row.item_status || row.logistics_status || row.status);

        return {
            ...row,
            data: row.order_date,
            cliente: cleanString(row.destination || row.client_name),
            fornecedor: cleanString(row.carrier || row.supplier_name),
            categoria: cleanString(row.origin_warehouse || row.product_class_material_name),
            produto: cleanString(row.route_name || row.product_name),
            status,
            quantidade,
            valorTotal,
            valorUnitario,
            destination: cleanString(row.destination || row.client_name),
            carrier: cleanString(row.carrier || row.supplier_name),
            warehouse: cleanString(row.origin_warehouse || row.product_class_material_name),
            routeName: cleanString(row.route_name || row.product_name),
            delayDays: Number(row.delay_days) || 0,
            actualTransitDays: Number(row.actual_transit_days) || 0,
            plannedTransitDays: Number(row.transit_days) || 0,
            weightKg: Number(row.weight_kg || row.quantity_requested || 0) || 0
        };
    });

export const normalizeTab4Table = (rows = []) =>
    rows.map((row) => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const valorUnitario = Number(row.unit_price) || 0;
        const status = row.item_status || row.logistics_status || row.status;

        return {
            shipment_id: row.shipment_id || row.purchase_order_id,
            shipment_date: row.order_date,
            expected_delivery_date: row.expected_delivery_date,
            actual_delivery_date: row.actual_delivery_date,
            year_months: row.year_months,
            origin_warehouse: row.origin_warehouse || row.product_class_material_name,
            destination: row.destination || row.client_name,
            carrier: row.carrier || row.supplier_name,
            route_name: row.route_name || row.product_name,
            weight_kg: Number(row.weight_kg || quantidade),
            distance_miles: Number(row.distance_miles || 0),
            transit_days: Number(row.transit_days || 0),
            actual_transit_days: Number(row.actual_transit_days || 0),
            delay_days: Number(row.delay_days || 0),
            total_amount: valorTotal,
            unit_price: valorUnitario,
            item_status: status,
            on_time_flag: row.on_time_flag,
            delivery_success_flag: row.delivery_success_flag,
            exception_flag: row.exception_flag,
            partial_delivery_flag: row.partial_delivery_flag,
            currency_code: row.currency_code || "USD",
            data: row.order_date,
            cliente: row.destination || row.client_name,
            fornecedor: row.carrier || row.supplier_name,
            categoria: row.origin_warehouse || row.product_class_material_name,
            produto: row.route_name || row.product_name,
            quantidade,
            valorTotal,
            valorUnitario
        };
    });

export const buildTab4DerivedData = (analytics = []) => {
    const acc = {
        costByMonth: {},
        shipmentsByMonth: {},
        delayedByMonth: {},
        onTimeByMonth: {},
        transitByMonth: {},
        carriers: {},
        carriersShipments: {},
        carriersSla: {},
        warehouses: {},
        warehouseShipments: {},
        destinations: {},
        destinationShipments: {},
        statusTreemap: {}
    };

    let totalCost = 0;
    let totalShipments = 0;
    let totalWeight = 0;
    let totalDelayDays = 0;
    let deliveredShipments = 0;
    let onTimeShipments = 0;
    let successShipments = 0;
    let exceptionShipments = 0;

    analytics.forEach((row) => {
        const monthKey = row.year_months;
        const cost = Number(row.valorTotal || 0);
        const quantity = 1;
        const delayDays = Number(row.delayDays || 0);
        const weightKg = Number(row.weightKg || 0);
        const carrier = row.carrier || "Carrier nao informado";
        const warehouse = row.warehouse || "Warehouse nao informado";
        const destination = row.destination || "Destino nao informado";
        const status = row.status || "Desconhecido";
        const onTime = Boolean(row.on_time_flag);
        const success = Boolean(row.delivery_success_flag);
        const exception = Boolean(row.exception_flag);

        if (monthKey) {
            acc.costByMonth[monthKey] = (acc.costByMonth[monthKey] || 0) + cost;
            acc.shipmentsByMonth[monthKey] = (acc.shipmentsByMonth[monthKey] || 0) + quantity;
            acc.delayedByMonth[monthKey] = (acc.delayedByMonth[monthKey] || 0) + (exception ? 1 : 0);
            acc.onTimeByMonth[monthKey] = (acc.onTimeByMonth[monthKey] || 0) + (onTime ? 1 : 0);

            if (!acc.transitByMonth[monthKey]) {
                acc.transitByMonth[monthKey] = { total: 0, shipments: 0 };
            }

            acc.transitByMonth[monthKey].total += Number(row.actualTransitDays || 0);
            acc.transitByMonth[monthKey].shipments += 1;
        }

        acc.carriers[carrier] = (acc.carriers[carrier] || 0) + cost;
        acc.carriersShipments[carrier] = (acc.carriersShipments[carrier] || 0) + 1;

        if (!acc.carriersSla[carrier]) {
            acc.carriersSla[carrier] = { onTime: 0, total: 0 };
        }
        acc.carriersSla[carrier].onTime += onTime ? 1 : 0;
        acc.carriersSla[carrier].total += 1;

        acc.warehouses[warehouse] = (acc.warehouses[warehouse] || 0) + cost;
        acc.warehouseShipments[warehouse] = (acc.warehouseShipments[warehouse] || 0) + 1;
        acc.destinations[destination] = (acc.destinations[destination] || 0) + cost;
        acc.destinationShipments[destination] = (acc.destinationShipments[destination] || 0) + 1;

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
        acc.statusTreemap[status].volume += 1;
        acc.statusTreemap[status].categoriaValor[warehouse] =
            (acc.statusTreemap[status].categoriaValor[warehouse] || 0) + cost;
        acc.statusTreemap[status].categoriaQtd[warehouse] =
            (acc.statusTreemap[status].categoriaQtd[warehouse] || 0) + 1;
        acc.statusTreemap[status].fornecedorValor[carrier] =
            (acc.statusTreemap[status].fornecedorValor[carrier] || 0) + cost;
        acc.statusTreemap[status].fornecedorQtd[carrier] =
            (acc.statusTreemap[status].fornecedorQtd[carrier] || 0) + 1;
        acc.statusTreemap[status].produtoValor[row.routeName || "Rota nao informada"] =
            (acc.statusTreemap[status].produtoValor[row.routeName || "Rota nao informada"] || 0) + cost;
        acc.statusTreemap[status].produtoQtd[row.routeName || "Rota nao informada"] =
            (acc.statusTreemap[status].produtoQtd[row.routeName || "Rota nao informada"] || 0) + 1;
        acc.statusTreemap[status].clientes.add(destination);

        totalCost += cost;
        totalShipments += 1;
        totalWeight += weightKg;
        totalDelayDays += delayDays;
        deliveredShipments += status === "Entregue" ? 1 : 0;
        onTimeShipments += onTime ? 1 : 0;
        successShipments += success ? 1 : 0;
        exceptionShipments += exception ? 1 : 0;
    });

    const orderedMonths = Object.keys(acc.shipmentsByMonth).sort((a, b) => String(a).localeCompare(String(b)));
    const shipmentsHistory = orderedMonths.map((month) => acc.shipmentsByMonth[month] || 0);
    const costHistory = orderedMonths.map((month) => acc.costByMonth[month] || 0);
    const delayedHistory = orderedMonths.map((month) => acc.delayedByMonth[month] || 0);
    const averageDelayHistory = orderedMonths.map((month) => {
        const shipments = acc.shipmentsByMonth[month] || 0;
        const delays = acc.delayedByMonth[month] || 0;
        return shipments ? delays / shipments : 0;
    });
    const transitHistory = orderedMonths.map((month) => {
        const monthData = acc.transitByMonth[month];
        return monthData?.shipments ? monthData.total / monthData.shipments : 0;
    });

    const carrierCompliance = sortMetricArray(
        Object.fromEntries(
            Object.entries(acc.carriersSla).map(([carrier, values]) => [
                carrier,
                values.total ? (values.onTime / values.total) * 100 : 0
            ])
        ),
        "fornecedor"
    );

    return {
        historicoMeses: orderedMonths,
        historicoCustos: costHistory,
        historicoEmbarques: shipmentsHistory,
        historicoAtrasos: delayedHistory,
        carriersRanking: sortMetricArray(acc.carriers, "fornecedor"),
        carriersShipmentsRanking: sortMetricArray(acc.carriersShipments, "fornecedor"),
        carriersSlaRanking: carrierCompliance,
        warehousesRanking: sortMetricArray(acc.warehouseShipments, "categoria"),
        destinationsRanking: sortMetricArray(acc.destinationShipments, "cliente"),
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
        transitEvolution: orderedMonths.map((month) => ({
            time_bucket: month,
            metric_value: acc.transitByMonth[month]?.shipments
                ? acc.transitByMonth[month].total / acc.transitByMonth[month].shipments
                : 0
        })),
        gauges: {
            onTimeSla: totalShipments ? (onTimeShipments / totalShipments) * 100 : 0,
            successRate: totalShipments ? (successShipments / totalShipments) * 100 : 0,
            exceptionRate: totalShipments ? (exceptionShipments / totalShipments) * 100 : 0,
            carrierCompliance: carrierCompliance[0]?.valor || 0
        },
        kpis: {
            "Custo Total": {
                value: formatUsdCurrency(totalCost),
                variation: getKpiVariation(costHistory)
            },
            Embarques: {
                value: formatNumber(totalShipments),
                variation: getKpiVariation(shipmentsHistory)
            },
            "Peso Transportado": {
                value: `${formatNumber(totalWeight)} kg`,
                variation: 0
            },
            "Atraso Medio": {
                value: `${(totalShipments ? totalDelayDays / totalShipments : 0).toFixed(1)} dias`,
                variation: getKpiVariation(averageDelayHistory)
            }
        },
        alertas: {
            "Delivery Success Rate": totalShipments ? `${((successShipments / totalShipments) * 100).toFixed(1)}%` : "0%",
            "Embarques Entregues": formatNumber(deliveredShipments)
        }
    };
};

export const buildTab4AvailableFilters = (rows = []) => ({
    availableCarriers: [...new Set(rows.map((row) => row.carrier || row.supplier_name).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableWarehouses: [...new Set(rows.map((row) => row.origin_warehouse || row.product_class_material_name).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableDestinations: [...new Set(rows.map((row) => row.destination || row.client_name).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableStatus: [...new Set(rows.map((row) => row.item_status || row.logistics_status).filter(Boolean))].map((name) => ({
        id: name,
        name
    })),
    availableRoutes: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableOrders: buildOrderOptions(rows)
});
