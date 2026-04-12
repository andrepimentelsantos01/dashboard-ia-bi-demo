import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biSuppliers } from "/src/services/rest";
import { useAuth } from "/src/core/auth";
import {
    buildDashboardApiFilters,
    createClearFilters,
    createDashboardFilters,
    createHandleFieldChange
} from "../../hooks/dashboardTabState.helpers";
import { useDashboardTabUi } from "../../hooks/useDashboardTabUi";
import {
    buildLogisticsPerformanceAvailableFilters,
    buildLogisticsPerformanceDerivedData,
    normalizeLogisticsPerformanceAnalytics,
    normalizeLogisticsPerformanceTable
} from "../../selectors/logisticsPerformanceSelectors";

export const initialFilters = createDashboardFilters({
    carriers: [],
    warehouses: [],
    destinations: []
});

const toSingleOrArray = (items = [], fallbackKey = "name") => {
    const values = items
        .map((item) => item?.id ?? item?.[fallbackKey] ?? item?.name ?? item)
        .filter((value) => value !== undefined && value !== null && value !== "");

    if (!values.length) return undefined;
    return values.length === 1 ? values[0] : values;
};

export const useSuppliersState = () => {
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

    const {
        resetToken,
        bumpResetToken,
        clearButtonRef,
        showFloatingClear
    } = useDashboardTabUi();

    const deferredFilters = useDeferredValue(filters);

    const apiFilters = useMemo(
        () => buildDashboardApiFilters(deferredFilters, {
            includeOrders: true,
            extra: {
                carrier: (currentFilters) => toSingleOrArray(currentFilters.carriers, "name"),
                origin_warehouse: (currentFilters) => toSingleOrArray(currentFilters.warehouses, "name"),
                destination: (currentFilters) => toSingleOrArray(currentFilters.destinations, "name")
            }
        }),
        [deferredFilters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biSuppliers(apiFilters, { key, passport });

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
    }, [apiFilters, key, passport, startDataTransition]);

    const analytics = useMemo(
        () => normalizeLogisticsPerformanceAnalytics(rawResponse.fact || []),
        [rawResponse.fact]
    );

    const tabela = useMemo(
        () => normalizeLogisticsPerformanceTable(rawResponse.table || []),
        [rawResponse.table]
    );

    const logisticsData = useMemo(
        () => buildLogisticsPerformanceDerivedData(analytics),
        [analytics]
    );

    const availableFilters = useMemo(
        () => buildLogisticsPerformanceAvailableFilters(rawResponse.fact || []),
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
            if (!payload) return;

            if (payload.type === "reset") {
                createClearFilters(setFilters, initialFilters, bumpResetToken)();
                return;
            }

            if (payload.type === "merge") {
                const nextFilters = { ...(payload.filters || {}) };

                if (nextFilters.categorias?.length) {
                    nextFilters.warehouses = nextFilters.categorias.map((item) => ({
                        id: item?.id ?? item?.name ?? item,
                        name: item?.name ?? item
                    }));
                }

                setFilters((previous) => ({ ...previous, ...nextFilters }));
                return;
            }

            const option = { id: payload.id ?? payload.value, name: payload.value };
            const handlers = {
                fornecedor: () => ({ carriers: [option] }),
                cliente: () => ({ destinations: [option] }),
                categoria: () => ({ warehouses: [option] }),
                produto: () => ({ produtos: [option] }),
                status: () => ({ status: [payload.value] }),
                mes: () => ({ mes: payload.value })
            };

            const nextFilters = handlers[payload.type]?.();
            if (!nextFilters) return;

            setFilters((previous) => ({ ...previous, ...nextFilters }));
        });
    }, [bumpResetToken, startFiltersTransition]);

    return {
        filters,
        setFilters,
        data: {
            kpis: logisticsData.kpis,
            alertas: logisticsData.alertas,
            logistics: logisticsData,
            operacionais: { tabela }
        },
        resetToken,
        showFloatingClear,
        clearButtonRef,
        handleFieldChange,
        clearFilters,
        handleCrossFilter,
        ...availableFilters
    };
};
