import React, { useEffect, useMemo } from "react";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartBoxplot from "../../components/shared/charts/ChartBoxplot";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import {
    BOXPLOT_CONTEXT,
    HEATMAP_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { compactFilters, compactSeries, publishDashboardAiContext, topItems } from "../../utils/aiContext";
import { useTab3State } from "./tab3.state";
import "./Tab3.css";

const Tab3 = () => {
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
        availableShifts,
        availableAttendants,
        availableCategorias,
        availableProdutos,
        availableTransactions
    } = useTab3State();

    const { tab3, operacionais, kpis, alertas } = data;
    const tabela = operacionais.tabela || [];

    useEffect(() => publishDashboardAiContext({
        aba: "Vendas Restaurante",
        filtrosAtivos: compactFilters(filters),
        kpis,
        alertas,
        graficos: {
            receitaMensal: compactSeries(tab3.historicoMeses, tab3.historicoValores),
            quantidadeMensal: compactSeries(tab3.historicoMeses, tab3.historicoQuantidades),
            rankingItensPorReceita: topItems(tab3.itemsRanking, "valor", 12),
            rankingItensPorVolume: topItems(tab3.itemsRankingVolume, "valor", 10),
            receitaPorTurno: topItems(tab3.shiftsRanking, "valor", 10),
            volumePorTurno: topItems(tab3.shiftsRankingVolume, "valor", 10),
            receitaPorAtendente: topItems(tab3.attendantsRanking, "valor", 10),
            receitaPorTipoTransacao: topItems(tab3.transactionRanking, "valor", 10),
            mixTipoTransacao: topItems(tab3.statusTreemap, "value", 10)
        },
        amostraTabela: tabela.slice(0, 5),
        totalLinhasTabela: tabela.length
    }), [alertas, filters, kpis, tab3, tabela]);

    const filterInputs = useMemo(
        () => [
            { label: "Turnos", name: "shifts", data: availableShifts },
            { label: "Tipo de Transacao", name: "transactionTypes", data: availableTransactions },
            { label: "Atendentes", name: "attendants", data: availableAttendants },
            { label: "Itens do Menu", name: "produtos", data: availableProdutos },
            {
                label: "Categorias",
                name: "categorias",
                data: availableCategorias.map((name) => ({ id: name, name }))
            }
        ],
        [availableAttendants, availableCategorias, availableProdutos, availableShifts, availableTransactions]
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
                    />
                )
            },
            {
                title: "Itens Vendidos por Mes",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={tab3.historicoMeses}
                        values={tab3.historicoQuantidades}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="number"
                        valueLabel="Quantidade"
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
                title: "Receita por Turno",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab3.shiftsRanking}
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
                        data={tab3.transactionRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Mix por Tipo de Transacao",
                height: 260,
                component: (
                    <ChartTreemap
                        dataOverride={tab3.statusTreemap}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Ranking de Itens por Receita",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab3.itemsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Distribuicao do Valor por Item",
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
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Receita por Atendente",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab3.attendantsRanking}
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
                        data={tab3.itemsRankingVolume}
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
                        data={tab3.shiftsRankingVolume}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
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
                title: "Evolucao do Preco Medio por Item",
                height: 260,
                fullWidth: true,
                component: (
                    <ChartLine
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            }
        ],
        [handleCrossFilter, tab3, tabela]
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
            kpiTitle="KPIs de Vendas Restaurante"
            overviewTitle="Visao Geral de Vendas Restaurante"
            tableTitle="Tabela Consolidada / Dados Operacionais"
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

export default React.memo(Tab3);
