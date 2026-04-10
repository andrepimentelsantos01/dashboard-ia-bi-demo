import { useState, useEffect, useMemo, useCallback } from "react";
import { biProducts } from "/src/services/rest";
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
    buildProductsAvailableFilters,
    buildProductsDerivedData,
    normalizeProductAnalytics
} from "../../selectors/productsSelectors";

export const initialFilters = createDashboardFilters({
    classificacaoABC: null,
    classificacaoXYZ: null
});

export const useProductsState = () => {
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
        () => buildDashboardApiFilters(filters, {
            includeOrders: true,
            extra: {
                classificacao_abc: currentFilters => currentFilters.classificacaoABC,
                classificacao_xyz: currentFilters => currentFilters.classificacaoXYZ
            }
        }),
        [filters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biProducts(apiFilters, { key, passport });

            if (active) setRawData(response.fact || []);
        };

        load();

        return () => {
            active = false;
        };
    }, [apiFilters, key, passport]);

    const analytics = useMemo(
        () => normalizeProductAnalytics(rawData || []),
        [rawData]
    );

    const derivedData = useMemo(
        () => buildProductsDerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildProductsAvailableFilters(rawData),
        [rawData]
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
            createCrossFilterMap({ includeOrders: true, includeAbc: true, includeXyz: true })
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
            ...derivedData,
            operacionais: { tabela: analytics },
            tabelaMapa: analytics
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
