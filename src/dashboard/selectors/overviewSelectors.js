import {
    buildOptionsFromRows,
    buildOrderOptions,
    formatCurrency
} from "./shared/dashboardSelectors";

export const normalizeOverviewAnalytics = (rows = []) =>
    rows.map(row => {
        const quantity = Number(row.quantity_requested) || 0;
        const total = Number(row.total_amount) || 0;

        return {
            ...row,
            quantidade: quantity,
            valorTotal: total,
            valorUnitario: quantity ? total / quantity : 0,
            quantity,
            total
        };
    });

export const normalizeOverviewTable = (rows = []) =>
    rows.map(row => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;

        return {
            ...row,
            data: row.order_date,
            quantidade,
            valorTotal,
            valorUnitario: quantidade ? valorTotal / quantidade : 0,
            categoria: row.product_class_material_name,
            fornecedor: row.supplier_name,
            produto: row.product_name,
            cliente: row.client_name,
            status: row.item_status
        };
    });

export const buildOverviewDerivedData = (analytics = []) => {
    const acc = {
        historico: {},
        categorias: {},
        produtos: {},
        clientes: {},
        fornecedores: {},
        status: {},
        estados: {},
        unitPrice: {}
    };

    analytics.forEach(row => {
        const value = Number(row.sum_total_amount) || 0;
        const monthKey = row.year_months;

        if (monthKey) {
            if (!acc.historico[monthKey]) {
                acc.historico[monthKey] = { time_bucket: monthKey, metric_value: 0 };
            }
            acc.historico[monthKey].metric_value += value;
        }

        const categoria = row.product_class_material_name || "Sem categoria";
        if (!acc.categorias[categoria]) {
            acc.categorias[categoria] = { name: categoria, value: 0, type: "categoria" };
        }
        acc.categorias[categoria].value += value;

        const produto = row.product_name || "Produto nao informado";
        if (!acc.produtos[produto]) {
            acc.produtos[produto] = { name: produto, valor: 0, type: "produto" };
        }
        acc.produtos[produto].valor += value;

        const cliente = row.client_name || "Cliente nao informado";
        if (!acc.clientes[cliente]) {
            acc.clientes[cliente] = { name: cliente, valor: 0, type: "cliente" };
        }
        acc.clientes[cliente].valor += value;

        const fornecedor = row.supplier_name || "Fornecedor nao informado";
        if (!acc.fornecedores[fornecedor]) {
            acc.fornecedores[fornecedor] = { name: fornecedor, valor: 0, type: "fornecedor" };
        }
        acc.fornecedores[fornecedor].valor += value;

        const status = row.item_status || "Sem status";
        if (!acc.status[status]) acc.status[status] = { name: status, value: 0 };
        acc.status[status].value += 1;

        const uf = row.client_state || "NA";
        if (!acc.estados[uf]) acc.estados[uf] = { uf, valorTotal: 0, quantidade: 0 };
        acc.estados[uf].valorTotal += value;
        acc.estados[uf].quantidade += Number(row.sum_quantity) || 0;

        if (monthKey) {
            if (!acc.unitPrice[monthKey]) {
                acc.unitPrice[monthKey] = { time_bucket: monthKey, total: 0, qty: 0 };
            }
            acc.unitPrice[monthKey].total += Number(row.valorTotal) || 0;
            acc.unitPrice[monthKey].qty += Number(row.quantidade) || 0;
        }
    });

    const historicoFinanceiro = Object.values(acc.historico).sort((a, b) =>
        String(a.time_bucket).localeCompare(String(b.time_bucket))
    );

    return {
        historicoMeses: historicoFinanceiro.map(row => row.time_bucket),
        historicoValores: historicoFinanceiro.map(row => row.metric_value),
        categoriasPizza: Object.values(acc.categorias),
        produtosRanking: Object.values(acc.produtos),
        rankingClientes: Object.values(acc.clientes),
        fornecedoresEntrega: Object.values(acc.fornecedores),
        deliveryStatus: Object.values(acc.status),
        clientsByState: Object.values(acc.estados),
        unitPriceEvolution: Object.values(acc.unitPrice).map(row => ({
            time_bucket: row.time_bucket,
            metric_value: row.qty ? row.total / row.qty : 0
        }))
    };
};

export const buildOverviewAvailableFilters = (analytics = [], tableRows = []) => ({
    availableClients: buildOptionsFromRows(analytics, "client_id", "client_name"),
    availableSuppliers: buildOptionsFromRows(analytics, "supplier_id", "supplier_name"),
    availableCategorias: [...new Set(analytics.map(row => row.product_class_material_name).filter(Boolean))],
    availableProdutos: buildOptionsFromRows(analytics, "product_id", "product_name"),
    availableOrders: buildOrderOptions(tableRows)
});

export const adaptOverviewKpis = (kpis = {}) => ({
    valorTotalMovimentado: formatCurrency(kpis.total_amount_moved),
    valorEntregue: formatCurrency(kpis.total_amount_delivered),
    volumeTotal: kpis.total_volume_products,
    quantidadeClientes: kpis.total_clients,
    clientesComAtraso: kpis.clients_with_delay,
    fornecedoresComAtraso: kpis.suppliers_with_delay,
    pedidosComAtraso: kpis.orders_with_delay,
    variationValorTotalMovimentado: null,
    variationValorEntregue: null,
    variationVolumeTotal: null,
    variationQuantidadeClientes: null
});
