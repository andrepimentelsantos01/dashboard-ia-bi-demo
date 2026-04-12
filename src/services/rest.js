import overviewMock from "../mocks/dashboard/dashboardOverview.mock.json";
import ordersMock from "../mocks/dashboard/dashboardOrders.mock.json";
import productsMock from "../mocks/dashboard/dashboardProducts.mock.json";
import clientsMock from "../mocks/dashboard/dashboardClients.mock.json";
import suppliersMock from "../mocks/dashboard/dashboardSuppliers.mock.json";
import quotationsMock from "../mocks/dashboard/dashboardQuotations.mock.json";
import adidasSalesRows from "../mocks/datasetReal/adidasUsSales.json";
import amazonSalesCsvRaw from "../mocks/datasetReal/Amazon Sales 2025 Dataset.csv?raw";
import restaurantSalesCsvRaw from "../mocks/datasetReal/Restaurant Sales Dataset.csv?raw";
import logisticsShipmentsCsvRaw from "../mocks/datasetReal/Logistics Shipments Dataset.csv?raw";
import { normalizeStatusLabel, slugifyStatus } from "../dashboard/selectors/shared/dashboardStatus";
import { formatCurrencyValue } from "../dashboard/utils/intlFormat";

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

const normalizeToken = (value, fallback) =>
  String(value || fallback || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseNumericValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === "") return 0;

  const normalized = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!normalized) return 0;

  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    return Number(normalized.replace(/,/g, "")) || 0;
  }

  if (commaCount > 0) {
    const lastCommaIndex = normalized.lastIndexOf(",");
    const digitsAfterComma = normalized.length - lastCommaIndex - 1;

    if (commaCount > 1 || digitsAfterComma === 3) {
      return Number(normalized.replace(/,/g, "")) || 0;
    }

    return Number(normalized.replace(",", ".")) || 0;
  }

  return Number(normalized) || 0;
};

const parsePercentValue = (value) => {
  const numeric = parseNumericValue(value);
  if (!numeric) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
};

const parseCsvLine = (line = "") => {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (insideQuotes && nextChar === "\"") {
        current += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
};

const parseCsvRows = (raw = "") => {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine);

  return dataLines.map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
};

const parseDayFirstDate = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{2})-(\d{2})-(\d{2}|\d{4})$/);

  if (!match) return safeDate(value);

  const [, day, month, yearToken] = match;
  const year = yearToken.length === 2 ? 2000 + Number(yearToken) : Number(yearToken);
  const date = new Date(year, Number(month) - 1, Number(day));

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseRestaurantDate = (value) => {
  if (!value) return null;

  const raw = String(value).trim();

  if (raw.includes("/")) {
    const [month, day, year] = raw.split("/").map((part) => Number(part));
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dayFirst = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dayFirst) return safeDate(raw);

  const [, day, month, year] = dayFirst;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
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
    if (!matchesFilter(filters.customer_name, row.customer_name || row.client_name)) return false;
    if (!matchesFilter(filters.customer_location, row.customer_location)) return false;
    if (!matchesFilter(filters.payment_method, row.payment_method || row.supplier_name)) return false;
    if (!matchesFilter(filters.origin_warehouse, row.origin_warehouse || row.product_class_material_name)) return false;
    if (!matchesFilter(filters.destination, row.destination || row.client_name)) return false;
    if (!matchesFilter(filters.carrier, row.carrier || row.supplier_name)) return false;
    if (!matchesFilter(filters.time_of_sale, row.time_of_sale || row.client_name)) return false;
    if (!matchesFilter(filters.received_by, row.received_by || row.supplier_name)) return false;
    if (!matchesFilter(filters.transaction_type, row.transaction_type || row.item_status)) return false;
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

const formatUsdCurrency = (value) =>
  formatCurrencyValue(value, {
    currencyCode: "USD",
    locale: "en-US"
  });

const countDistinct = (rows, key) => new Set(rows.map((row) => row[key]).filter(Boolean)).size;

const buildAdidasPurchaseOrderId = (retailerId, index) =>
  `INV-${String(retailerId || "NA")}-${String(index + 1).padStart(5, "0")}`;

const buildAdidasClientId = (state) => `state-${normalizeToken(state, "unknown")}`;
const buildAdidasSupplierId = (retailer) => `retailer-${normalizeToken(retailer, "unknown")}`;
const buildAdidasProductId = (product) => `product-${normalizeToken(product, "unknown")}`;
const buildAmazonCustomerId = (customer) => `customer-${normalizeToken(customer, "unknown")}`;
const buildAmazonLocationId = (location) => `location-${normalizeToken(location, "unknown")}`;
const buildAmazonPaymentId = (paymentMethod) => `payment-${normalizeToken(paymentMethod, "unknown")}`;
const buildAmazonProductId = (product) => `amazon-product-${normalizeToken(product, "unknown")}`;
const buildRestaurantShiftId = (shift) => `shift-${normalizeToken(shift, "unknown")}`;
const buildRestaurantAttendantId = (attendant) => `attendant-${normalizeToken(attendant, "unknown")}`;
const buildRestaurantProductId = (product) => `restaurant-product-${normalizeToken(product, "unknown")}`;
const buildLogisticsWarehouseId = (warehouse) => `warehouse-${normalizeToken(warehouse, "unknown")}`;
const buildLogisticsCarrierId = (carrier) => `carrier-${normalizeToken(carrier, "unknown")}`;
const buildLogisticsRouteId = (route) => `route-${normalizeToken(route, "unknown")}`;
const buildLogisticsDestinationId = (destination) => `destination-${normalizeToken(destination, "unknown")}`;

const adidasOverviewRows = adidasSalesRows
  .map((row, index) => {
    const retailer = row.Retailer?.trim();
    const retailerId = row["Retailer ID"];
    const invoiceDate = safeDate(row["Invoice Date"]);
    const region = row.Region?.trim();
    const state = row.State?.trim();
    const city = row.City?.trim();
    const product = row.Product?.trim();
    const salesMethod = row["Sales Method"]?.trim();
    const unitsSold = parseNumericValue(row["Units Sold"]);
    const rawTotalSales = parseNumericValue(row["Total Sales"]);
    const pricePerUnit =
      parseNumericValue(row["Price per Unit"]) || (unitsSold ? rawTotalSales / unitsSold : 0);
    const expectedTotalSales = pricePerUnit && unitsSold ? pricePerUnit * unitsSold : 0;
    const totalSales =
      expectedTotalSales > 0 && rawTotalSales > expectedTotalSales
        && Math.abs(rawTotalSales / expectedTotalSales - 10) < 0.2
        ? expectedTotalSales
        : rawTotalSales;
    const rawOperatingProfit = parseNumericValue(row["Operating Profit"]);
    const operatingMargin = parsePercentValue(row["Operating Margin"]);
    const operatingProfit =
      operatingMargin > 0 && totalSales > 0
        ? totalSales * operatingMargin
        : (
          totalSales !== rawTotalSales && rawTotalSales > 0
            ? rawOperatingProfit * (totalSales / rawTotalSales)
            : rawOperatingProfit
        );

    if (!invoiceDate || !retailer || !region || !state || !product || !salesMethod) {
      return null;
    }

    return {
      row_id: index + 1,
      currency_code: "USD",
      client_id: buildAdidasClientId(state),
      client_name: state,
      client_city: city,
      client_state: state,
      supplier_id: buildAdidasSupplierId(retailer),
      supplier_name: retailer,
      product_id: buildAdidasProductId(product),
      product_name: product,
      product_class_material_name: region,
      order_date: invoiceDate.toISOString(),
      invoice_date: invoiceDate.toISOString(),
      year_months: toYearMonth(invoiceDate),
      purchase_order_id: buildAdidasPurchaseOrderId(retailerId, index),
      quantity_requested: unitsSold,
      sum_quantity_requested: unitsSold,
      sum_quantity: unitsSold,
      total_amount: totalSales,
      sum_total_amount: totalSales,
      avg_unit_price: pricePerUnit,
      unit_price: pricePerUnit,
      item_status: salesMethod,
      order_status: salesMethod,
      logistics_status: salesMethod,
      quotation_status: slugifyStatus(salesMethod),
      glosa: 0,
      sum_glosa_amount: 0,
      abc_classification: null,
      xyz_classification: null,
      classificacaoABC: null,
      classificacaoXYZ: null,
      region,
      sales_method: salesMethod,
      retailer_id: retailerId,
      operating_profit: operatingProfit,
      operating_margin: operatingMargin
    };
  })
  .filter(Boolean);

const amazonProductsRows = parseCsvRows(amazonSalesCsvRaw)
  .map((row, index) => {
    const orderDate = parseDayFirstDate(row.Date);
    const customerName = row["Customer Name"]?.trim();
    const customerLocation = row["Customer Location"]?.trim();
    const paymentMethod = row["Payment Method"]?.trim();
    const productName = row.Product?.trim();
    const categoryName = row.Category?.trim();
    const status = normalizeStatusLabel(row.Status?.trim(), { fallback: row.Status?.trim() || "Desconhecido" });
    const quantity = parseNumericValue(row.Quantity);
    const totalAmount = parseNumericValue(row["Total Sales"]);
    const unitPrice = parseNumericValue(row.Price) || (quantity ? totalAmount / quantity : 0);
    const orderId = row["Order ID"]?.trim() || `AMZ-${String(index + 1).padStart(5, "0")}`;

    if (!orderDate || !productName || !categoryName || !customerLocation || !paymentMethod || !status) {
      return null;
    }

    return {
      row_id: index + 1,
      currency_code: "USD",
      client_id: buildAmazonCustomerId(customerName),
      client_name: customerName,
      supplier_id: buildAmazonPaymentId(paymentMethod),
      supplier_name: paymentMethod,
      product_id: buildAmazonProductId(productName),
      product_name: productName,
      product_class_material_name: categoryName,
      customer_name: customerName,
      customer_location: customerLocation,
      location_id: buildAmazonLocationId(customerLocation),
      payment_method: paymentMethod,
      order_date: orderDate.toISOString(),
      year_months: toYearMonth(orderDate),
      purchase_order_id: orderId,
      quantity_requested: quantity,
      sum_quantity_requested: quantity,
      sum_quantity: quantity,
      total_amount: totalAmount,
      sum_total_amount: totalAmount,
      avg_unit_price: unitPrice,
      unit_price: unitPrice,
      item_status: status,
      order_status: status,
      logistics_status: status,
      quotation_status: slugifyStatus(status),
      glosa: 0,
      sum_glosa_amount: 0,
      abc_classification: null,
      xyz_classification: null,
      classificacaoABC: null,
      classificacaoXYZ: null
    };
  })
  .filter(Boolean);

const restaurantClientsRows = parseCsvRows(restaurantSalesCsvRaw)
  .map((row, index) => {
    const orderDate = parseRestaurantDate(row.date);
    const productName = row.item_name?.trim();
    const categoryName = row.item_type?.trim();
    const shift = row.time_of_sale?.trim();
    const attendant = row.received_by?.trim();
    const transactionType = row.transaction_type?.trim() || "Walk-in";
    const quantity = parseNumericValue(row.quantity);
    const totalAmount = parseNumericValue(row.transaction_amount);
    const unitPrice = parseNumericValue(row.item_price) || (quantity ? totalAmount / quantity : 0);
    const orderId = row.order_id?.trim() || `RST-${String(index + 1).padStart(5, "0")}`;

    if (!orderDate || !productName || !categoryName || !shift || !attendant) {
      return null;
    }

    return {
      row_id: index + 1,
      currency_code: "BRL",
      client_id: buildRestaurantShiftId(shift),
      client_name: shift,
      supplier_id: buildRestaurantAttendantId(attendant),
      supplier_name: attendant,
      product_id: buildRestaurantProductId(productName),
      product_name: productName,
      product_class_material_name: categoryName,
      customer_name: attendant,
      customer_location: shift,
      payment_method: transactionType,
      transaction_type: transactionType,
      time_of_sale: shift,
      received_by: attendant,
      order_date: orderDate.toISOString(),
      year_months: toYearMonth(orderDate),
      purchase_order_id: orderId,
      quantity_requested: quantity,
      sum_quantity_requested: quantity,
      sum_quantity: quantity,
      total_amount: totalAmount,
      sum_total_amount: totalAmount,
      avg_unit_price: unitPrice,
      unit_price: unitPrice,
      item_status: transactionType,
      order_status: transactionType,
      logistics_status: transactionType,
      quotation_status: slugifyStatus(transactionType),
      glosa: 0,
      sum_glosa_amount: 0,
      abc_classification: null,
      xyz_classification: null,
      classificacaoABC: null,
      classificacaoXYZ: null
    };
  })
  .filter(Boolean);

const logisticsSuppliersRows = parseCsvRows(logisticsShipmentsCsvRaw)
  .map((row, index) => {
    const shipmentDate = safeDate(row.Shipment_Date);
    const deliveryDate = safeDate(row.Delivery_Date);
    const originWarehouse = row.Origin_Warehouse?.trim();
    const destination = row.Destination?.trim();
    const carrier = row.Carrier?.trim();
    const rawStatus = row.Status?.trim();
    const status = normalizeStatusLabel(rawStatus, { fallback: rawStatus || "Desconhecido" });
    const shipmentId = row.Shipment_ID?.trim() || `SHP-${String(index + 1).padStart(5, "0")}`;
    const weightKg = parseNumericValue(row.Weight_kg);
    const cost = parseNumericValue(row.Cost);
    const distanceMiles = parseNumericValue(row.Distance_miles);
    const plannedTransitDays = parseNumericValue(row.Transit_Days);
    const actualTransitDays = shipmentDate && deliveryDate
      ? Math.max(
        0,
        Math.round((deliveryDate.getTime() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24))
      )
      : 0;
    const delayDays = Math.max(0, actualTransitDays - plannedTransitDays);
    const routeName = originWarehouse && destination
      ? `${originWarehouse} -> ${destination}`
      : destination || originWarehouse;
    const delivered = status === "Entregue";
    const exception = ["Atrasado", "Extraviado", "Devolvido"].includes(status);
    const onTime = delivered && actualTransitDays <= plannedTransitDays;

    if (!shipmentDate || !originWarehouse || !destination || !carrier || !status) {
      return null;
    }

    return {
      row_id: index + 1,
      currency_code: "USD",
      client_id: buildLogisticsDestinationId(destination),
      client_name: destination,
      supplier_id: buildLogisticsCarrierId(carrier),
      supplier_name: carrier,
      product_id: buildLogisticsRouteId(routeName),
      product_name: routeName,
      product_class_material_name: originWarehouse,
      origin_warehouse: originWarehouse,
      destination,
      carrier,
      route_name: routeName,
      warehouse_id: buildLogisticsWarehouseId(originWarehouse),
      shipment_id: shipmentId,
      order_date: shipmentDate.toISOString(),
      shipment_date: shipmentDate.toISOString(),
      expected_delivery_date: new Date(
        shipmentDate.getTime() + plannedTransitDays * 24 * 60 * 60 * 1000
      ).toISOString(),
      actual_delivery_date: deliveryDate ? deliveryDate.toISOString() : null,
      year_months: toYearMonth(shipmentDate),
      quantity_requested: weightKg,
      sum_quantity_requested: weightKg,
      sum_quantity: weightKg,
      weight_kg: weightKg,
      total_amount: cost,
      sum_total_amount: cost,
      avg_unit_price: weightKg ? cost / weightKg : cost,
      unit_price: weightKg ? cost / weightKg : cost,
      item_status: status,
      order_status: status,
      logistics_status: status,
      quotation_status: slugifyStatus(status),
      distance_miles: distanceMiles,
      transit_days: plannedTransitDays,
      actual_transit_days: actualTransitDays,
      delay_days: delayDays,
      on_time_flag: onTime,
      delivery_success_flag: delivered,
      exception_flag: exception,
      partial_delivery_flag: false,
      glosa: 0,
      sum_glosa_amount: 0,
      abc_classification: null,
      xyz_classification: null,
      classificacaoABC: null,
      classificacaoXYZ: null
    };
  })
  .filter(Boolean);

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

const suppliersRows = normalizeRows(suppliersMock.tabelaFornecedores, {
  dateKey: "data",
  orderKey: "numeroPedido",
  quotationKey: "numeroCotacao",
  classAbcKey: "classificacaoABC",
  classXyzKey: "classificacaoXYZ"
});

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

const buildAdidasOverviewResponse = (rows) => {
  const totalSales = rows.reduce((sum, row) => sum + Number(row.sum_total_amount || 0), 0);
  const totalProfit = rows.reduce((sum, row) => sum + Number(row.operating_profit || 0), 0);
  const totalUnits = rows.reduce((sum, row) => sum + Number(row.sum_quantity || 0), 0);
  const weightedMargin = totalSales > 0 ? totalProfit / totalSales : 0;
  const monthlyBuckets = rows.reduce((acc, row) => {
    const month = row.year_months;
    if (!month) return acc;

    if (!acc[month]) {
      acc[month] = {
        sales: 0,
        profit: 0,
        units: 0
      };
    }

    acc[month].sales += Number(row.sum_total_amount || 0);
    acc[month].profit += Number(row.operating_profit || 0);
    acc[month].units += Number(row.sum_quantity || 0);
    return acc;
  }, {});
  const orderedMonths = Object.keys(monthlyBuckets).sort();
  const currentMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 1]] || {
    sales: 0,
    profit: 0,
    units: 0
  };
  const previousMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 2]] || {
    sales: 0,
    profit: 0,
    units: 0
  };
  const currentMargin = currentMonth.sales > 0 ? currentMonth.profit / currentMonth.sales : 0;
  const previousMargin = previousMonth.sales > 0 ? previousMonth.profit / previousMonth.sales : 0;
  const calculateVariation = (current, previous) => {
    if (!previous && !current) return 0;
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    kpis: {
      "Receita Total": {
        value: formatUsdCurrency(totalSales),
        variation: calculateVariation(currentMonth.sales, previousMonth.sales)
      },
      "Lucro Operacional": {
        value: formatUsdCurrency(totalProfit),
        variation: calculateVariation(currentMonth.profit, previousMonth.profit)
      },
      "Margem Operacional M\u00e9dia": {
        value: `${(weightedMargin * 100).toFixed(1)}%`,
        variation: calculateVariation(currentMargin, previousMargin)
      },
      "Unidades Vendidas": {
        value: totalUnits.toLocaleString("pt-BR"),
        variation: calculateVariation(currentMonth.units, previousMonth.units)
      }
    },
    fact: rows,
    table: rows
  };
};

const buildAmazonProductsResponse = (rows) => {
  const totalSales = rows.reduce((sum, row) => sum + Number(row.sum_total_amount || 0), 0);
  const totalUnits = rows.reduce((sum, row) => sum + Number(row.sum_quantity || 0), 0);
  const totalOrders = rows.length;
  const completedOrders = rows.filter((row) => row.item_status === "Concluído").length;
  const monthlyBuckets = rows.reduce((acc, row) => {
    const month = row.year_months;
    if (!month) return acc;

    if (!acc[month]) {
      acc[month] = {
        sales: 0,
        orders: 0,
        units: 0
      };
    }

    acc[month].sales += Number(row.sum_total_amount || 0);
    acc[month].orders += 1;
    acc[month].units += Number(row.sum_quantity || 0);
    return acc;
  }, {});

  const orderedMonths = Object.keys(monthlyBuckets).sort();
  const currentMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 1]] || {
    sales: 0,
    orders: 0,
    units: 0
  };
  const previousMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 2]] || {
    sales: 0,
    orders: 0,
    units: 0
  };

  const calculateVariation = (current, previous) => {
    if (!previous && !current) return 0;
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    kpis: {
      "Receita Total": {
        value: formatUsdCurrency(totalSales),
        variation: calculateVariation(currentMonth.sales, previousMonth.sales)
      },
      Pedidos: {
        value: totalOrders.toLocaleString("en-US"),
        variation: calculateVariation(currentMonth.orders, previousMonth.orders)
      },
      "Ticket Médio": {
        value: formatUsdCurrency(totalOrders ? totalSales / totalOrders : 0),
        variation: calculateVariation(
          currentMonth.orders ? currentMonth.sales / currentMonth.orders : 0,
          previousMonth.orders ? previousMonth.sales / previousMonth.orders : 0
        )
      },
      "Unidades Vendidas": {
        value: totalUnits.toLocaleString("en-US"),
        variation: calculateVariation(currentMonth.units, previousMonth.units)
      }
    },
    alertas: {
      "Taxa de Conclusão": totalOrders ? `${((completedOrders / totalOrders) * 100).toFixed(1)}%` : "0%"
    },
    fact: rows,
    table: rows
  };
};

const buildRestaurantClientsResponse = (rows) => {
  const totalSales = rows.reduce((sum, row) => sum + Number(row.sum_total_amount || 0), 0);
  const totalUnits = rows.reduce((sum, row) => sum + Number(row.sum_quantity || 0), 0);
  const totalOrders = rows.length;
  const onlineOrders = rows.filter((row) => row.item_status === "Online").length;
  const monthlyBuckets = rows.reduce((acc, row) => {
    const month = row.year_months;
    if (!month) return acc;

    if (!acc[month]) {
      acc[month] = {
        sales: 0,
        orders: 0,
        units: 0
      };
    }

    acc[month].sales += Number(row.sum_total_amount || 0);
    acc[month].orders += 1;
    acc[month].units += Number(row.sum_quantity || 0);
    return acc;
  }, {});

  const orderedMonths = Object.keys(monthlyBuckets).sort();
  const currentMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 1]] || {
    sales: 0,
    orders: 0,
    units: 0
  };
  const previousMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 2]] || {
    sales: 0,
    orders: 0,
    units: 0
  };

  const calculateVariation = (current, previous) => {
    if (!previous && !current) return 0;
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    kpis: {
      "Receita Total": {
        value: formatCurrency(totalSales),
        variation: calculateVariation(currentMonth.sales, previousMonth.sales)
      },
      Pedidos: {
        value: totalOrders.toLocaleString("pt-BR"),
        variation: calculateVariation(currentMonth.orders, previousMonth.orders)
      },
      "Ticket Médio": {
        value: formatCurrency(totalOrders ? totalSales / totalOrders : 0),
        variation: calculateVariation(
          currentMonth.orders ? currentMonth.sales / currentMonth.orders : 0,
          previousMonth.orders ? previousMonth.sales / previousMonth.orders : 0
        )
      },
      "Itens Vendidos": {
        value: totalUnits.toLocaleString("pt-BR"),
        variation: calculateVariation(currentMonth.units, previousMonth.units)
      }
    },
    alertas: {
      "Participação Online": totalOrders ? `${((onlineOrders / totalOrders) * 100).toFixed(1)}%` : "0%"
    },
    fact: rows,
    table: rows
  };
};

const buildLogisticsSuppliersResponse = (rows) => {
  const totalCost = rows.reduce((sum, row) => sum + Number(row.sum_total_amount || 0), 0);
  const totalShipments = rows.length;
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight_kg || row.sum_quantity || 0), 0);
  const totalDelayDays = rows.reduce((sum, row) => sum + Number(row.delay_days || 0), 0);
  const monthlyBuckets = rows.reduce((acc, row) => {
    const month = row.year_months;
    if (!month) return acc;

    if (!acc[month]) {
      acc[month] = {
        cost: 0,
        shipments: 0,
        delayDays: 0
      };
    }

    acc[month].cost += Number(row.sum_total_amount || 0);
    acc[month].shipments += 1;
    acc[month].delayDays += Number(row.delay_days || 0);
    return acc;
  }, {});

  const orderedMonths = Object.keys(monthlyBuckets).sort();
  const currentMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 1]] || {
    cost: 0,
    shipments: 0,
    delayDays: 0
  };
  const previousMonth = monthlyBuckets[orderedMonths[orderedMonths.length - 2]] || {
    cost: 0,
    shipments: 0,
    delayDays: 0
  };

  const calculateVariation = (current, previous) => {
    if (!previous && !current) return 0;
    if (!previous) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    kpis: {
      "Custo Total": {
        value: formatUsdCurrency(totalCost),
        variation: calculateVariation(currentMonth.cost, previousMonth.cost)
      },
      Embarques: {
        value: totalShipments.toLocaleString("en-US"),
        variation: calculateVariation(currentMonth.shipments, previousMonth.shipments)
      },
      "Peso Transportado": {
        value: `${Math.round(totalWeight).toLocaleString("en-US")} kg`,
        variation: 0
      },
      "Atraso Medio": {
        value: `${(totalShipments ? totalDelayDays / totalShipments : 0).toFixed(1)} dias`,
        variation: calculateVariation(currentMonth.delayDays, previousMonth.delayDays)
      }
    },
    alertas: {
      "Delivery Success Rate": totalShipments
        ? `${((rows.filter((row) => row.delivery_success_flag).length / totalShipments) * 100).toFixed(1)}%`
        : "0%"
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
  return buildAdidasOverviewResponse(applyCommonFilters(adidasOverviewRows, filters));
};

export const biOrdersLogistics = async (filters = {}) => {
  await delay();
  return {
    fact: applyCommonFilters(ordersRows, filters)
  };
};

export const biProducts = async (filters = {}) => {
  await delay();
  return buildAmazonProductsResponse(applyCommonFilters(amazonProductsRows, filters));
};

export const biClients = async (filters = {}) => {
  await delay();
  return buildRestaurantClientsResponse(applyCommonFilters(restaurantClientsRows, filters));
};

export const biSuppliers = async (filters = {}) => {
  await delay();
  return buildLogisticsSuppliersResponse(applyCommonFilters(logisticsSuppliersRows, filters));
};

export const biQuotations = async (filters = {}) => {
  await delay();
  return buildQuotationsResponse(applyCommonFilters(quotationsRows, filters));
};
