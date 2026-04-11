import { getKpiVariation } from "../hooks/useKpiVariation";
import {
    buildMonthKey,
    buildOptionsFromRows,
    buildOrderOptions,
    cleanString,
    mapToMetricArray
} from "./shared/dashboardSelectors";
import { buildClassificationTreemapData } from "./shared/classificationSelectors";

export const normalizeProductAnalytics = (rows = []) =>
    rows.map(row => {
        const quantidade = Number(row.sum_quantity) || 0;
        const valorTotal = Number(row.sum_total_amount) || 0;

        return {
            ...row,
            numeroPedido: row.purchase_order_id || null,
            data: row.order_date,
            uf: cleanString(row.client_state),
            cliente: cleanString(row.client_name),
            fornecedor: cleanString(row.supplier_name),
            categoria: cleanString(row.product_class_material_name),
            produto: cleanString(row.product_name),
            quantidade,
            valorTotal,
            valorUnitario: quantidade ? valorTotal / quantidade : 0,
            status: cleanString(row.item_status),
            classificacaoABC: row.classificacaoABC ?? row.abc_classification ?? null,
            classificacaoXYZ: row.classificacaoXYZ ?? row.xyz_classification ?? null
        };
    });

export const buildProductsDerivedData = (analytics = []) => {
    const classifications = buildClassificationTreemapData(analytics, {
        entityKey: "produto",
        valueKey: "valorTotal",
        quantityKey: "quantidade",
        monthKey: "data",
        abcKey: "classificacaoABC",
        xyzKey: "classificacaoXYZ"
    });

    const acc = {
        historicoValores: {},
        historicoQuantidade: {},
        produtos: {},
        clientes: {},
        categorias: {},
        fornecedores: {},
        categoriasValor: {},
        glosa: {},
        abc: {}
    };

    let totalMov = 0;
    let quantTotal = 0;
    let cancelados = 0;
    let atrasados = 0;

    analytics.forEach(row => {
        const monthKey = buildMonthKey(row.data);

        if (monthKey) {
            acc.historicoValores[monthKey] = (acc.historicoValores[monthKey] || 0) + row.valorTotal;
            acc.historicoQuantidade[monthKey] = (acc.historicoQuantidade[monthKey] || 0) + row.quantidade;
        }

        acc.produtos[row.produto] = (acc.produtos[row.produto] || 0) + row.valorTotal;
        acc.clientes[row.cliente] = (acc.clientes[row.cliente] || 0) + row.valorTotal;
        acc.categorias[row.categoria] = (acc.categorias[row.categoria] || 0) + row.valorTotal;
        acc.fornecedores[row.fornecedor] = (acc.fornecedores[row.fornecedor] || 0) + row.valorTotal;
        acc.categoriasValor[row.categoria] = (acc.categoriasValor[row.categoria] || 0) + row.valorTotal;

        if (!acc.glosa[row.produto]) acc.glosa[row.produto] = { cancelados: 0, total: 0 };
        if (row.status === "Cancelado") {
            acc.glosa[row.produto].cancelados += 1;
            cancelados += 1;
        }
        if (row.status === "Atrasado") atrasados += 1;

        acc.glosa[row.produto].total += 1;

        if (row.classificacaoABC) {
            acc.abc[row.classificacaoABC] = (acc.abc[row.classificacaoABC] || 0) + row.valorTotal;
        }

        totalMov += row.valorTotal;
        quantTotal += row.quantidade;
    });

    const historicoMeses = Object.keys(acc.historicoValores).sort();
    const historicoValores = historicoMeses.map(month => acc.historicoValores[month]);
    const historicoQuantidade = historicoMeses.map(month => acc.historicoQuantidade[month]);
    const historicoTicketMedio = historicoMeses.map((month) => {
        const valor = acc.historicoValores[month] || 0;
        const quantidade = acc.historicoQuantidade[month] || 0;
        return quantidade > 0 ? valor / quantidade : 0;
    });

    const produtosRanking = mapToMetricArray(acc.produtos, "valor", "desc");
    const rankingClientes = mapToMetricArray(acc.clientes, "valor", "asc");
    const categoriasPizza = mapToMetricArray(acc.categorias, "value", "asc");
    const fornecedoresEntrega = mapToMetricArray(acc.fornecedores, "valor", "asc");
    const produtosPorCategoriaPie = mapToMetricArray(acc.categoriasValor, "value", "desc");

    return {
        produtosRanking,
        rankingClientes,
        historicoMeses,
        historicoValores,
        categoriasPizza,
        fornecedoresEntrega,
        produtosPorCategoriaPie,
        glosaProdutos: {
            labels: Object.keys(acc.glosa),
            values: Object.values(acc.glosa).map(item =>
                item.total ? (item.cancelados / item.total) * 100 : 0
            )
        },
        curvaABCTreemap: classifications.abcTreemap,
        curvaXYZTreemap: classifications.xyzTreemap,
        matrizAbcXyzTreemap: classifications.abcXyzMatrixTreemap,
        curvaABC: {
            labels: Object.keys(acc.abc),
            values: Object.values(acc.abc)
        },
        curvaABCFormatted: Object.entries(acc.abc).map(([name, value]) => ({
            name,
            value: totalMov > 0 ? (value / totalMov) * 100 : 0
        })),
        kpis: {
            produtoTop: produtosRanking[0]?.name || "-",
            valorTotal: {
                value: totalMov.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                variation: getKpiVariation(historicoValores)
            },
            quantidade: {
                value: quantTotal,
                variation: getKpiVariation(historicoQuantidade)
            },
            ticketMedioProduto: {
                value: (quantTotal > 0 ? totalMov / quantTotal : 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                }),
                variation: getKpiVariation(historicoTicketMedio)
            },
            percentualCancelados: analytics.length ? `${((cancelados / analytics.length) * 100).toFixed(1)}%` : "0%",
            percentualAtraso: analytics.length ? `${((atrasados / analytics.length) * 100).toFixed(1)}%` : "0%"
        }
    };
};

export const buildProductsAvailableFilters = (rows = []) => ({
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableCategorias: [...new Set(rows.map(row => row.product_class_material_name).filter(Boolean))],
    availableSuppliers: buildOptionsFromRows(rows, "supplier_id", "supplier_name"),
    availableClients: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableOrders: buildOrderOptions(rows)
});
