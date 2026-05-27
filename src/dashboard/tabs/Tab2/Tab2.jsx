import React, { useMemo } from "react";
import ChartBoxplot from "../../components/shared/charts/ChartBoxplot";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine/ChartLine";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap/ChartTreemap";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import {
    BOXPLOT_CONTEXT,
    HEATMAP_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useTab2State } from "./tab2.state";
import "./Tab2.css";

const AMAZON_CURRENCY = "USD";
const AMAZON_LOCALE = "en-US";

const Tab2 = () => {
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
        availableCustomers,
        availableLocations,
        availableCategorias,
        availableProdutos,
        availablePayments,
        availableStatus
    } = useTab2State();

    const { tab2, operacionais, kpis, alertas } = data;
    const tabela = operacionais.tabela || [];

    const filterInputs = useMemo(
        () => [
            { label: "Localidades", name: "locations", data: availableLocations },
            { label: "Clientes", name: "customers", data: availableCustomers },
            {
                label: "Categorias",
                name: "categorias",
                data: availableCategorias.map((name) => ({ id: name, name }))
            },
            { label: "Produtos", name: "produtos", data: availableProdutos },
            { label: "Pagamento", name: "paymentMethods", data: availablePayments },
            { label: "Status", name: "status", data: availableStatus }
        ],
        [
            availableCategorias,
            availableCustomers,
            availableLocations,
            availablePayments,
            availableProdutos,
            availableStatus
        ]
    );

    const charts = useMemo(
        () => [
            {
                title: "Receita Mensal",
                height: 260,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="amount"
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Status ao Longo do Tempo",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="amount"
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Categoria",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab2.categoriasRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Distribuicao do Ticket por Categoria",
                height: 320,
                caption: BOXPLOT_CONTEXT,
                component: (
                    <ChartBoxplot
                        backendData={tabela}
                        categoryField="categoria"
                        valueField="valorTotal"
                        filterType="categoria"
                        maxCategories={8}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Metodo de Pagamento",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab2.paymentRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Mix por Status do Pedido",
                height: 260,
                component: (
                    <ChartTreemap
                        dataOverride={tab2.statusTreemap}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Produtos por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab2.produtosRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Localidade",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab2.locationsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Volume por Categoria",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab2.categoriasRankingVolume}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Evolucao do Preco Medio por Item",
                height: 260,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Mapa de Valor Categoria x Mes",
                height: 280,
                caption: HEATMAP_CONTEXT,
                component: (
                    <ChartHeatmap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            }
        ],
        [handleCrossFilter, tab2, tabela]
    );

    return (
        <DashboardTabLayout
            scopeClassName="bi-scope amazon-scope"
            filters={filters}
            onFilterChange={handleFieldChange}
            clearFilters={clearFilters}
            clearButtonRef={clearButtonRef}
            showFloatingClear={showFloatingClear}
            filterInputs={filterInputs}
            filterOptions={{
                locations: availableLocations,
                customers: availableCustomers,
                categorias: availableCategorias,
                produtos: availableProdutos,
                paymentMethods: availablePayments,
                status: availableStatus
            }}
            contentSectionClassName="mt-24"
            kpiTitle="KPIs de Vendas Amazon"
            overviewTitle="Visao Geral de Vendas Amazon"
            kpis={kpis}
            alertas={alertas}
            onCrossFilter={handleCrossFilter}
            resetToken={resetToken}
            charts={charts}
            tabela={tabela}
            asyncState={asyncState}
        />
    );
};

export default React.memo(Tab2);
