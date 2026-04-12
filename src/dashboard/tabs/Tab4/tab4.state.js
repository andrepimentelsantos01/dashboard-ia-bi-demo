import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biTab4 } from "/src/services/rest";
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
    buildTab4AvailableFilters,
    buildTab4DerivedData,
    normalizeTab4Analytics,
    normalizeTab4Table
} from "../../selectors/logisticsPerformanceSelectors";

export const initialFilters = createDashboardFilters({
    carriers: [],
    warehouses: [],
    destinations: []
});

export const useTab4State = () => {
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
                carrier: (currentFilters) => toSingleOrArraySelection(currentFilters.carriers, "name"),
                origin_warehouse: (currentFilters) => toSingleOrArraySelection(currentFilters.warehouses, "name"),
                destination: (currentFilters) => toSingleOrArraySelection(currentFilters.destinations, "name")
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
                const response = await biTab4(apiFilters, { key, passport });

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
        () => normalizeTab4Analytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeTab4Table(rawResponse.table || []),
        [rawResponse.table]
    );

    const tab4Data = useMemo(
        () => buildTab4DerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildTab4AvailableFilters(rawResponse.fact || []),
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
                        const nextFilters = { ...(nextPayload.filters || {}) };

                        if (nextFilters.categorias?.length) {
                            nextFilters.warehouses = nextFilters.categorias.map((item) => ({
                                id: item?.id ?? item?.name ?? item,
                                name: item?.name ?? item
                            }));
                        }

                        return nextFilters;
                    }

                    const option = { id: nextPayload.id ?? nextPayload.value, name: nextPayload.value };
                    const handlers = {
                        fornecedor: () => ({ carriers: [option] }),
                        cliente: () => ({ destinations: [option] }),
                        categoria: () => ({ warehouses: [option] }),
                        produto: () => ({ produtos: [option] }),
                        status: () => ({ status: [nextPayload.value] }),
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
            kpis: tab4Data.kpis,
            alertas: tab4Data.alertas,
            tab4: tab4Data,
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
