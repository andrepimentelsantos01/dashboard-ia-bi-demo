import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biProducts } from "/src/services/rest";
import { useAuth } from "/src/core/auth";
import {
    buildDashboardApiFilters,
    createClearFilters,
    createDashboardFilters,
    createHandleFieldChange
} from "../../hooks/dashboardTabState.helpers";
import { useDashboardTabUi } from "../../hooks/useDashboardTabUi";
import {
    buildAmazonSalesAvailableFilters,
    buildAmazonSalesDerivedData,
    normalizeAmazonSalesAnalytics,
    normalizeAmazonSalesTable
} from "../../selectors/amazonSalesSelectors";

export const initialFilters = createDashboardFilters({
    locations: [],
    customers: [],
    paymentMethods: []
});

const toSingleOrArray = (items = [], fallbackKey = "name") => {
    const values = items
        .map((item) => item?.id ?? item?.[fallbackKey] ?? item?.name ?? item)
        .filter((value) => value !== undefined && value !== null && value !== "");

    if (!values.length) return undefined;
    return values.length === 1 ? values[0] : values;
};

export const useProductsState = () => {
    const { key, passport } = useAuth();
    const [, startFiltersTransition] = useTransition();
    const [, startDataTransition] = useTransition();

    const [filters, setFilters] = useState(initialFilters);
    const [rawResponse, setRawResponse] = useState({
        kpis: {},
        fact: [],
        table: [],
        alertas: {}
    });

    const {
        resetToken,
        bumpResetToken,
        clearButtonRef,
        showFloatingClear
    } = useDashboardTabUi();

    const deferredFilters = useDeferredValue(filters);

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(deferredFilters, {
            includeOrders: true,
            extra: {
                customer_location: (currentFilters) => toSingleOrArray(currentFilters.locations, "name"),
                customer_name: (currentFilters) => toSingleOrArray(currentFilters.customers, "name"),
                payment_method: (currentFilters) => toSingleOrArray(currentFilters.paymentMethods, "name")
            }
        }),
        [deferredFilters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biProducts(apiFilters, { key, passport });

            if (active) {
                startDataTransition(() => {
                    setRawResponse(response);
                });
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [apiFilters, key, passport, startDataTransition]);

    const analytics = useMemo(
        () => normalizeAmazonSalesAnalytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeAmazonSalesTable(rawResponse.table || []),
        [rawResponse.table]
    );

    const amazonData = useMemo(
        () => buildAmazonSalesDerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildAmazonSalesAvailableFilters(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const handleFieldChange = useCallback((name, value) => {
        startFiltersTransition(() => {
            createHandleFieldChange(setFilters)(name, value);
        });
    }, [startFiltersTransition]);

    const clearFilters = useCallback(() => {
        startFiltersTransition(() => {
            createClearFilters(setFilters, initialFilters, bumpResetToken)();
        });
    }, [bumpResetToken, startFiltersTransition]);

    const handleCrossFilter = useCallback((payload) => {
        startFiltersTransition(() => {
            if (!payload) return;

            if (payload.type === "reset") {
                createClearFilters(setFilters, initialFilters, bumpResetToken)();
                return;
            }

            if (payload.type === "merge") {
                setFilters((previous) => ({ ...previous, ...(payload.filters || {}) }));
                return;
            }

            const option = { id: payload.id ?? payload.value, name: payload.value };
            const handlers = {
                cliente: () => ({ locations: [option] }),
                fornecedor: () => ({ paymentMethods: [option] }),
                categoria: () => ({ categorias: [{ name: payload.value }] }),
                produto: () => ({ produtos: [option] }),
                status: () => ({ status: [payload.value] }),
                mes: () => ({ mes: payload.value }),
                customer: () => ({ customers: [option] }),
                location: () => ({ locations: [option] }),
                paymentMethod: () => ({ paymentMethods: [option] })
            };

            const nextFilters = handlers[payload.type]?.();
            if (!nextFilters) return;

            setFilters((previous) => ({ ...previous, ...nextFilters }));
        });
    }, [bumpResetToken, startFiltersTransition]);

    return {
        filters,
        setFilters,
        data: {
            kpis: amazonData.kpis,
            alertas: amazonData.alertas,
            amazon: amazonData,
            operacionais: { tabela }
        },
        resetToken,
        showFloatingClear,
        clearButtonRef,
        handleFieldChange,
        clearFilters,
        handleCrossFilter,
        ...availableFilters
    };
};
