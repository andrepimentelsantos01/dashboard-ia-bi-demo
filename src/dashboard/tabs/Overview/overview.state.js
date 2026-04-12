import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biOverview } from "/src/services/rest";
import { useAuth } from "/src/core/auth";
import {
    buildAvailableOptions,
    buildDashboardApiFilters,
    createClearFilters,
    createCrossFilterHandler,
    createCrossFilterMap,
    createDashboardFilters,
    createHandleFieldChange
} from "../../hooks/dashboardTabState.helpers";
import { useDashboardTabUi } from "../../hooks/useDashboardTabUi";
import {
    adaptOverviewKpis,
    buildOverviewAvailableFilters,
    buildOverviewDerivedData,
    normalizeOverviewAnalytics,
    normalizeOverviewTable
} from "../../selectors/overviewSelectors";

export const initialFilters = createDashboardFilters();

export const useOverviewState = () => {
    const { key, passport } = useAuth();
    const [, startFiltersTransition] = useTransition();
    const [, startDataTransition] = useTransition();

    const [filters, setFilters] = useState(initialFilters);
    const [rawResponse, setRawResponse] = useState({
        kpis: {},
        fact: [],
        table: []
    });
    const [requestState, setRequestState] = useState({
        status: "loading",
        error: null,
        reloadToken: 0
    });

    const {
        resetToken,
        bumpResetToken,
        openDateModal,
        setOpenDateModal,
        tempDateRange,
        setTempDateRange,
        clearButtonRef,
        showFloatingClear
    } = useDashboardTabUi();

    const deferredFilters = useDeferredValue(filters);
    const hasCachedData = Boolean(rawResponse.fact?.length);

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(deferredFilters, { includeOrders: true }),
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
                const response = await biOverview(apiFilters, { key, passport });

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
    }, [apiFilters, hasCachedData, key, passport, requestState.reloadToken]);

    const analytics = useMemo(
        () => normalizeOverviewAnalytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeOverviewTable(rawResponse.table || []),
        [rawResponse.table]
    );

    const overviewData = useMemo(
        () => buildOverviewDerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildOverviewAvailableFilters(analytics, tabela),
        [analytics, tabela]
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
            createCrossFilterHandler(
                setFilters,
                createClearFilters(setFilters, initialFilters, bumpResetToken),
                createCrossFilterMap({ includeOrders: true })
            )(payload);
        });
    }, [bumpResetToken, startFiltersTransition]);

    const availableOptions = useMemo(
        () => buildAvailableOptions(availableFilters),
        [availableFilters]
    );

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
            kpis: adaptOverviewKpis(rawResponse.kpis),
            overview: overviewData,
            operacionais: {
                tabela
            },
            alertas: rawResponse.alertas
        },
        resetToken,
        openDateModal,
        setOpenDateModal,
        tempDateRange,
        setTempDateRange,
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
        availableOptions,
        ...availableFilters
    };
};
