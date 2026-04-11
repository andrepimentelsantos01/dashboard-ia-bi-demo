import {
    buildOptionsFromRows,
    buildOrderOptions,
    buildUniqueStringList,
    cleanString
} from "./shared/dashboardSelectors";
import { getKpiVariation } from "../hooks/useKpiVariation";

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

export const buildQuotationsDerivedKpis = (analytics = [], rawKpis = {}) => {
    const monthly = analytics.reduce((acc, row) => {
        const monthKey = row.year_months;
        if (!monthKey) return acc;

        if (!acc[monthKey]) {
            acc[monthKey] = {
                totalAmountFinalized: 0,
                finalizedQuotations: 0,
                totalQuotations: 0,
                lowestPrice: null
            };
        }

        acc[monthKey].totalQuotations += 1;

        const unitPrice = Number(row.valorUnitario) || 0;
        if (acc[monthKey].lowestPrice === null || unitPrice < acc[monthKey].lowestPrice) {
            acc[monthKey].lowestPrice = unitPrice;
        }

        if (row.quotation_status === "finalized") {
            acc[monthKey].finalizedQuotations += 1;
            acc[monthKey].totalAmountFinalized += Number(row.valorTotal) || 0;
        }

        return acc;
    }, {});

    const months = Object.keys(monthly).sort();

    return {
        total_amount_finalized: {
            value: rawKpis.total_amount_finalized,
            variation: getKpiVariation(months.map((month) => monthly[month].totalAmountFinalized))
        },
        finalized_quotations: {
            value: rawKpis.finalized_quotations,
            variation: getKpiVariation(months.map((month) => monthly[month].finalizedQuotations))
        },
        total_quotations: {
            value: rawKpis.total_quotations,
            variation: getKpiVariation(months.map((month) => monthly[month].totalQuotations))
        },
        lowest_price: {
            value: rawKpis.lowest_price,
            variation: getKpiVariation(months.map((month) => monthly[month].lowestPrice ?? 0))
        },
        open_quotations: rawKpis.open_quotations
    };
};

export const buildQuotationsAvailableFilters = (rows = []) => ({
    availableClients: buildOptionsFromRows(rows, "client_id", "client_name"),
    availableSuppliers: buildOptionsFromRows(rows, "supplier_id", "supplier_name"),
    availableProdutos: buildOptionsFromRows(rows, "product_id", "product_name"),
    availableOrders: buildOrderOptions(rows, "quotation_code"),
    availableNumeroCotacao: buildUniqueStringList(rows, "quotation_code"),
    availableCategorias: buildUniqueStringList(rows, "product_class_material_name")
});
