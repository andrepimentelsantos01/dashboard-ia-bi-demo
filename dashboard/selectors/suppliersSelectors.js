import { getKpiVariation } from "../hooks/useKpiVariation";
import {
    buildMonthKey,
    buildOptionsFromRows,
    buildOrderOptions,
    buildUniqueStringList,
    cleanString,
    mapToMetricArray
} from "./shared/dashboardSelectors";

export const normalizeSupplierAnalytics = (rows = []) =>
    rows.map(row => {
        const quantidade = Number(row.sum_quantity_requested) || 0;
        const valorTotal = Number(row.sum_total_amount) || 0;

        return {
            ...row,
            fornecedor: cleanString(row.supplier_name),
            cliente: cleanString(row.client_name),
            categoria: cleanString(row.product_class_material_name),
            produto: cleanString(row.product_name),
            uf: cleanString(row.client_state),
            quantidade,
            valorUnitario: quantidade ? valorTotal / quantidade : 0,
            valorTotal,
            glosa: Number(row.sum_glosa_amount) || 0,
            leadTime: null,
            numeroPedido: row.purchase_order_id || null,
            data: row.year_months,
            status: cleanString(row.item_status)
        };
    });

export const buildSuppliersDerivedData = (analytics = []) => {
    const acc = {
        historicoMovimentado: {},
        historicoVolume: {},
        fornecedoresSla: {},
        atrasos: {},
        glosa: {},
        volume: {},
        categorias: {}
    };

    let totalMovimentado = 0;
    let volumeTotal = 0;
    let totalPedidos = 0;
    let pedidosAtrasados = 0;
    let pedidosCancelados = 0;
    let pedidosEntregues = 0;
    let pedidosComGlosa = 0;

    analytics.forEach(row => {
        totalMovimentado += row.valorTotal;
        volumeTotal += row.quantidade;
        totalPedidos += 1;

        if (row.status === "Atrasado") {
            pedidosAtrasados += 1;
            acc.atrasos[row.fornecedor] = (acc.atrasos[row.fornecedor] || 0) + 1;
        }

        if (row.status === "Cancelado") pedidosCancelados += 1;

        if (!acc.fornecedoresSla[row.fornecedor]) {
            acc.fornecedoresSla[row.fornecedor] = { sla: 0, total: 0 };
        }

        if (row.status === "Entregue") {
            pedidosEntregues += 1;
            acc.fornecedoresSla[row.fornecedor].sla += 1;
        }

        acc.fornecedoresSla[row.fornecedor].total += 1;

        if (!acc.glosa[row.fornecedor]) {
            acc.glosa[row.fornecedor] = { glosa: 0, total: 0 };
        }

        if (row.glosa > 0) {
            pedidosComGlosa += 1;
            acc.glosa[row.fornecedor].glosa += 1;
        }

        acc.glosa[row.fornecedor].total += 1;
        acc.volume[row.fornecedor] = (acc.volume[row.fornecedor] || 0) + row.quantidade;
        acc.categorias[row.categoria] = (acc.categorias[row.categoria] || 0) + row.valorTotal;

        const monthKey = buildMonthKey(row.data);
        if (monthKey) {
            acc.historicoMovimentado[monthKey] = (acc.historicoMovimentado[monthKey] || 0) + row.valorTotal;
            acc.historicoVolume[monthKey] = (acc.historicoVolume[monthKey] || 0) + row.quantidade;
        }
    });

    const historicoMeses = Object.keys(acc.historicoMovimentado).sort();
    const historicoValores = historicoMeses.map(month => acc.historicoMovimentado[month]);
    const historicoVolume = historicoMeses.map(month => acc.historicoVolume[month]);

    const rankingSLA = Object.entries(acc.fornecedoresSla)
        .map(([name, values]) => ({
            name,
            valor: values.total > 0 ? (values.sla / values.total) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);

    const rankingAtrasos = mapToMetricArray(acc.atrasos, "valor", "desc");
    const rankingGlosa = Object.entries(acc.glosa)
        .map(([name, values]) => ({
            name,
            valor: values.total > 0 ? (values.glosa / values.total) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);
    const rankingVolume = mapToMetricArray(acc.volume, "valor", "desc");
    const categoriasPizza = mapToMetricArray(acc.categorias, "value", "asc");

    return {
        kpis: {
            "Melhor Fornecedor": rankingSLA[0]?.name || "-",
            "Valor Total Movimentado": {
                value: totalMovimentado,
                variation: getKpiVariation(historicoValores)
            },
            "Volume Movimentado": {
                value: volumeTotal,
                variation: getKpiVariation(historicoVolume)
            },
            "Ticket MÃ©dio": volumeTotal > 0 ? totalMovimentado / volumeTotal : 0
        },
        overview: {
            slaMedio: totalPedidos > 0 ? (pedidosEntregues / totalPedidos) * 100 : 0,
            percentualGlosa: totalPedidos > 0 ? (pedidosComGlosa / totalPedidos) * 100 : 0,
            percentualAtrasos: totalPedidos > 0 ? (pedidosAtrasados / totalPedidos) * 100 : 0,
            historicoMeses,
            historicoValores,
            rankingSLA,
            rankingAtrasos,
            rankingGlosa,
            rankingVolume,
            categoriasPizza
        },
        alertas: {
            miniCards: {
                fornecedoresCriticos: pedidosAtrasados,
                pedidosAtrasados: pedidosAtrasados,
                glosaAlta: pedidosCancelados
            }
        },
        operacionais: {
            tabela: analytics
        }
    };
};

export const buildSuppliersAvailableFilters = (rows = []) => ({
    availableFornecedores: buildOptionsFromRows(rows, "supplier_id", "supplier_name"),
    availableClientes: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableCategorias: buildUniqueStringList(rows, "product_class_material_name"),
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableOrders: buildOrderOptions(rows)
});
