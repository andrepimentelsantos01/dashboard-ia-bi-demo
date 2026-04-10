import { useState, useEffect, useCallback, useMemo } from "react";
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

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(filters, { includeOrders: true }),
        [filters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biOverview(apiFilters, { key, passport });

            if (active) setRawResponse(response);
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

    const handleFieldChange = useCallback(createHandleFieldChange(setFilters), []);
    const clearFilters = useCallback(
        createClearFilters(setFilters, initialFilters, bumpResetToken),
        [bumpResetToken]
    );
    const handleCrossFilter = useCallback(
        createCrossFilterHandler(setFilters, clearFilters, createCrossFilterMap({ includeOrders: true })),
        [clearFilters]
    );

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
