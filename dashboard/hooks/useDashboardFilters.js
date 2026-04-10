import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export const initialFilters = {
    dateRange: null,
    suppliers: [],
    clients: [],
    categorias: [],
    produtos: [],
    status: [],
    mes: null,
    uf: null,
    orders: [],
    numeroCotacao: []
};

const extractNames = arr => arr.map(item => item.name);

export function useDashboardFilters({
                                        rowsRaw = [],
                                        normalizeRow = r => r,
                                        computeExtraData = () => ({})
                                    }) {
    const allRows = useMemo(() => rowsRaw.map(normalizeRow), [rowsRaw]);

    const [filters, setFilters] = useState(initialFilters);

    const [data, setData] = useState({
        operacionais: { tabela: [] },
        kpis: {},
        treemap: [],
        heatmap: []
    });

    const [openDateModal, setOpenDateModal] = useState(false);
    const [tempDateRange, setTempDateRange] = useState(null);

    const clearButtonRef = useRef(null);
    const [showFloatingClear, setShowFloatingClear] = useState(false);

    useEffect(() => {
        const ref = clearButtonRef.current;
        if (!ref) return;
        const observer = new IntersectionObserver(entries => {
            setShowFloatingClear(!entries[0].isIntersecting);
        }, { threshold: 0.1 });
        observer.observe(ref);
        return () => observer.disconnect();
    }, []);

    const filterRows = useCallback(
        (f, exclude) => {
            let tabela = allRows;

            if (exclude !== "clients" && f.clients.length) {
                const selected = extractNames(f.clients);
                tabela = tabela.filter(row => selected.includes(row.cliente));
            }

            if (exclude !== "suppliers" && f.suppliers.length) {
                const selected = extractNames(f.suppliers);
                tabela = tabela.filter(row => selected.includes(row.fornecedor));
            }

            if (exclude !== "categorias" && f.categorias.length) {
                const selected = extractNames(f.categorias);
                tabela = tabela.filter(row => selected.includes(row.categoria));
            }

            if (exclude !== "produtos" && f.produtos.length) {
                const selected = extractNames(f.produtos);
                tabela = tabela.filter(row => selected.includes(row.produto));
            }

            if (exclude !== "status" && f.status.length) {
                tabela = tabela.filter(row => f.status.includes(row.status));
            }

            if (exclude !== "orders" && f.orders.length) {
                const selected = extractNames(f.orders);
                tabela = tabela.filter(row =>
                    selected.includes(row.numeroPedido) ||
                    selected.includes(row.ordemCompra) ||
                    selected.includes(row.pedidoId)
                );
            }

            if (exclude !== "numeroCotacao" && f.numeroCotacao.length) {
                const selected = extractNames(f.numeroCotacao).map(String);
                tabela = tabela.filter(row =>
                    selected.includes(String(row.numeroCotacao))
                );
            }

            if (exclude !== "uf" && f.uf) {
                tabela = tabela.filter(row => row.uf === f.uf);
            }

            if (exclude !== "mes" && f.mes) {
                tabela = tabela.filter(row => row.year_months === f.mes);
            }

            if (
                exclude !== "dateRange" &&
                f.dateRange &&
                (f.dateRange.start || f.dateRange.end)
            ) {
                const start = f.dateRange.start ? new Date(f.dateRange.start) : null;
                const end = f.dateRange.end ? new Date(f.dateRange.end) : null;

                tabela = tabela.filter(row => {
                    const d = new Date(row.data);
                    const after = start ? d >= start : true;
                    const before = end ? d <= end : true;
                    return after && before;
                });
            }

            return tabela;
        },
        [allRows]
    );

    const applyFilters = useCallback(
        f => {
            const tabelaFiltrada = filterRows(f);

            const extra = computeExtraData(tabelaFiltrada) || {};

            setData({
                operacionais: { tabela: tabelaFiltrada },
                kpis: extra.kpis || {},
                alertas: extra.alertas || {},
                analytics: extra.analytics || {},
                treemap: extra.treemap || [],
                heatmap: extra.heatmap || []
            });
        },
        [filterRows, computeExtraData]
    );

    useEffect(() => {
        applyFilters(filters);
    }, [filters, applyFilters]);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
    }, []);

    const handleCrossFilter = useCallback(payload => {
        if (!payload?.type) return;

        if (payload.type === "reset") {
            setFilters(initialFilters);
            return;
        }

        if (payload.type === "cliente") {
            setFilters(prev => ({ ...prev, clients: [{ name: payload.value }] }));
            return;
        }

        if (payload.type === "fornecedor") {
            setFilters(prev => ({ ...prev, suppliers: [{ name: payload.value }] }));
            return;
        }

        if (payload.type === "categoria") {
            setFilters(prev => ({ ...prev, categorias: [{ name: payload.value }] }));
            return;
        }

        if (payload.type === "produto") {
            setFilters(prev => ({ ...prev, produtos: [{ name: payload.value }] }));
            return;
        }

        if (payload.type === "mes") {
            setFilters(prev => ({ ...prev, mes: payload.value }));
            return;
        }

        if (payload.type === "status") {
            setFilters(prev => ({ ...prev, status: [payload.value] }));
            return;
        }

        if (payload.type === "uf") {
            setFilters(prev => ({ ...prev, uf: payload.value }));
            return;
        }

        if (payload.type === "orders") {
            setFilters(prev => ({ ...prev, orders: [{ name: payload.value }] }));
            return;
        }
    }, []);

    const handleFieldChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const rowsForClients = useMemo(
        () => filterRows(filters, "clients"),
        [filterRows, filters]
    );
    const rowsForSuppliers = useMemo(
        () => filterRows(filters, "suppliers"),
        [filterRows, filters]
    );
    const rowsForCategorias = useMemo(
        () => filterRows(filters, "categorias"),
        [filterRows, filters]
    );
    const rowsForProdutos = useMemo(
        () => filterRows(filters, "produtos"),
        [filterRows, filters]
    );
    const rowsForOrders = useMemo(
        () => filterRows(filters, "orders"),
        [filterRows, filters]
    );
    const rowsForNumeroCotacao = useMemo(
        () => filterRows(filters, "numeroCotacao"),
        [filterRows, filters]
    );

    const availableClients = useMemo(
        () => [...new Set(rowsForClients.map(r => r.cliente).filter(Boolean))],
        [rowsForClients]
    );
    const availableSuppliers = useMemo(
        () => [...new Set(rowsForSuppliers.map(r => r.fornecedor).filter(Boolean))],
        [rowsForSuppliers]
    );
    const availableCategorias = useMemo(
        () => [...new Set(rowsForCategorias.map(r => r.categoria).filter(Boolean))],
        [rowsForCategorias]
    );
    const availableProdutos = useMemo(
        () => [...new Set(rowsForProdutos.map(r => r.produto).filter(Boolean))],
        [rowsForProdutos]
    );
    const availableOrders = useMemo(
        () => [
            ...new Set(
                rowsForOrders
                    .flatMap(r => [r.numeroPedido, r.ordemCompra, r.pedidoId])
                    .filter(Boolean)
            )
        ],
        [rowsForOrders]
    );
    const availableNumeroCotacao = useMemo(
        () => [...new Set(rowsForNumeroCotacao.map(r => r.numeroCotacao).filter(Boolean))],
        [rowsForNumeroCotacao]
    );

    return {
        filters,
        setFilters,
        data,
        handleFieldChange,
        handleCrossFilter,
        clearFilters,
        openDateModal,
        setOpenDateModal,
        tempDateRange,
        setTempDateRange,
        clearButtonRef,
        showFloatingClear,
        availableClients,
        availableSuppliers,
        availableCategorias,
        availableProdutos,
        availableOrders,
        availableNumeroCotacao
    };
}