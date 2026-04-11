import React, { useMemo, useCallback } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartMapMorph from "../../components/shared/charts/ChartMapMorph";
import ChartPie from "../../components/shared/charts/ChartPie";
import ChartScatterAggregate from "../../components/shared/charts/ChartScatterAggregate";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ClassificationCurvesButtons from "../../components/shared/classificationControls/ClassificationCurvesButtons";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import GaugeCount from "../../components/shared/charts/GaugeCount";
import {
    CURVE_BUTTONS_CONTEXT,
    GAUGE_CONTEXT,
    HEATMAP_CONTEXT,
    SCATTER_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useSuppliersState } from "./suppliers.state";
import "./Suppliers.css";

const Suppliers = () => {
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
        availableFornecedores,
        availableClientes,
        availableCategorias,
        availableProdutos,
        availableOrders
    } = useSuppliersState();

    const tabela = data.operacionais?.tabela || [];
    const overview = data.overview || {};

    const safeOverview = useMemo(
        () => ({
            historicoMeses: overview.historicoMeses || [],
            historicoValores: overview.historicoValores || [],
            rankingSLA: overview.rankingSLA || [],
            rankingGlosa: overview.rankingGlosa || [],
            rankingVolume: overview.rankingVolume || [],
            categoriasPizza: overview.categoriasPizza || [],
            slaMedio: overview.slaMedio || 0,
            percentualGlosa: overview.percentualGlosa || 0,
            percentualAtrasos: overview.percentualAtrasos || 0,
            curvaABCTreemap: overview.curvaABCTreemap || [],
            curvaXYZTreemap: overview.curvaXYZTreemap || [],
            matrizAbcXyzTreemap: overview.matrizAbcXyzTreemap || []
        }),
        [overview]
    );

    const produtosRanking = useMemo(() => {
        const items = new Map();

        tabela.forEach((row) => {
            const current = items.get(row.produto) || { name: row.produto, valor: 0 };
            current.valor += row.valorTotal || 0;
            items.set(row.produto, current);
        });

        return Array.from(items.values()).sort((a, b) => b.valor - a.valor);
    }, [tabela]);

    const ticketMedio = useMemo(() => {
        const soma = tabela.reduce((acc, row) => acc + (row.valorUnitario || 0), 0);
        return tabela.length > 0 ? soma / tabela.length : 0;
    }, [tabela]);

    const kpisFiltrados = useMemo(() => {
        const {
            ["Ticket MÃƒÂ©dio"]: ticketMedioQuebrado,
            ["Ticket MÃ©dio"]: ticketMedioCorreto,
            ...restKpis
        } = data.kpis || {};

        return {
            ...restKpis,
            "Ticket Medio":
                restKpis["Ticket Medio"] ??
                ticketMedioCorreto ??
                ticketMedioQuebrado ??
                ticketMedio
        };
    }, [data.kpis, ticketMedio]);

    const rankingVolumeParsed = useMemo(
        () => ({
            labels: safeOverview.rankingVolume.map((item) => item.name),
            values: safeOverview.rankingVolume.map((item) => item.valor)
        }),
        [safeOverview.rankingVolume]
    );

    const charts = useMemo(
        () => [
            {
                title: "Indicadores Percentuais",
                height: 260,
                component: (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "32px"
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <GaugeCount
                                value={safeOverview.slaMedio}
                                backendData={tabela}
                                onCrossFilter={handleCrossFilter}
                                filterType="fornecedor"
                                invertColors
                                helpText={GAUGE_CONTEXT.sla}
                                helpLabel="SLA Medio"
                            />
                            <div style={{ textAlign: "center", marginTop: 8 }}>SLA Medio</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <GaugeCount
                                value={safeOverview.percentualGlosa}
                                backendData={tabela}
                                onCrossFilter={handleCrossFilter}
                                filterType="fornecedor"
                                helpText={GAUGE_CONTEXT.glosa}
                                helpLabel="Percentual de Glosa"
                            />
                            <div style={{ textAlign: "center", marginTop: 8 }}>Percentual de Glosa</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <GaugeCount
                                value={safeOverview.percentualAtrasos}
                                backendData={tabela}
                                onCrossFilter={handleCrossFilter}
                                filterType="fornecedor"
                                helpText={GAUGE_CONTEXT.atraso}
                                helpLabel="Percentual de Atrasos"
                            />
                            <div style={{ textAlign: "center", marginTop: 8 }}>Percentual de Atrasos</div>
                        </div>
                    </div>
                )
            },
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
                title: "Historico Mensal Valor Consumido",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={safeOverview.historicoMeses}
                        values={safeOverview.historicoValores}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="currency"
                        filterType="mes"
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
                title: "Mapa de Valor Por Estado",
                height: 260,
                component: (
                    <ChartMapMorph
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
                title: "Percentual Glosa por Fornecedor",
                height: 260,
                component: (
                    <ChartHorizontal
                        title="Glosa por Fornecedor"
                        data={safeOverview.rankingGlosa}
                        backendData={tabela}
                        order="ASC"
                        height={250}
                        onCrossFilter={handleCrossFilter}
                        filterType="fornecedor"
                        valueFormat="percent"
                    />
                )
            },
            {
                title: "Historico Mensal Valor Movimentado por Fornecedor",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={rankingVolumeParsed.labels}
                        values={rankingVolumeParsed.values}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="fornecedor"
                        valueFormat="volume"
                        showTrendLine={false}
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
                        valueFormat="currency"
                    />
                )
            },
            {
                title: "Distribuicao de Categoria Por Valor",
                height: 260,
                component: (
                    <ChartPie
                        data={safeOverview.categoriasPizza}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        filterType="categoria"
                    />
                )
            }
        ],
        [filters, handleCrossFilter, produtosRanking, rankingVolumeParsed, safeOverview, setFilters, tabela]
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
                fornecedores: availableFornecedores,
                clientes: availableClientes,
                categorias: availableCategorias,
                produtos: availableProdutos,
                orders: availableOrders
            }}
            contentSectionClassName="section-gap"
            kpiTitle="KPIs de Fornecedores"
            overviewTitle="Visao Geral dos Fornecedores"
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
                modalClassName: "suppliers-date-modal"
            }}
        />
    );
};

export default React.memo(Suppliers);
