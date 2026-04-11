import React, { useMemo, useCallback } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartMapMorph from "../../components/shared/charts/ChartMapMorph";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import { useOrdersState } from "./orders.state";
import "./Orders.css";

const ORDERS_KPI_LABELS = {
    ufTop: "Estado Líder",
    valorMovimentado: "Valor Movimentado",
    quantidadeMovimentada: "Quantidade Movimentada",
    quantidadePedidos: "Quantidade de Pedidos"
};

const Orders = () => {
    const {
        filters,
        setFilters,
        data,
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
        availableClients,
        availableSuppliers,
        availableCategorias,
        availableProdutos,
        availableOrders
    } = useOrdersState();

    const overview = data.overview || {};
    const kpis = data.kpis || {};
    const tabela = data.operacionais?.tabela || [];

    const kpisParsed = useMemo(() => {
        const output = {};

        Object.keys(ORDERS_KPI_LABELS).forEach(key => {
            if (key in kpis) output[ORDERS_KPI_LABELS[key]] = kpis[key];
        });

        return output;
    }, [kpis]);

    const valorMovimentadoMesParsed = useMemo(() => ({
        labels: (overview.valorMovimentadoMes || []).map(item => item.name),
        values: (overview.valorMovimentadoMes || []).map(item => item.value)
    }), [overview.valorMovimentadoMes]);

    const charts = useMemo(() => [
        {
            title: "Status Logístico por Quantidade",
            height: 260,
            component: (
                <ChartTreemap
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="status"
                />
            )
        },
        {
            title: "Mapa de Valor Por Estado",
            height: 260,
            component: (
                <ChartMapMorph
                    data={overview.mapaUF || []}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="uf"
                />
            )
        },
        {
            title: "Histórico Mensal Valor Consumido",
            height: 260,
            component: (
                <ChartHorizontal
                    title="Ranking de Produtos"
                    data={overview.rankingProdutos || []}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="produto"
                    order="ASC"
                    height={250}
                />
            )
        },
        {
            title: "Evolução Mensal do Valor Movimentado",
            height: 260,
            component: (
                <ChartBarVertical
                    labels={valorMovimentadoMesParsed.labels}
                    values={valorMovimentadoMesParsed.values}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="mes"
                    valueFormat="currency"
                />
            )
        },
        {
            title: "Ranking de Fornecedores Por Valor",
            height: 260,
            component: (
                <ChartHorizontal
                    title="Atrasos por Fornecedor"
                    data={overview.atrasosPorFornecedor || []}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="fornecedor"
                    order="ASC"
                    height={250}
                />
            )
        },
        {
            title: "Ranking de Cliente Por Valor",
            height: 260,
            component: (
                <ChartHorizontal
                    title="Atrasos por Cliente"
                    data={overview.atrasosPorCliente || []}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="cliente"
                    order="ASC"
                    height={250}
                />
            )
        }
    ], [overview, tabela, handleCrossFilter, valorMovimentadoMesParsed]);

    const handleCloseDateModal = useCallback(() => {
        setOpenDateModal(false);
    }, [setOpenDateModal]);

    const handleClearDate = useCallback(() => {
        setTempDateRange(null);
        setFilters(previous => ({ ...previous, dateRange: null }));
        setOpenDateModal(false);
    }, [setTempDateRange, setFilters, setOpenDateModal]);

    const handleApplyDate = useCallback(() => {
        setFilters(previous => ({ ...previous, dateRange: tempDateRange }));
        setOpenDateModal(false);
    }, [tempDateRange, setFilters, setOpenDateModal]);

    return (
        <DashboardTabLayout
            filters={filters}
            onFilterChange={handleFieldChange}
            clearFilters={clearFilters}
            clearButtonRef={clearButtonRef}
            showFloatingClear={showFloatingClear}
            filterOptions={{
                fornecedores: availableSuppliers,
                clientes: availableClients,
                categorias: availableCategorias,
                produtos: availableProdutos,
                orders: availableOrders
            }}
            contentSectionClassName="orders-section-gap"
            kpiTitle="KPIs de Pedidos & Logística"
            kpis={kpisParsed}
            onCrossFilter={handleCrossFilter}
            resetToken={resetToken}
            charts={charts}
            tabela={tabela}
            dateModal={{
                open: openDateModal,
                onClose: handleCloseDateModal,
                onClear: handleClearDate,
                onApply: handleApplyDate,
                value: tempDateRange,
                onChange: event => setTempDateRange(event.target.value),
                modalClassName: "orders-date-modal"
            }}
        />
    );
};

export default React.memo(Orders);
