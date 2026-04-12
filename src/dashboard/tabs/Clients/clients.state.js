import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biClients } from "/src/services/rest";
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
    buildRestaurantSalesAvailableFilters,
    buildRestaurantSalesDerivedData,
    normalizeRestaurantSalesAnalytics,
    normalizeRestaurantSalesTable
} from "../../selectors/restaurantSalesSelectors";

export const initialFilters = createDashboardFilters({
    shifts: [],
    attendants: [],
    transactionTypes: []
});

export const useClientsState = () => {
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
                time_of_sale: (currentFilters) => toSingleOrArraySelection(currentFilters.shifts, "name"),
                received_by: (currentFilters) => toSingleOrArraySelection(currentFilters.attendants, "name"),
                transaction_type: (currentFilters) => toSingleOrArraySelection(currentFilters.transactionTypes, "name")
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
                const response = await biClients(apiFilters, { key, passport });

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
        () => normalizeRestaurantSalesAnalytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeRestaurantSalesTable(rawResponse.table || []),
        [rawResponse.table]
    );

    const restaurantData = useMemo(
        () => buildRestaurantSalesDerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildRestaurantSalesAvailableFilters(rawResponse.fact || []),
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
                        cliente: () => ({ shifts: [option] }),
                        fornecedor: () => ({ attendants: [option] }),
                        categoria: () => ({ categorias: [{ name: nextPayload.value }] }),
                        produto: () => ({ produtos: [option] }),
                        status: () => ({ transactionTypes: [option], status: [nextPayload.value] }),
                        mes: () => ({ mes: nextPayload.value })
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
            kpis: restaurantData.kpis,
            alertas: restaurantData.alertas,
            restaurant: restaurantData,
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
