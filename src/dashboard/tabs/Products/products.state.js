import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biProducts } from "/src/services/rest";
import { useAuth } from "/src/core/auth";
import {
    buildDashboardApiFilters,
    createClearFilters,
    createDashboardFilters,
    createHandleFieldChange,
    createMappedCrossFilterHandler,
    toSingleOrArraySelection
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
    const [requestState, setRequestState] = useState({
        status: "loading",
        error: null,
        reloadToken: 0
    });

    const {
        resetToken,
        bumpResetToken,
        clearButtonRef,
        showFloatingClear
    } = useDashboardTabUi();

    const deferredFilters = useDeferredValue(filters);
    const hasCachedData = Boolean(rawResponse.fact?.length);

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(deferredFilters, {
            includeOrders: true,
            extra: {
                customer_location: (currentFilters) => toSingleOrArraySelection(currentFilters.locations, "name"),
                customer_name: (currentFilters) => toSingleOrArraySelection(currentFilters.customers, "name"),
                payment_method: (currentFilters) => toSingleOrArraySelection(currentFilters.paymentMethods, "name")
            }
        }),
        [deferredFilters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            setRequestState((current) => ({
                ...current,
                status: hasCachedData ? "refreshing" : "loading",
                error: null
            }));

            try {
                const response = await biProducts(apiFilters, { key, passport });

                if (active) {
                    startDataTransition(() => {
                        setRawResponse(response);
                    });
                    setRequestState((current) => ({
                        ...current,
                        status: "success",
                        error: null
                    }));
                }
            } catch (error) {
                if (active) {
                    setRequestState((current) => ({
                        ...current,
                        status: "error",
                        error
                    }));
                }
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [apiFilters, hasCachedData, key, passport, requestState.reloadToken, startDataTransition]);

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
            createMappedCrossFilterHandler(
                setFilters,
                createClearFilters(setFilters, initialFilters, bumpResetToken),
                (nextPayload) => {
                    if (nextPayload.type === "merge") {
                        return nextPayload.filters || {};
                    }

                    const option = { id: nextPayload.id ?? nextPayload.value, name: nextPayload.value };
                    const handlers = {
                        cliente: () => ({ locations: [option] }),
                        fornecedor: () => ({ paymentMethods: [option] }),
                        categoria: () => ({ categorias: [{ name: nextPayload.value }] }),
                        produto: () => ({ produtos: [option] }),
                        status: () => ({ status: [nextPayload.value] }),
                        mes: () => ({ mes: nextPayload.value }),
                        customer: () => ({ customers: [option] }),
                        location: () => ({ locations: [option] }),
                        paymentMethod: () => ({ paymentMethods: [option] })
                    };

                    return handlers[nextPayload.type]?.();
                }
            )(payload);
        });
    }, [bumpResetToken, startFiltersTransition]);

    const retry = useCallback(() => {
        setRequestState((current) => ({
            ...current,
            status: hasCachedData ? "refreshing" : "loading",
            error: null,
            reloadToken: current.reloadToken + 1
        }));
    }, [hasCachedData]);

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
        asyncState: {
            isLoading: requestState.status === "loading",
            isRefreshing: requestState.status === "refreshing",
            error: requestState.error,
            hasData: Boolean(tabela.length || analytics.length),
            onRetry: retry
        },
        ...availableFilters
    };
};
