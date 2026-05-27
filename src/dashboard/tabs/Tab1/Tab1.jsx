import React, { useMemo } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartBoxplot from "../../components/shared/charts/ChartBoxplot";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartMapMorph from "../../components/shared/charts/ChartMapMorph";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import {
    HEATMAP_CONTEXT,
    BOXPLOT_CONTEXT,
    SCATTER_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useTab1State } from "./tab1.state";
import "./Tab1.css";

const TAB1_CURRENCY = "USD";
const TAB1_LOCALE = "en-US";

const Tab1 = () => {
    const {
        filters,
        data,
        resetToken,
        showFloatingClear,
        clearButtonRef,
        handleFieldChange,
        clearFilters,
        handleCrossFilter,
        asyncState,
        availableClients,
        availableSuppliers,
        availableCategorias,
        availableProdutos,
        availableStatus
    } = useTab1State();

    const {
        fornecedoresEntrega,
        historicoMeses,
        historicoOperatingProfit,
        historicoValores,
        rankingRegioes,
        rankingRegioesOperatingProfit,
        produtosRanking,
        salesMethodMix
    } = data.tab1;

    const { tabela } = data.operacionais;

    const regionComparison = rankingRegioesOperatingProfit.length
        ? rankingRegioesOperatingProfit
        : rankingRegioes;

    const filterInputs = useMemo(
        () => [
            {
                label: "Regiao",
                name: "categorias",
                data: availableCategorias.map((name) => ({ id: name, name }))
            },
            { label: "Estado", name: "clients", data: availableClients },
            { label: "Varejista", name: "suppliers", data: availableSuppliers },
            { label: "Produto", name: "produtos", data: availableProdutos },
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
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Lucro Operacional Mensal",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={historicoMeses}
                        values={historicoOperatingProfit}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Mapa de Vendas por Estado",
                height: 320,
                component: (
                    <ChartMapMorph
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        geography="us"
                        metric="totalSales"
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Comparativo por Regiao",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={regionComparison.map((item) => item.name)}
                        values={regionComparison.map((item) => item.value)}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="categoria"
                        showTrendLine={false}
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Canal de Venda ao Longo do Tempo",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="amount"
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Mix por Canal de Venda",
                height: 260,
                component: (
                    <ChartPie
                        data={salesMethodMix}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="status"
                        categoryField="status"
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
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Distribuicao do Valor do Pedido por Produto",
                height: 320,
                caption: BOXPLOT_CONTEXT,
                component: (
                    <ChartBoxplot
                        backendData={tabela}
                        categoryField="produto"
                        valueField="valorTotal"
                        idField="product_id"
                        filterType="produto"
                        maxCategories={8}
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Varejistas por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={fornecedoresEntrega}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Dispersao Preco x Volume",
                height: 300,
                caption: SCATTER_CONTEXT,
                component: (
                    <ChartScatterAggregate
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Mapa de Calor Regiao x Mes",
                height: 280,
                caption: HEATMAP_CONTEXT,
                component: (
                    <ChartHeatmap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="operatingProfit"
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            },
            {
                title: "Preco Medio por Unidade ao Longo do Tempo",
                height: 260,
                fullWidth: true,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={TAB1_CURRENCY}
                        locale={TAB1_LOCALE}
                    />
                )
            }
        ],
        [
            fornecedoresEntrega,
            handleCrossFilter,
            historicoMeses,
            historicoOperatingProfit,
            historicoValores,
            produtosRanking,
            regionComparison,
            salesMethodMix,
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
            dateFilterPlacement="start"
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
            asyncState={asyncState}
        />
    );
};

export default React.memo(Tab1);
