import React, { useMemo } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartMap from "../../components/shared/charts/ChartMap";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import DashboardTabLayout from "../../components/DashboardTabLayout";
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
        categoriasPizza,
        clientsByState
    } = data.overview;

    const { tabela } = data.operacionais;

    const charts = useMemo(() => [
        {
            title: "Histórico Mensal Valor Consumido",
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
            title: "Distribuição de Categoria Por Valor",
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
            title: "Status Logístico por Quantidade",
            height: 260,
            component: (
                <ChartTreemap
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
            title: "Mapa de Valor Por Estado",
            height: 260,
            component: (
                <ChartMap
                    backendData={clientsByState}
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
            title: "Evolução Valor Unitário por Mês",
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
    ], [
        historicoMeses,
        historicoValores,
        tabela,
        handleCrossFilter,
        categoriasPizza,
        produtosRanking,
        rankingClientes,
        fornecedoresEntrega,
        clientsByState
    ]);

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
