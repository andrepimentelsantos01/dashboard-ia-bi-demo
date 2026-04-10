import { getKpiVariation } from "../hooks/useKpiVariation";
import {
    buildMonthKey,
    buildOptionsFromRows,
    buildUniqueStringList,
    cleanString,
    mapToMetricArray
} from "./shared/dashboardSelectors";

export const normalizeClientAnalytics = (rows = []) =>
    rows.map(row => {
        const quantidade = Number(row.sum_quantity_requested) || 0;
        const valorTotal = Number(row.sum_total_amount) || 0;

        return {
            ...row,
            data: row.year_months,
            cliente: cleanString(row.client_name),
            fornecedor: cleanString(row.supplier_name),
            categoria: cleanString(row.product_class_material_name),
            produto: cleanString(row.product_name),
            uf: cleanString(row.client_state),
            quantidade,
            valorUnitario: quantidade ? valorTotal / quantidade : 0,
            valorTotal,
            glosa: 0,
            leadTime: null,
            status: cleanString(row.item_status),
            classificacaoABC: row.abc_classification,
            classificacaoXYZ: row.xyz_classification
        };
    });

export const buildClientsDerivedData = (analytics = []) => {
    const acc = {
        historicoMovimentado: {},
        historicoConsumo: {},
        historicoTicket: {},
        clientes: {},
        categorias: {},
        produtos: {},
        fornecedores: {},
        estados: {},
        abc: {},
        xyz: {}
    };

    let totalMovimentado = 0;
    let totalPedidos = 0;
    let pedidosCancelados = 0;
    let pedidosAtrasados = 0;
    let pedidosEntregues = 0;
    let somaTickets = 0;

    analytics.forEach(row => {
        totalMovimentado += row.valorTotal;
        totalPedidos += 1;
        somaTickets += row.valorUnitario;

        if (row.status === "Cancelado") pedidosCancelados += 1;
        if (row.status === "Atrasado") pedidosAtrasados += 1;
        if (row.status === "Entregue") pedidosEntregues += 1;

        if (row.classificacaoABC) {
            acc.abc[row.classificacaoABC] = (acc.abc[row.classificacaoABC] || 0) + row.valorTotal;
        }

        if (row.classificacaoXYZ) {
            acc.xyz[row.classificacaoXYZ] = (acc.xyz[row.classificacaoXYZ] || 0) + row.quantidade;
        }

        const monthKey = buildMonthKey(row.data);
        if (monthKey) {
            acc.historicoMovimentado[monthKey] = (acc.historicoMovimentado[monthKey] || 0) + row.valorTotal;
            acc.historicoConsumo[monthKey] = (acc.historicoConsumo[monthKey] || 0) + row.valorTotal;

            if (!acc.historicoTicket[monthKey]) acc.historicoTicket[monthKey] = { qtd: 0, valor: 0 };
            acc.historicoTicket[monthKey].qtd += row.quantidade;
            acc.historicoTicket[monthKey].valor += row.valorTotal;
        }

        acc.clientes[row.cliente] = (acc.clientes[row.cliente] || 0) + row.valorTotal;
        acc.categorias[row.categoria] = (acc.categorias[row.categoria] || 0) + row.valorTotal;
        acc.produtos[row.produto] = (acc.produtos[row.produto] || 0) + row.valorTotal;
        acc.fornecedores[row.fornecedor] = (acc.fornecedores[row.fornecedor] || 0) + row.valorTotal;

        if (!acc.estados[row.uf]) acc.estados[row.uf] = { uf: row.uf, total: 0 };
        acc.estados[row.uf].total += row.valorTotal;
    });

    const historicoMeses = Object.keys(acc.historicoMovimentado).sort();
    const historicoValores = historicoMeses.map(month => acc.historicoMovimentado[month]);
    const historicoConsumo = historicoMeses.map(month => acc.historicoConsumo[month]);
    const ticketMedioMensal = historicoMeses.map(month => {
        const item = acc.historicoTicket[month];
        return item?.qtd ? item.valor / item.qtd : 0;
    });

    const curvaABCClientes = Object.entries(acc.abc)
        .map(([name, value]) => ({
            name,
            value: totalMovimentado > 0 ? (value / totalMovimentado) * 100 : 0
        }))
        .sort((a, b) => ["A", "B", "C"].indexOf(a.name) - ["A", "B", "C"].indexOf(b.name));

    const curvaXYZClientes = Object.entries(acc.xyz)
        .map(([name, value]) => ({
            name,
            value: totalMovimentado > 0 ? (value / totalMovimentado) * 100 : 0
        }))
        .sort((a, b) => ["X", "Y", "Z"].indexOf(a.name) - ["X", "Y", "Z"].indexOf(b.name));

    const rankingClientes = mapToMetricArray(acc.clientes, "valor", "desc");
    const categoriasPizza = mapToMetricArray(acc.categorias, "value", "asc");
    const produtosRanking = mapToMetricArray(acc.produtos, "valor", "desc");
    const fornecedoresRanking = mapToMetricArray(acc.fornecedores, "valor", "desc");
    const mapaUF = Object.values(acc.estados);

    const variationValorTotal = getKpiVariation(historicoValores);
    const variationConsumo = getKpiVariation(historicoConsumo);
    const variationTicket = getKpiVariation(ticketMedioMensal);
    const consumoMedioMensal = historicoMeses.length > 0 ? totalMovimentado / historicoMeses.length : 0;

    return {
        kpis: {
            "Maior Cliente": rankingClientes[0]?.name || "-",
            "Valor Total Movimentado": {
                value: totalMovimentado,
                variation: variationValorTotal
            },
            "Consumo Médio Mensal": {
                value: consumoMedioMensal,
                variation: variationConsumo
            },
            "Ticket Médio": {
                value: totalPedidos > 0 ? somaTickets / totalPedidos : 0,
                variation: variationTicket
            },
            percentualGlosaClientes: totalPedidos > 0 ? (pedidosCancelados / totalPedidos) * 100 : 0
        },
        overview: {
            historicoMeses,
            historicoValores,
            rankingClientes,
            categoriasPizza,
            curvaABCClientes,
            curvaXYZClientes,
            ticketMedioMensal,
            produtosRanking,
            fornecedoresRanking,
            mapaUF,
            slaClientes: totalPedidos > 0 ? (pedidosEntregues / totalPedidos) * 100 : 0
        },
        alertas: {
            miniCards: {
                clientesPendentes: pedidosAtrasados > 0 ? pedidosAtrasados : 0,
                fornecedoresCriticos: new Set(
                    analytics
                        .filter(row => row.status === "Atrasado")
                        .map(row => row.fornecedor)
                ).size,
                pedidosAtrasados
            }
        },
        operacionais: {
            tabela: analytics
        }
    };
};

export const buildClientsAvailableFilters = (rows = []) => ({
    availableClients: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableSuppliers: buildOptionsFromRows(rows, "supplier_id", "supplier_name"),
    availableCategorias: buildUniqueStringList(rows, "product_class_material_name"),
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name")
});
