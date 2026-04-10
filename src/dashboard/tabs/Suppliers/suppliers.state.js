import { useState, useEffect, useMemo, useCallback } from "react";
import { biSuppliers } from "/src/services/rest";
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
    buildSuppliersAvailableFilters,
    buildSuppliersDerivedData,
    normalizeSupplierAnalytics
} from "../../selectors/suppliersSelectors";

export const initialFilters = createDashboardFilters();

export const useSuppliersState = () => {
    const { key, passport } = useAuth();

    const [filters, setFilters] = useState(initialFilters);
    const [rawData, setRawData] = useState([]);

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
            const response = await biSuppliers(apiFilters, { key, passport });

            if (active) setRawData(response.fact || []);
        };

        load();

        return () => {
            active = false;
        };
    }, [apiFilters, key, passport]);

    const analytics = useMemo(
        () => normalizeSupplierAnalytics(rawData),
        [rawData]
    );

    const derivedData = useMemo(
        () => buildSuppliersDerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildSuppliersAvailableFilters(rawData),
        [rawData]
    );

    const handleFieldChange = useCallback(createHandleFieldChange(setFilters), []);
    const clearFilters = useCallback(
        createClearFilters(setFilters, initialFilters, bumpResetToken),
        [bumpResetToken]
    );
    const handleCrossFilter = useCallback(
        createCrossFilterHandler(setFilters, clearFilters, createCrossFilterMap()),
        [clearFilters]
    );

    const availableOptions = useMemo(
        () => buildAvailableOptions(availableFilters),
        [availableFilters]
    );

    return {
        filters,
        setFilters,
        data: derivedData,
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
