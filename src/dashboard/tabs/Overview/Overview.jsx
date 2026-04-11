import React, { useMemo } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartMapMorph from "../../components/shared/charts/ChartMapMorph";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import {
    HEATMAP_CONTEXT,
    SCATTER_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useOverviewState } from "./overview.state";
import "./Overview.css";

const Overview = () => {
    const {
        filters,
        data,
        resetToken,
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
    } = useOverviewState();

    const {
        fornecedoresEntrega,
        historicoMeses,
        historicoValores,
        rankingClientes,
        produtosRanking,
        categoriasPizza
    } = data.overview;

    const { tabela } = data.operacionais;

    const charts = useMemo(
        () => [
            {
                title: "Historico Mensal Valor Consumido",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={historicoMeses}
                        values={historicoValores}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
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
                    />
                )
            },
            {
                title: "Status Logistico por Quantidade",
                height: 260,
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
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Ranking de Produtos"
                        data={produtosRanking}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
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
                title: "Mapa de Valor Por Estado",
                height: 280,
                component: (
                    <ChartMapMorph
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Cliente Por Valor",
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Ranking de Cliente"
                        data={rankingClientes}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Evolucao Valor Unitario por Mes",
                height: 260,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Fornecedores Por Valor",
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Ranking de Fornecedores"
                        data={fornecedoresEntrega}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            }
        ],
        [
            categoriasPizza,
            fornecedoresEntrega,
            handleCrossFilter,
            historicoMeses,
            historicoValores,
            produtosRanking,
            rankingClientes,
            tabela
        ]
    );

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
            contentSectionClassName="section-mt"
            kpis={data.kpis}
            alertas={data.alertas}
            onCrossFilter={handleCrossFilter}
            resetToken={resetToken}
            charts={charts}
            tabela={tabela}
        />
    );
};

export default React.memo(Overview);
