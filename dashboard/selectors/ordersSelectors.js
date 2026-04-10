import {
    buildOptionsFromRows,
    buildOrderOptions,
    buildUniqueStringList,
    cleanString,
    mapToMetricArray,
    toNumber
} from "./shared/dashboardSelectors";

const buildOrdersMonthKey = (value) => {
    const date = value ? new Date(value) : null;

    if (!date || Number.isNaN(date.getTime())) return null;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const normalizeOrdersAnalytics = (rows = []) =>
    rows.map(row => ({
        ...row,
        numeroPedido: row.purchase_order_id || null,
        cliente: cleanString(row.client_name),
        fornecedor: cleanString(row.supplier_name),
        produto: cleanString(row.product_name),
        categoria: cleanString(row.product_class_material_name),
        uf: cleanString(row.client_state),
        quantidade: Number(row.sum_quantity_requested) || 0,
        valorUnitario: 0,
        valorTotal: toNumber(row.sum_total_amount),
        glosa: toNumber(row.glosa) || 0,
        dataCriacao: row.order_date,
        dataEntregaReal: null,
        status: cleanString(row.item_status || row.order_status),
        parsedDateCriacao: row.order_date ? new Date(row.order_date) : null
    }));

export const buildOrdersDerivedData = (analytics = []) => {
    const acc = {
        historicoPedidos: new Map(),
        historicoValor: new Map(),
        historicoQuantidade: new Map(),
        valorMovimentadoMes: new Map(),
        estados: new Map(),
        fornecedores: {},
        clientes: {},
        categorias: {},
        produtos: {},
        status: new Map()
    };

    let valorMovimentado = 0;
    let quantidadeMovimentada = 0;
    let quantidadePedidos = 0;
    let entregues = 0;
    let cancelados = 0;
    let atrasados = 0;

    analytics.forEach(row => {
        const monthKey = buildOrdersMonthKey(row.dataCriacao);

        quantidadePedidos += 1;
        valorMovimentado += row.valorTotal;
        quantidadeMovimentada += row.quantidade;

        if (row.status === "Entregue") entregues += 1;
        if (row.status === "Cancelado") cancelados += 1;
        if (row.status === "Atrasado") atrasados += 1;

        if (monthKey) {
            acc.historicoPedidos.set(monthKey, (acc.historicoPedidos.get(monthKey) || 0) + 1);
            acc.historicoValor.set(monthKey, (acc.historicoValor.get(monthKey) || 0) + row.valorTotal);
            acc.historicoQuantidade.set(monthKey, (acc.historicoQuantidade.get(monthKey) || 0) + row.quantidade);
            acc.valorMovimentadoMes.set(monthKey, (acc.valorMovimentadoMes.get(monthKey) || 0) + row.valorTotal);
        }

        acc.estados.set(row.uf, (acc.estados.get(row.uf) || 0) + 1);
        acc.fornecedores[row.fornecedor] = (acc.fornecedores[row.fornecedor] || 0) + row.valorTotal;
        acc.clientes[row.cliente] = (acc.clientes[row.cliente] || 0) + row.valorTotal;
        acc.categorias[row.categoria] = (acc.categorias[row.categoria] || 0) + row.valorTotal;
        acc.produtos[row.produto] = (acc.produtos[row.produto] || 0) + row.valorTotal;

        const statusItem = acc.status.get(row.status) || {
            name: row.status || "Indefinido",
            value: 0,
            volume: 0
        };

        statusItem.value += 1;
        statusItem.volume += row.quantidade || 0;
        acc.status.set(row.status, statusItem);
    });

    const historicoMeses = Array.from(acc.historicoPedidos.keys()).sort();

    return {
        kpis: {
            valorMovimentado,
            quantidadeMovimentada,
            quantidadePedidos,
            ufTop: acc.estados.size > 0
                ? Array.from(acc.estados.entries()).sort((a, b) => b[1] - a[1])[0][0]
                : null
        },
        overview: {
            atrasosPorFornecedor: mapToMetricArray(acc.fornecedores, "valor", "desc"),
            atrasosPorCliente: mapToMetricArray(acc.clientes, "valor", "desc"),
            mapaUF: Array.from(acc.estados.entries()).map(([uf, total]) => ({ uf, total })),
            chartEntregas: historicoMeses.map(month => ({
                name: month,
                value: acc.historicoPedidos.get(month) || 0
            })),
            statusTreemap: Array.from(acc.status.values()).map(item => ({
                name: item.name,
                value: item.value
            })),
            rankingProdutos: mapToMetricArray(acc.produtos, "valor", "desc"),
            valorMovimentadoMes: historicoMeses.map(month => ({
                name: month,
                value: acc.valorMovimentadoMes.get(month) || 0
            })),
            valorPorCategoria: mapToMetricArray(acc.categorias, "value", "desc"),
            sla: { value: quantidadePedidos > 0 ? (entregues / quantidadePedidos) * 100 : 0 },
            cancelamentos: { value: quantidadePedidos > 0 ? (cancelados / quantidadePedidos) * 100 : 0 },
            atrasos: { value: quantidadePedidos > 0 ? (atrasados / quantidadePedidos) * 100 : 0 }
        },
        operacionais: {
            tabela: analytics
        }
    };
};

export const buildOrdersAvailableFilters = (rows = []) => ({
    availableClients: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableSuppliers: buildOptionsFromRows(rows, "supplier_id", "supplier_name"),
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableOrders: buildOrderOptions(rows),
    availableCategorias: buildUniqueStringList(rows, "product_class_material_name")
});
