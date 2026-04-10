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

    if (filters.clients?.length) {
        nextFilters.client_id = filters.clients[0].id ?? filters.clients[0].client_id;
    }
    if (filters.suppliers?.length) nextFilters.supplier_id = filters.suppliers[0].id;
    if (filters.produtos?.length) nextFilters.product_id = filters.produtos[0].id;
    if (filters.categorias?.length) {
        nextFilters.product_class_material_name = filters.categorias.map(item => item.name);
    }
    if (filters.status?.length) nextFilters[statusKey] = filters.status[0];
    if (filters.uf) nextFilters.client_state = filters.uf;

    if (includeOrders && filters.orders?.length) {
        nextFilters.purchase_order_id = filters.orders[0].id;
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
        if (value !== undefined && value !== null && value !== "") {
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

export const createCrossFilterMap = (options = {}) => {
    const {
        includeOrders = false,
        includeAbc = false,
        includeXyz = false,
        includeQuotationStatus = false
    } = options;

    return {
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
