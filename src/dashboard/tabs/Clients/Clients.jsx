import React, { useMemo, useCallback } from "react";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartMapMorph from "../../components/shared/charts/ChartMapMorph";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import { useClientsState } from "./clients.state";
import "./Clients.css";

const Clients = () => {
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
        availableProdutos
    } = useClientsState();

    const overview = useMemo(() => data.overview || {}, [data.overview]);
    const kpis = useMemo(() => data.kpis || {}, [data.kpis]);

    const historicoMeses = overview.historicoMeses || [];
    const historicoValores = overview.historicoValores || [];
    const ticketMedioMensal = overview.ticketMedioMensal || [];
    const rankingClientes = overview.rankingClientes || [];
    const categoriasPizza = overview.categoriasPizza || [];
    const produtosRanking = overview.produtosRanking || [];
    const fornecedoresRanking = overview.fornecedoresRanking || [];
    const tabela = data.operacionais?.tabela || [];

    const kpisFiltrados = useMemo(
        () => Object.fromEntries(Object.entries(kpis).filter(([key]) => key !== "percentualGlosaClientes")),
        [kpis]
    );

    const charts = useMemo(
        () => [
            {
                title: "Ranking de Cliente Por Valor",
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Ranking de Clientes"
                        data={rankingClientes}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        filterType="cliente"
                    />
                )
            },
            {
                title: "Curva ABC de Clientes",
                height: 250,
                component: (
                    <ChartTreemap
                        dataOverride={overview.curvaABCTreemap}
                        onCrossFilter={handleCrossFilter}
                        hideValues
                        classificationMode="abc"
                        abcXyzLegend="clients"
                    />
                )
            },
            {
                title: "Curva XYZ de Clientes",
                height: 250,
                component: (
                    <ChartTreemap
                        dataOverride={overview.curvaXYZTreemap}
                        onCrossFilter={handleCrossFilter}
                        hideValues
                        classificationMode="xyz"
                        abcXyzLegend="clients"
                    />
                )
            },
            {
                title: "Matriz ABC-XYZ de Clientes",
                height: 250,
                component: (
                    <ChartTreemap
                        dataOverride={overview.matrizAbcXyzTreemap}
                        onCrossFilter={handleCrossFilter}
                        hideValues
                        classificationMode="abcxyz"
                        abcXyzLegend="clients"
                    />
                )
            },
            {
                title: "Ranking de Produtos Por Valor",
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Ranking de Produtos"
                        data={produtosRanking}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        filterType="produto"
                    />
                )
            },
            {
                title: "Historico Mensal Valor Consumido",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={historicoMeses}
                        values={historicoValores}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="currency"
                        filterType="mes"
                    />
                )
            },
            {
                title: "Mapa de Valor Por Estado",
                height: 260,
                component: (
                    <ChartMapMorph
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="uf"
                    />
                )
            },
            {
                title: "Evolucao Logistica por Status",
                height: 280,
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
                component: (
                    <ChartScatterAggregate
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Fornecedores",
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Ranking de Fornecedores"
                        data={fornecedoresRanking}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        filterType="fornecedor"
                    />
                )
            },
            {
                title: "Distribuicao de Categoria Por Valor",
                height: 260,
                component: (
                    <ChartPie
                        data={categoriasPizza}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="categoria"
                    />
                )
            },
            {
                title: "Status das Entregas",
                height: 260,
                component: (
                    <ChartTreemap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Evolucao Valor Unitario por Mes",
                height: 260,
                component: (
                    <ChartLine
                        labels={historicoMeses}
                        values={ticketMedioMensal}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="currency"
                        filterType="mes"
                    />
                )
            }
        ],
        [
            categoriasPizza,
            fornecedoresRanking,
            handleCrossFilter,
            historicoMeses,
            historicoValores,
            overview.curvaABCTreemap,
            overview.curvaXYZTreemap,
            overview.matrizAbcXyzTreemap,
            produtosRanking,
            rankingClientes,
            tabela,
            ticketMedioMensal
        ]
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
            filterOptions={{
                fornecedores: availableSuppliers,
                clientes: availableClients,
                categorias: availableCategorias,
                produtos: availableProdutos
            }}
            contentSectionClassName="section-gap"
            kpiTitle="KPIs de Clientes"
            overviewTitle="Visao Geral de Clientes"
            kpis={kpisFiltrados}
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
                modalClassName: "clients-date-modal"
            }}
        />
    );
};

export default React.memo(Clients);
