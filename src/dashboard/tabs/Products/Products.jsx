import React, { useMemo, useCallback } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine/ChartLine";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap/ChartTreemap";
import ClassificationCurvesButtons from "../../components/shared/classificationControls/ClassificationCurvesButtons";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import {
    CURVE_BUTTONS_CONTEXT,
    HEATMAP_CONTEXT,
    SCATTER_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useProductsState } from "./products.state";
import "./Products.css";

const PRODUCT_KPI_LABELS = {
    valorTotal: "Valor Total",
    ticketMedioProduto: "Ticket Medio por Produto",
    produtoTop: "Produto Maior Valor"
};

const Products = () => {
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
        availableProdutos,
        availableCategorias,
        availableSuppliers,
        availableClients,
        availableOrders
    } = useProductsState();

    const tabela = data.operacionais.tabela || [];

    const sortedGlosa = useMemo(() => {
        const labels = data.glosaProdutos?.labels || [];
        const values = data.glosaProdutos?.values || [];

        return labels
            .map((label, index) => ({ label, value: values[index] || 0 }))
            .sort((a, b) => b.value - a.value);
    }, [data.glosaProdutos]);

    const kpisProductsParsed = useMemo(() => {
        if (!data?.kpis) return {};

        const output = {};

        Object.keys(data.kpis).forEach((key) => {
            if (key === "percentualCancelados") return;

            if (key === "ticketMedioProduto") {
                output[PRODUCT_KPI_LABELS[key]] = data.kpis[key]?.value || data.kpis[key];
                return;
            }

            output[PRODUCT_KPI_LABELS[key] || key] = data.kpis[key];
        });

        return output;
    }, [data.kpis]);

    const charts = useMemo(
        () => [
            {
                title: "",
                height: 92,
                fullWidth: true,
                compactLayout: true,
                caption: CURVE_BUTTONS_CONTEXT,
                component: (
                    <ClassificationCurvesButtons
                        filters={filters}
                        setFilters={setFilters}
                    />
                )
            },
            {
                title: "Distribuicao de Categoria Por Valor",
                height: 250,
                component: (
                    <ChartPie
                        data={data.produtosPorCategoriaPie}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Status das Entregas",
                height: 250,
                component: (
                    <ChartTreemap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Evolucao Logistica por Status",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="quantity"
                    />
                )
            },
            {
                title: "Mapa de Calor Categoria x Mes",
                height: 280,
                caption: HEATMAP_CONTEXT,
                component: (
                    <ChartHeatmap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Dispersao de Preco x Volume",
                height: 300,
                caption: SCATTER_CONTEXT,
                component: (
                    <ChartScatterAggregate
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Produtos Por Valor",
                height: 250,
                component: (
                    <ChartHorizontal
                        data={data.produtosRanking}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Evolucao Valor Unitario por Mes",
                height: 250,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Percentual Glosa por Produto",
                height: 250,
                component: (
                    <ChartBarVertical
                        labels={sortedGlosa.map((item) => item.label)}
                        values={sortedGlosa.map((item) => item.value)}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="percent"
                        filterType="produto"
                    />
                )
            }
        ],
        [data, filters, handleCrossFilter, setFilters, sortedGlosa, tabela]
    );

    const handleCloseDateModal = useCallback(() => {
        setOpenDateModal(false);
    }, [setOpenDateModal]);

    const handleClearDate = useCallback(() => {
        setTempDateRange(null);
        setFilters((previous) => ({ ...previous, dateRange: null }));
        setOpenDateModal(false);
    }, [setTempDateRange, setFilters, setOpenDateModal]);

    const handleApplyDate = useCallback(() => {
        setFilters((previous) => ({ ...previous, dateRange: tempDateRange }));
        setOpenDateModal(false);
    }, [tempDateRange, setFilters, setOpenDateModal]);

    return (
        <DashboardTabLayout
            filters={filters}
            onFilterChange={handleFieldChange}
            clearFilters={clearFilters}
            clearButtonRef={clearButtonRef}
            showFloatingClear={showFloatingClear}
            hiddenFilterNames={["categorias"]}
            filterOptions={{
                fornecedores: availableSuppliers,
                clientes: availableClients,
                categorias: availableCategorias,
                produtos: availableProdutos,
                orders: availableOrders
            }}
            contentSectionClassName="mt-24"
            kpiTitle="KPIs de Produtos"
            overviewTitle="Visao Geral de Produtos"
            kpis={kpisProductsParsed}
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
                onChange: (event) => setTempDateRange(event.target.value),
                modalClassName: "products-date-modal"
            }}
        />
    );
};

export default React.memo(Products);
