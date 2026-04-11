import {
    buildOptionsFromRows,
    buildOrderOptions
} from "./shared/dashboardSelectors.js";

export const normalizeOverviewAnalytics = (rows = []) =>
    rows.map((row) => {
        const quantity = Number(row.quantity_requested) || 0;
        const total = Number(row.total_amount) || 0;
        const status = row.logistics_status || row.item_status;

        return {
            ...row,
            quantidade: quantity,
            valorTotal: total,
            valorUnitario: quantity ? total / quantity : 0,
            status,
            quantity,
            total,
            region: row.region || row.product_class_material_name,
            operatingProfit: Number(row.operating_profit) || 0,
            operatingMargin: Number(row.operating_margin) || 0,
            salesMethod: row.sales_method || status
        };
    });

export const normalizeOverviewTable = (rows = []) =>
    rows.map((row) => {
        const quantity = Number(row.quantity_requested) || 0;
        const quantidade = quantity;
        const valorTotal = Number(row.total_amount) || 0;
        const status = row.logistics_status || row.item_status;

        return {
            ...row,
            data: row.order_date,
            quantidade,
            valorTotal,
            valorUnitario: quantidade ? valorTotal / quantidade : 0,
            categoria: row.region || row.product_class_material_name,
            fornecedor: row.supplier_name,
            produto: row.product_name,
            cliente: row.client_name,
            item_status: status,
            status,
            currency_code: row.currency_code || "BRL",
            region: row.region || row.product_class_material_name,
            sales_method: row.sales_method || status,
            operating_profit: Number(row.operating_profit) || 0,
            operating_margin_percent: Number(row.operating_margin || 0) * 100
        };
    });

export const buildOverviewDerivedData = (analytics = []) => {
    const acc = {
        historico: {},
        historicoQuantidade: {},
        regioes: {},
        regioesQuantidade: {},
        produtos: {},
        produtosQuantidade: {},
        clientes: {},
        clientesQuantidade: {},
        fornecedores: {},
        fornecedoresQuantidade: {},
        status: {},
        unitPrice: {}
    };

    analytics.forEach((row) => {
        const value = Number(row.sum_total_amount ?? row.valorTotal ?? row.total ?? 0) || 0;
        const quantity = Number(row.sum_quantity ?? row.quantidade ?? row.quantity ?? 0) || 0;
        const monthKey = row.year_months;

        if (monthKey) {
            if (!acc.historico[monthKey]) {
                acc.historico[monthKey] = { time_bucket: monthKey, metric_value: 0 };
            }

            acc.historico[monthKey].metric_value += value;

            if (!acc.historicoQuantidade[monthKey]) {
                acc.historicoQuantidade[monthKey] = { time_bucket: monthKey, metric_value: 0 };
            }

            acc.historicoQuantidade[monthKey].metric_value += quantity;
        }

        const regiao = row.region || row.product_class_material_name || "Sem regi\u00e3o";
        if (!acc.regioes[regiao]) {
            acc.regioes[regiao] = { name: regiao, value: 0, type: "categoria" };
        }
        acc.regioes[regiao].value += value;

        if (!acc.regioesQuantidade[regiao]) {
            acc.regioesQuantidade[regiao] = { name: regiao, valor: 0, type: "categoria" };
        }
        acc.regioesQuantidade[regiao].valor += quantity;

        const produto = row.product_name || "Produto nao informado";
        if (!acc.produtos[produto]) {
            acc.produtos[produto] = { name: produto, valor: 0, type: "produto" };
        }
        acc.produtos[produto].valor += value;

        if (!acc.produtosQuantidade[produto]) {
            acc.produtosQuantidade[produto] = { name: produto, valor: 0, type: "produto" };
        }
        acc.produtosQuantidade[produto].valor += quantity;

        const cliente = row.client_name || "Estado nao informado";
        if (!acc.clientes[cliente]) {
            acc.clientes[cliente] = { name: cliente, valor: 0, type: "cliente" };
        }
        acc.clientes[cliente].valor += value;

        if (!acc.clientesQuantidade[cliente]) {
            acc.clientesQuantidade[cliente] = { name: cliente, valor: 0, type: "cliente" };
        }
        acc.clientesQuantidade[cliente].valor += quantity;

        const fornecedor = row.supplier_name || "Retailer nao informado";
        if (!acc.fornecedores[fornecedor]) {
            acc.fornecedores[fornecedor] = { name: fornecedor, valor: 0, type: "fornecedor" };
        }
        acc.fornecedores[fornecedor].valor += value;

        if (!acc.fornecedoresQuantidade[fornecedor]) {
            acc.fornecedoresQuantidade[fornecedor] = { name: fornecedor, valor: 0, type: "fornecedor" };
        }
        acc.fornecedoresQuantidade[fornecedor].valor += quantity;

        const status = row.salesMethod || row.logistics_status || row.item_status || "Sem status";
        if (!acc.status[status]) {
            acc.status[status] = {
                name: status,
                statusKey: status,
                value: 0,
                volume: 0,
                regiaoValor: {},
                fornecedorValor: {},
                produtoValor: {},
                clientes: new Set(),
                filterPayload: {
                    type: "status",
                    value: status
                }
            };
        }
        acc.status[status].value += 1;
        acc.status[status].volume += quantity;
        acc.status[status].regiaoValor[regiao] = (acc.status[status].regiaoValor[regiao] || 0) + value;
        acc.status[status].fornecedorValor[fornecedor] =
            (acc.status[status].fornecedorValor[fornecedor] || 0) + value;
        acc.status[status].produtoValor[produto] = (acc.status[status].produtoValor[produto] || 0) + value;
        acc.status[status].clientes.add(cliente);

        if (monthKey) {
            if (!acc.unitPrice[monthKey]) {
                acc.unitPrice[monthKey] = { time_bucket: monthKey, total: 0, qty: 0 };
            }
            acc.unitPrice[monthKey].total += Number(row.valorTotal ?? row.sum_total_amount ?? 0) || 0;
            acc.unitPrice[monthKey].qty += Number(row.quantidade ?? row.sum_quantity ?? 0) || 0;
        }
    });

    const historicoFinanceiro = Object.values(acc.historico).sort((a, b) =>
        String(a.time_bucket).localeCompare(String(b.time_bucket))
    );

    return {
        historicoMeses: historicoFinanceiro.map((row) => row.time_bucket),
        historicoValores: historicoFinanceiro.map((row) => row.metric_value),
        historicoQuantidades: Object.values(acc.historicoQuantidade)
            .sort((a, b) => String(a.time_bucket).localeCompare(String(b.time_bucket)))
            .map((row) => row.metric_value),
        categoriasPizza: Object.values(acc.regioes),
        rankingRegioes: Object.values(acc.regioes),
        rankingRegioesQuantidade: Object.values(acc.regioesQuantidade),
        produtosRanking: Object.values(acc.produtos),
        produtosRankingQuantidade: Object.values(acc.produtosQuantidade),
        rankingClientes: Object.values(acc.clientes),
        rankingClientesQuantidade: Object.values(acc.clientesQuantidade),
        fornecedoresEntrega: Object.values(acc.fornecedores),
        fornecedoresEntregaQuantidade: Object.values(acc.fornecedoresQuantidade),
        salesMethodTreemap: Object.values(acc.status).map((row) => ({
            name: row.name,
            statusKey: row.statusKey,
            value: row.value,
            volume: row.volume,
            categoriaLeaderValor:
                Object.entries(row.regiaoValor).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
            categoriaLeaderQtd:
                Object.entries(row.regiaoValor).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
            fornecedorLeaderValor:
                Object.entries(row.fornecedorValor).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
            fornecedorLeaderQtd:
                Object.entries(row.fornecedorValor).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
            produtoLeaderValor:
                Object.entries(row.produtoValor).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
            produtoLeaderQtd:
                Object.entries(row.produtoValor).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
            clientesAtendidos: row.clientes.size,
            filterPayload: row.filterPayload
        })),
        unitPriceEvolution: Object.values(acc.unitPrice).map((row) => ({
            time_bucket: row.time_bucket,
            metric_value: row.qty ? row.total / row.qty : 0
        }))
    };
};

export const buildOverviewAvailableFilters = (analytics = [], tableRows = []) => ({
    availableClients: buildOptionsFromRows(analytics, "client_id", "client_name"),
    availableSuppliers: buildOptionsFromRows(analytics, "supplier_id", "supplier_name"),
    availableCategorias: [...new Set(analytics.map((row) => row.product_class_material_name).filter(Boolean))],
    availableProdutos: buildOptionsFromRows(analytics, "product_id", "product_name"),
    availableOrders: buildOrderOptions(tableRows),
    availableStatus: [...new Set(analytics.map((row) => row.salesMethod || row.status).filter(Boolean))].map((name) => ({
        id: name,
        name
    }))
});

export const adaptOverviewKpis = (kpis = {}, overviewData = {}) => ({
    ...kpis
});
