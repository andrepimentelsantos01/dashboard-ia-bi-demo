import React, { useMemo } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine/ChartLine";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap/ChartTreemap";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import {
    HEATMAP_CONTEXT,
    SCATTER_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useProductsState } from "./products.state";
import "./Products.css";

const AMAZON_CURRENCY = "USD";
const AMAZON_LOCALE = "en-US";

const Products = () => {
    const {
        filters,
        data,
        resetToken,
        showFloatingClear,
        clearButtonRef,
        handleFieldChange,
        clearFilters,
        handleCrossFilter,
        availableCustomers,
        availableLocations,
        availableCategorias,
        availableProdutos,
        availablePayments,
        availableStatus
    } = useProductsState();

    const { amazon, operacionais, kpis, alertas } = data;
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
                    <ChartBarVertical
                        labels={amazon.historicoMeses}
                        values={amazon.historicoValores}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Pedidos por Mes",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={amazon.historicoMeses}
                        values={amazon.historicoPedidos}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="number"
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Mix de Categorias por Receita",
                height: 260,
                component: (
                    <ChartPie
                        data={amazon.categoriasPizza}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Mix por Status do Pedido",
                height: 260,
                component: (
                    <ChartTreemap
                        dataOverride={amazon.statusTreemap}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Categoria",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={amazon.categoriasRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Receita por Metodo de Pagamento",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={amazon.paymentRanking}
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
                        data={amazon.locationsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
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
                title: "Volume por Status ao Longo do Tempo",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="quantity"
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Produtos por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={amazon.produtosRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            },
            {
                title: "Ranking de Produtos por Volume",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={amazon.produtosRankingVolume}
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
                title: "Volume por Categoria",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={amazon.categoriasRankingVolume}
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
                title: "Dispersao Preco x Volume",
                height: 300,
                caption: SCATTER_CONTEXT,
                component: (
                    <ChartScatterAggregate
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
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
                        currencyCode={AMAZON_CURRENCY}
                        locale={AMAZON_LOCALE}
                    />
                )
            }
        ],
        [amazon, handleCrossFilter, tabela]
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
            kpiTitle="KPIs de Amazon Sales"
            overviewTitle="Visao Geral de Amazon Sales"
            kpis={kpis}
            alertas={alertas}
            onCrossFilter={handleCrossFilter}
            resetToken={resetToken}
            charts={charts}
            tabela={tabela}
        />
    );
};

export default React.memo(Products);
