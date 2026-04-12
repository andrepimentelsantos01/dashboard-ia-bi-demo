import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biTab2 } from "/src/services/rest";
import { useAuth } from "/src/core/auth";
import {
    buildDashboardApiFilters,
    createClearFilters,
    createDashboardFilters,
    createHandleFieldChange,
    createMappedCrossFilterHandler
} from "../../hooks/dashboardTabState.helpers";
import { useDashboardTabUi } from "../../hooks/useDashboardTabUi";
import {
    buildTab2AvailableFilters,
    buildTab2DerivedData,
    normalizeTab2Analytics,
    normalizeTab2Table
} from "../../selectors/amazonSalesSelectors";

export const initialFilters = createDashboardFilters({
    locations: [],
    customers: [],
    paymentMethods: [],
    categorias: [],
    produtos: [],
    status: []
});

const toNameSelection = (items = []) => {
    const values = items
        .map((item) => item?.name ?? item)
        .filter((value) => value !== undefined && value !== null && value !== "");

    if (!values.length) return undefined;
    return values.length === 1 ? values[0] : values;
};

export const useTab2State = () => {
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
                customer_location: (currentFilters) => toNameSelection(currentFilters.locations),
                customer_name: (currentFilters) => toNameSelection(currentFilters.customers),
                payment_method: (currentFilters) => toNameSelection(currentFilters.paymentMethods)
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
                const response = await biTab2(apiFilters, { key, passport });

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
        () => normalizeTab2Analytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeTab2Table(rawResponse.table || []),
        [rawResponse.table]
    );

    const tab2Data = useMemo(
        () => buildTab2DerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildTab2AvailableFilters(rawResponse.fact || []),
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
                        cliente: () => ({ customers: [option] }),
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
            kpis: tab2Data.kpis,
            alertas: tab2Data.alertas,
            tab2: tab2Data,
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
