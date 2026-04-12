export const createDashboardFilters = (overrides = {}) => ({
    dateRange: null,
    suppliers: [],
    clients: [],
    categorias: [],
    produtos: [],
    orders: [],
    status: [],
    mes: null,
    uf: null,
    ...overrides
});

export const toSingleOrArraySelection = (items = [], fallbackKey = "name") => {
    const values = items
        .map((item) => item?.id ?? item?.[fallbackKey] ?? item?.name ?? item)
        .filter((value) => value !== undefined && value !== null && value !== "");

    if (!values.length) return undefined;
    return values.length === 1 ? values[0] : values;
};

export const buildDashboardApiFilters = (filters, config = {}) => {
    const {
        statusKey = "item_status",
        dateRangeKey = "order_date",
        dateRangeAsMonth = false,
        monthMode = "always",
        includeOrders = true,
        extra = {}
    } = config;

    const nextFilters = {};
    if (filters.clients?.length) nextFilters.client_id = toSingleOrArraySelection(filters.clients, "client_id");
    if (filters.suppliers?.length) nextFilters.supplier_id = toSingleOrArraySelection(filters.suppliers, "supplier_id");
    if (filters.produtos?.length) nextFilters.product_id = toSingleOrArraySelection(filters.produtos, "product_id");
    if (filters.categorias?.length) {
        nextFilters.product_class_material_name = filters.categorias.map(item => item.name);
    }
    if (filters.status?.length) nextFilters[statusKey] = toSingleOrArraySelection(filters.status, "name");
    if (filters.uf) nextFilters.client_state = filters.uf;

    if (includeOrders && filters.orders?.length) {
        nextFilters.purchase_order_id = toSingleOrArraySelection(filters.orders, "purchase_order_id");
    }

    if (filters.dateRange) {
        nextFilters[dateRangeAsMonth ? "year_months" : dateRangeKey] = filters.dateRange;
    } else if (filters.mes && (monthMode === "always" || monthMode === "fallback")) {
        nextFilters.year_months = filters.mes;
    }

    if (!filters.dateRange && filters.mes && monthMode === "always") {
        nextFilters.year_months = filters.mes;
    }

    Object.entries(extra).forEach(([key, resolver]) => {
        const value = typeof resolver === "function" ? resolver(filters) : resolver;
        const isEmptyArray = Array.isArray(value) && value.length === 0;

        if (value !== undefined && value !== null && value !== "" && !isEmptyArray) {
            nextFilters[key] = value;
        }
    });

    return nextFilters;
};

export const createHandleFieldChange = (setFilters) => (name, value) => {
    setFilters(previous => ({ ...previous, [name]: value }));
};

export const createClearFilters = (setFilters, initialFilters, bumpResetToken) => () => {
    setFilters(initialFilters);
    bumpResetToken();
};

export const createCrossFilterHandler = (setFilters, clearFilters, handlers) => (payload) => {
    if (!payload) return;

    if (payload.type === "reset") {
        clearFilters();
        return;
    }

    const handler = handlers[payload.type];
    if (!handler) return;

    setFilters(previous => ({ ...previous, ...handler(payload) }));
};

export const createMappedCrossFilterHandler = (setFilters, clearFilters, resolver) => (payload) => {
    if (!payload) return;

    if (payload.type === "reset") {
        clearFilters();
        return;
    }

    const nextFilters = resolver(payload);
    if (!nextFilters) return;

    setFilters(previous => ({ ...previous, ...nextFilters }));
};

export const createCrossFilterMap = (options = {}) => {
    const {
        includeOrders = false,
        includeAbc = false,
        includeXyz = false,
        includeQuotationStatus = false
    } = options;

    return {
        merge: payload => payload.filters || {},
        cliente: payload => ({ clients: [{ id: payload.id, name: payload.value }] }),
        fornecedor: payload => ({ suppliers: [{ id: payload.id, name: payload.value }] }),
        categoria: payload => ({ categorias: [{ name: payload.value }] }),
        produto: payload => ({ produtos: [{ id: payload.id, name: payload.value }] }),
        mes: payload => ({ mes: payload.value }),
        status: payload => ({
            status: [includeQuotationStatus ? payload.value?.toLowerCase() : payload.value]
        }),
        uf: payload => ({ uf: payload.value }),
        ...(includeOrders
            ? {
                orders: payload => ({ orders: [{ id: payload.value, name: payload.value }] })
            }
            : {}),
        ...(includeAbc
            ? {
                abc: payload => ({ classificacaoABC: payload.value })
            }
            : {}),
        ...(includeXyz
            ? {
                xyz: payload => ({ classificacaoXYZ: payload.value })
            }
            : {})
    };
};

export const buildAvailableOptions = (availableFilters = {}) => ({
    clients: availableFilters.availableClients ?? availableFilters.availableClientes ?? [],
    suppliers: availableFilters.availableSuppliers ?? availableFilters.availableFornecedores ?? [],
    categories: availableFilters.availableCategorias ?? [],
    products: availableFilters.availableProdutos ?? [],
    orders: availableFilters.availableOrders ?? [],
    quotationCodes: availableFilters.availableNumeroCotacao ?? []
});
