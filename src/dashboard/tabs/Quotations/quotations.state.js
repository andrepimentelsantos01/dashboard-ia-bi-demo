import { useState, useEffect, useMemo, useCallback } from "react";
import { biQuotations } from "/src/services/rest";
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
    buildQuotationsAvailableFilters,
    normalizeQuotationsAnalytics,
    normalizeQuotationsTable
} from "../../selectors/quotationsSelectors";

export const initialFilters = createDashboardFilters({
    numeroCotacao: []
});

export const useQuotationsState = () => {
    const { key, passport } = useAuth();

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
        openDateModal,
        setOpenDateModal,
        tempDateRange,
        setTempDateRange,
        clearButtonRef,
        showFloatingClear
    } = useDashboardTabUi();

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(filters, {
            statusKey: "quotation_status",
            dateRangeAsMonth: true,
            includeOrders: false,
            monthMode: "fallback",
            extra: {
                quotation_code: currentFilters =>
                    currentFilters.numeroCotacao?.map(item => item?.id ?? item?.name ?? item)
            }
        }),
        [filters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biQuotations(apiFilters, { key, passport });

            if (active) setRawResponse(response);
        };

        load();

        return () => {
            active = false;
        };
    }, [apiFilters, key, passport]);

    const analytics = useMemo(
        () => normalizeQuotationsAnalytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeQuotationsTable(rawResponse.table || []),
        [rawResponse.table]
    );

    const availableFilters = useMemo(
        () => buildQuotationsAvailableFilters(analytics),
        [analytics]
    );

    const handleFieldChange = useCallback(createHandleFieldChange(setFilters), []);
    const clearFilters = useCallback(
        createClearFilters(setFilters, initialFilters, bumpResetToken),
        [bumpResetToken]
    );
    const handleCrossFilter = useCallback(
        createCrossFilterHandler(
            setFilters,
            clearFilters,
            createCrossFilterMap({ includeQuotationStatus: true })
        ),
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
            kpis: rawResponse.kpis || {},
            overview: {
                fact: analytics
            },
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
