import overviewMock from "../mocks/dashboard/dashboardOverview.mock.json";
import ordersMock from "../mocks/dashboard/dashboardOrders.mock.json";
import productsMock from "../mocks/dashboard/dashboardProducts.mock.json";
import clientsMock from "../mocks/dashboard/dashboardClients.mock.json";
import suppliersMock from "../mocks/dashboard/dashboardSuppliers.mock.json";
import quotationsMock from "../mocks/dashboard/dashboardQuotations.mock.json";
import { applyDerivedClassifications } from "../dashboard/selectors/shared/classificationSelectors";
import { normalizeStatusLabel, slugifyStatus } from "../dashboard/selectors/shared/dashboardStatus";

const safeDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    const dateOnlyMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const localDate = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(localDate.getTime()) ? null : localDate;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toYearMonth = (value) => {
  const date = safeDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const compareDateRange = (dateValue, range) => {
  if (!range?.start && !range?.end) return true;
  const value = safeDate(dateValue);
  if (!value) return false;
  const start = safeDate(range.start);
  const end = safeDate(range.end);

  if (start && value < start) return false;
  if (end && value > end) return false;
  return true;
};

const buildIndexMap = (values, prefix) => {
  const map = new Map();
  let index = 1;

  values.forEach((value) => {
    if (!value || map.has(value)) return;
    map.set(value, `${prefix}-${index}`);
    index += 1;
  });

  return map;
};

const normalizeRows = (rows, config) => {
  const {
    dateKey,
    orderKey,
    quotationKey,
    quantityKey = "quantidade",
    totalKey = "valorTotal",
    unitKey = "valorUnitario",
    statusKey = "status",
    classAbcKey,
    classXyzKey,
    glosaKey = "glosa"
  } = config;

  const clientIds = buildIndexMap(rows.map((row) => row.cliente), "client");
  const supplierIds = buildIndexMap(rows.map((row) => row.fornecedor), "supplier");
  const productIds = buildIndexMap(rows.map((row) => row.produto), "product");

  return rows.map((row, index) => {
    const quantity = Number(row[quantityKey] || 0);
    const total = Number(row[totalKey] || 0);
    const unitPrice = Number(row[unitKey] || 0);
    const orderDate = row[dateKey] || null;
    const clientName = row.cliente || null;
    const supplierName = row.fornecedor || null;
    const productName = row.produto || null;
    const categoryName = row.categoria || null;
    const clientState = row.uf || null;
    const purchaseOrderId =
      row[orderKey] ?? row.numeroPedido ?? row.ordemCompra ?? null;
    const quotationCode = row[quotationKey] ?? row.numeroCotacao ?? null;
    const rawItemStatus = row[statusKey] || null;
    const logisticsStatus = normalizeStatusLabel(rawItemStatus, { fallback: null });
    const itemStatus = logisticsStatus || rawItemStatus;

    return {
      row_id: index + 1,
      client_id: clientIds.get(clientName) || null,
      client_name: clientName,
      supplier_id: supplierIds.get(supplierName) || null,
      supplier_name: supplierName,
      product_id: productIds.get(productName) || null,
      product_name: productName,
      product_class_material_name: categoryName,
      client_state: clientState,
      order_date: orderDate,
      year_months: toYearMonth(orderDate),
      purchase_order_id: purchaseOrderId,
      quotation_code: quotationCode,
      quantity_requested: quantity,
      sum_quantity_requested: quantity,
      sum_quantity: quantity,
      total_amount: total,
      sum_total_amount: total,
      avg_unit_price: unitPrice || (quantity ? total / quantity : 0),
      unit_price: unitPrice || (quantity ? total / quantity : 0),
      item_status: itemStatus,
      order_status: itemStatus,
      logistics_status: logisticsStatus,
      quotation_status: slugifyStatus(rawItemStatus || itemStatus),
      glosa: Number(row[glosaKey] || 0),
      sum_glosa_amount: Number(row[glosaKey] || 0),
      abc_classification: classAbcKey ? row[classAbcKey] || null : null,
      xyz_classification: classXyzKey ? row[classXyzKey] || null : null,
      classificacaoABC: classAbcKey ? row[classAbcKey] || null : null,
      classificacaoXYZ: classXyzKey ? row[classXyzKey] || null : null
    };
  });
};

const applyCommonFilters = (rows, filters = {}) => {
  const matchesFilter = (filterValue, rowValue, normalize = (value) => value) => {
    if (filterValue === undefined || filterValue === null || filterValue === "") return true;

    if (Array.isArray(filterValue)) {
      return filterValue.some((value) => normalize(value) === normalize(rowValue));
    }

    return normalize(filterValue) === normalize(rowValue);
  };

  return rows.filter((row) => {
    if (!matchesFilter(filters.client_id, row.client_id)) return false;
    if (!matchesFilter(filters.supplier_id, row.supplier_id)) return false;
    if (!matchesFilter(filters.product_id, row.product_id)) return false;
    if (
      filters.product_class_material_name?.length &&
      !filters.product_class_material_name.includes(row.product_class_material_name)
    ) {
      return false;
    }
    if (!matchesFilter(filters.item_status, row.item_status)) return false;
    if (
      filters.quotation_status &&
      !matchesFilter(filters.quotation_status, row.quotation_status, slugifyStatus)
    ) {
      return false;
    }
    if (filters.client_state && row.client_state !== filters.client_state) return false;
    if (
      filters.purchase_order_id &&
      !matchesFilter(filters.purchase_order_id, row.purchase_order_id, (value) => String(value))
    ) {
      return false;
    }
    if (
      filters.quotation_code &&
      !matchesFilter(filters.quotation_code, row.quotation_code, (value) => String(value))
    ) {
      return false;
    }
    if (filters.year_months && row.year_months !== filters.year_months) return false;
    if (filters.classificacao_abc && row.classificacaoABC !== filters.classificacao_abc) {
      return false;
    }
    if (filters.classificacao_xyz && row.classificacaoXYZ !== filters.classificacao_xyz) {
      return false;
    }
    if (filters.order_date && !compareDateRange(row.order_date, filters.order_date)) {
      return false;
    }
    return true;
  });
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const countDistinct = (rows, key) => new Set(rows.map((row) => row[key]).filter(Boolean)).size;

const overviewRows = normalizeRows(overviewMock.tabelaConsolidada, {
  dateKey: "data",
  orderKey: "pedido"
});

const ordersRows = normalizeRows(ordersMock.tabelaPedidos, {
  dateKey: "dataCriacao",
  orderKey: "pedidoId"
});

const productsRows = normalizeRows(productsMock.tabelaProdutos, {
  dateKey: "data",
  orderKey: "pedido",
  classAbcKey: "classificacaoABC",
  classXyzKey: "classificacaoXYZ"
});

const clientsRows = normalizeRows(clientsMock.tabelaClientes, {
  dateKey: "data",
  orderKey: "id",
  classAbcKey: "classificacaoABC",
  classXyzKey: "classificacaoXYZ"
});

const suppliersRows = applyDerivedClassifications(
  normalizeRows(suppliersMock.tabelaFornecedores, {
    dateKey: "data",
    orderKey: "numeroPedido",
    quotationKey: "numeroCotacao"
  }).map((row) => ({
    ...row,
    fornecedor: row.supplier_name,
    valorTotal: row.total_amount,
    quantidade: row.quantity_requested
  })),
  {
    entityKey: "fornecedor"
  }
).map(({ fornecedor, valorTotal, quantidade, ...row }) => row);

const quotationsRows = normalizeRows(quotationsMock.tabelaCotas, {
  dateKey: "data",
  orderKey: "ordemCompra",
  quotationKey: "numeroCotacao"
});

const buildOverviewResponse = (rows) => {
  const totalAmount = rows.reduce((sum, row) => sum + row.sum_total_amount, 0);
  const delivered = rows
    .filter((row) => (row.logistics_status || row.item_status) === "Entregue")
    .reduce((sum, row) => sum + row.sum_total_amount, 0);

  return {
    kpis: {
      total_amount_moved: totalAmount,
      total_amount_delivered: delivered,
      total_volume_products: rows.reduce((sum, row) => sum + row.sum_quantity, 0),
      total_clients: countDistinct(rows, "client_id"),
      clients_with_delay: countDistinct(
        rows.filter((row) => (row.logistics_status || row.item_status) === "Atrasado"),
        "client_id"
      ),
      suppliers_with_delay: countDistinct(
        rows.filter((row) => (row.logistics_status || row.item_status) === "Atrasado"),
        "supplier_id"
      ),
      orders_with_delay: rows.filter(
        (row) => (row.logistics_status || row.item_status) === "Atrasado"
      ).length
    },
    fact: rows,
    table: rows
  };
};

const buildQuotationsResponse = (rows) => {
  const finalizedRows = rows.filter((row) => row.quotation_status === "finalized");

  return {
    kpis: {
      total_amount_finalized: formatCurrency(
        finalizedRows.reduce((sum, row) => sum + row.sum_total_amount, 0)
      ),
      finalized_quotations: finalizedRows.length,
      total_quotations: rows.length,
      lowest_price: formatCurrency(
        rows.length
          ? Math.min(...rows.map((row) => Number(row.avg_unit_price || 0)))
          : 0
      ),
      open_quotations: rows.filter((row) => row.quotation_status === "under_quotation").length
    },
    fact: rows,
    table: rows
  };
};

const delay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 120));
};

export const biOverview = async (filters = {}) => {
  await delay();
  return buildOverviewResponse(applyCommonFilters(overviewRows, filters));
};

export const biOrdersLogistics = async (filters = {}) => {
  await delay();
  return {
    fact: applyCommonFilters(ordersRows, filters)
  };
};

export const biProducts = async (filters = {}) => {
  await delay();
  return {
    fact: applyCommonFilters(productsRows, filters)
  };
};

export const biClients = async (filters = {}) => {
  await delay();
  return {
    fact: applyCommonFilters(clientsRows, filters)
  };
};

export const biSuppliers = async (filters = {}) => {
  await delay();
  return {
    fact: applyCommonFilters(suppliersRows, filters)
  };
};

export const biQuotations = async (filters = {}) => {
  await delay();
  return buildQuotationsResponse(applyCommonFilters(quotationsRows, filters));
};
