import {
    buildOptionsFromRows,
    buildOrderOptions,
    buildUniqueStringList,
    cleanString
} from "./shared/dashboardSelectors";

export const normalizeQuotationsTable = (rows = []) =>
    rows.map(row => {
        const quantidade = Number(row.quantity_requested) || 0;
        const valorTotal = Number(row.total_amount) || 0;
        const status = cleanString(row.item_status || row.quotation_status)?.toLowerCase();

        return {
            ...row,
            data: row.order_date,
            quantidade,
            valorTotal,
            valorUnitario: quantidade ? valorTotal / quantidade : 0,
            cliente: cleanString(row.client_name),
            fornecedor: cleanString(row.supplier_name),
            produto: cleanString(row.product_name),
            categoria: cleanString(row.product_class_material_name),
            uf: cleanString(row.client_state),
            item_status: status,
            status
        };
    });

export const normalizeQuotationsAnalytics = (rows = []) =>
    rows.map(row => ({
        ...row,
        cliente: cleanString(row.client_name),
        fornecedor: cleanString(row.supplier_name),
        produto: cleanString(row.product_name),
        categoria: cleanString(row.product_class_material_name),
        uf: cleanString(row.client_state),
        valorTotal: Number(row.sum_total_amount) || 0,
        valorUnitario: Number(row.avg_unit_price) || 0
    }));

export const buildQuotationsAvailableFilters = (rows = []) => ({
    availableClients: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableSuppliers: buildOptionsFromRows(rows, "supplier_id", "supplier_name"),
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableOrders: buildOrderOptions(rows, "quotation_code"),
    availableNumeroCotacao: buildUniqueStringList(rows, "quotation_code"),
    availableCategorias: buildUniqueStringList(rows, "product_class_material_name")
});
