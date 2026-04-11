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

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(deferredFilters, { includeOrders: true }),
        [deferredFilters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biOverview(apiFilters, { key, passport });

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
    }, [apiFilters, key, passport]);

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
        availableOptions,
        ...availableFilters
    };
};
