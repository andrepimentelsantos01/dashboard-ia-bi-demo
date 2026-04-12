import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition } from "react";
import { biClients } from "/src/services/rest";
import { useAuth } from "/src/core/auth";
import {
    buildDashboardApiFilters,
    createClearFilters,
    createDashboardFilters,
    createHandleFieldChange
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

const toSingleOrArray = (items = [], fallbackKey = "name") => {
    const values = items
        .map((item) => item?.id ?? item?.[fallbackKey] ?? item?.name ?? item)
        .filter((value) => value !== undefined && value !== null && value !== "");

    if (!values.length) return undefined;
    return values.length === 1 ? values[0] : values;
};

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
                time_of_sale: (currentFilters) => toSingleOrArray(currentFilters.shifts, "name"),
                received_by: (currentFilters) => toSingleOrArray(currentFilters.attendants, "name"),
                transaction_type: (currentFilters) => toSingleOrArray(currentFilters.transactionTypes, "name")
            }
        }),
        [deferredFilters]
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            const response = await biClients(apiFilters, { key, passport });

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
            if (!payload) return;

            if (payload.type === "reset") {
                createClearFilters(setFilters, initialFilters, bumpResetToken)();
                return;
            }

            if (payload.type === "merge") {
                setFilters((previous) => ({ ...previous, ...(payload.filters || {}) }));
                return;
            }

            const option = { id: payload.id ?? payload.value, name: payload.value };
            const handlers = {
                cliente: () => ({ shifts: [option] }),
                fornecedor: () => ({ attendants: [option] }),
                categoria: () => ({ categorias: [{ name: payload.value }] }),
                produto: () => ({ produtos: [option] }),
                status: () => ({ transactionTypes: [option], status: [payload.value] }),
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
        ...availableFilters
    };
};
