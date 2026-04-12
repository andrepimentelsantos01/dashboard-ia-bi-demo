import React, { useMemo } from "react";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import {
    HEATMAP_CONTEXT,
    SCATTER_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useClientsState } from "./clients.state";
import "./Clients.css";

const Clients = () => {
    const {
        filters,
        data,
        resetToken,
        showFloatingClear,
        clearButtonRef,
        handleFieldChange,
        clearFilters,
        handleCrossFilter,
        availableShifts,
        availableAttendants,
        availableCategorias,
        availableProdutos,
        availableTransactions
    } = useClientsState();

    const { restaurant, operacionais, kpis, alertas } = data;
    const tabela = operacionais.tabela || [];

    const filterInputs = useMemo(
        () => [
            { label: "Turnos", name: "shifts", data: availableShifts },
            { label: "Atendentes", name: "attendants", data: availableAttendants },
            {
                label: "Categorias",
                name: "categorias",
                data: availableCategorias.map((name) => ({ id: name, name }))
            },
            { label: "Itens do Menu", name: "produtos", data: availableProdutos },
            { label: "Tipo de Transacao", name: "transactionTypes", data: availableTransactions }
        ],
        [availableAttendants, availableCategorias, availableProdutos, availableShifts, availableTransactions]
    );

    const charts = useMemo(
        () => [
            {
                title: "Receita Mensal",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={restaurant.historicoMeses}
                        values={restaurant.historicoValores}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Pedidos por Mes",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={restaurant.historicoMeses}
                        values={restaurant.historicoPedidos}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="number"
                    />
                )
            },
            {
                title: "Mix por Categoria",
                height: 260,
                component: (
                    <ChartPie
                        data={restaurant.categoriasPizza}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Mix por Tipo de Transacao",
                height: 260,
                component: (
                    <ChartTreemap
                        dataOverride={restaurant.statusTreemap}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Turno",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={restaurant.shiftsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Tipo de Transacao",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={restaurant.transactionRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Atendente",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={restaurant.attendantsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Transacao ao Longo do Tempo",
                height: 280,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="amount"
                    />
                )
            },
            {
                title: "Volume por Transacao ao Longo do Tempo",
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
                title: "Ranking de Itens por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={restaurant.itemsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Itens por Volume",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={restaurant.itemsRankingVolume}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                    />
                )
            },
            {
                title: "Volume por Turno",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={restaurant.shiftsRankingVolume}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
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
            }
        ],
        [handleCrossFilter, restaurant, tabela]
    );

    return (
        <DashboardTabLayout
            scopeClassName="bi-scope restaurant-scope"
            filters={filters}
            onFilterChange={handleFieldChange}
            clearFilters={clearFilters}
            clearButtonRef={clearButtonRef}
            showFloatingClear={showFloatingClear}
            filterInputs={filterInputs}
            filterOptions={{
                shifts: availableShifts,
                attendants: availableAttendants,
                categorias: availableCategorias,
                produtos: availableProdutos,
                transactionTypes: availableTransactions
            }}
            contentSectionClassName="section-gap"
            kpiTitle="KPIs de Restaurant Sales"
            overviewTitle="Visao Geral de Restaurant Sales"
            kpis={kpis}
            alertas={alertas}
            onCrossFilter={handleCrossFilter}
            resetToken={resetToken}
            charts={charts}
            tabela={tabela}
        />
    );
};

export default React.memo(Clients);
