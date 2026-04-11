import React, { useMemo } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartMapMorph from "../../components/shared/charts/ChartMapMorph";
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

const OVERVIEW_CURRENCY = "USD";
const OVERVIEW_LOCALE = "en-US";

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
        availableStatus
    } = useOverviewState();

    const {
        fornecedoresEntrega,
        fornecedoresEntregaQuantidade,
        historicoMeses,
        historicoQuantidades,
        historicoValores,
        rankingRegioes,
        rankingRegioesQuantidade,
        rankingClientes,
        rankingClientesQuantidade,
        produtosRanking,
        produtosRankingQuantidade,
        salesMethodTreemap
    } = data.overview;

    const { tabela } = data.operacionais;

    const filterInputs = useMemo(
        () => [
            { label: "Retailers", name: "suppliers", data: availableSuppliers },
            { label: "Estados", name: "clients", data: availableClients },
            {
                label: "Regiões",
                name: "categorias",
                data: availableCategorias.map((name) => ({ id: name, name }))
            },
            { label: "Produtos", name: "produtos", data: availableProdutos },
            { label: "Canal de Venda", name: "status", data: availableStatus }
        ],
        [
            availableCategorias,
            availableClients,
            availableProdutos,
            availableStatus,
            availableSuppliers
        ]
    );

    const charts = useMemo(
        () => [
            {
                title: "Receita Mensal",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={historicoMeses}
                        values={historicoValores}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Volume Mensal",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={historicoMeses}
                        values={historicoQuantidades}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="number"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Mapa de Receita por Estado",
                height: 320,
                component: (
                    <ChartMapMorph
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        geography="us"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Regi\u00e3o",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={rankingRegioes.map((item) => item.name)}
                        values={rankingRegioes.map((item) => item.value)}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="categoria"
                        showTrendLine={false}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Volume por Regi\u00e3o",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={rankingRegioesQuantidade.map((item) => item.name)}
                        values={rankingRegioesQuantidade.map((item) => item.valor)}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="categoria"
                        showTrendLine={false}
                        valueFormat="number"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Canal ao Longo do Tempo",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="amount"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Volume por Canal ao Longo do Tempo",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="quantity"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Mix por Canal de Venda",
                height: 260,
                component: (
                    <ChartTreemap
                        dataOverride={salesMethodTreemap}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Produtos por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={produtosRanking}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Produtos por Volume",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={produtosRankingQuantidade}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Retailers por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={fornecedoresEntrega}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Retailers por Volume",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={fornecedoresEntregaQuantidade}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Estados por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={rankingClientes}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Estados por Volume",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={rankingClientesQuantidade}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Dispers\u00e3o Pre\u00e7o x Volume",
                height: 300,
                caption: SCATTER_CONTEXT,
                component: (
                    <ChartScatterAggregate
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Mapa de Calor Regi\u00e3o x M\u00eas",
                height: 280,
                caption: HEATMAP_CONTEXT,
                component: (
                    <ChartHeatmap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            },
            {
                title: "Evolu\u00e7\u00e3o do Pre\u00e7o M\u00e9dio por Unidade",
                height: 260,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={OVERVIEW_CURRENCY}
                        locale={OVERVIEW_LOCALE}
                    />
                )
            }
        ],
        [
            fornecedoresEntrega,
            fornecedoresEntregaQuantidade,
            handleCrossFilter,
            historicoMeses,
            historicoQuantidades,
            historicoValores,
            produtosRanking,
            produtosRankingQuantidade,
            rankingRegioes,
            rankingRegioesQuantidade,
            rankingClientes,
            rankingClientesQuantidade,
            salesMethodTreemap,
            tabela
        ]
    );

    return (
        <DashboardTabLayout
            scopeClassName="bi-scope adidas-scope"
            filters={filters}
            onFilterChange={handleFieldChange}
            clearFilters={clearFilters}
            clearButtonRef={clearButtonRef}
            showFloatingClear={showFloatingClear}
            filterInputs={filterInputs}
            filterOptions={{
                fornecedores: availableSuppliers,
                clientes: availableClients,
                categorias: availableCategorias,
                produtos: availableProdutos,
                status: availableStatus
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
