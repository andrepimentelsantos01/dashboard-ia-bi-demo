import React, { useMemo } from "react";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import GaugeCount from "../../components/shared/charts/GaugeCount/GaugeCount";
import {
    GAUGE_CONTEXT,
    HEATMAP_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useTab4State } from "./tab4.state";
import "./Tab4.css";

const LOGISTICS_CURRENCY = "USD";
const LOGISTICS_LOCALE = "en-US";

const LogisticsGaugePanel = React.memo(({ gauges }) => {
    const cards = [
        {
            key: "onTimeSla",
            label: "SLA no Prazo",
            value: gauges.onTimeSla,
            invertColors: true,
            helpText: GAUGE_CONTEXT.sla
        },
        {
            key: "successRate",
            label: "Taxa de Sucesso na Entrega",
            value: gauges.successRate,
            invertColors: true,
            helpText: "Percentual de embarques concluidos com status entregue no recorte filtrado. Quanto maior, maior a taxa de sucesso operacional da malha logistica."
        },
        {
            key: "exceptionRate",
            label: "Taxa de Excecao",
            value: gauges.exceptionRate,
            invertColors: false,
            helpText: "Percentual de embarques com excecao operacional, considerando atrasos, extravios e devolucoes. Quanto menor, mais saudavel esta a operacao."
        },
        {
            key: "carrierCompliance",
            label: "Conformidade da Transportadora",
            value: gauges.carrierCompliance,
            invertColors: true,
            helpText: "Conformidade media da transportadora selecionada, medida pela aderencia ao prazo planejado. Sem filtro de transportadora, mostra o melhor desempenho consolidado entre as transportadoras ativas."
        }
    ];

    return (
        <div className="tab4-gauge-grid">
            {cards.map((card) => (
                <div key={card.key} className="tab4-gauge-card">
                    <GaugeCount
                        value={card.value}
                        invertColors={card.invertColors}
                        helpText={card.helpText}
                        helpLabel={card.label}
                    />
                    <div className="tab4-gauge-caption">{card.label}</div>
                </div>
            ))}
        </div>
    );
});

const Tab4 = () => {
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
        availableCarriers,
        availableWarehouses,
        availableDestinations,
        availableStatus,
        availableRoutes
    } = useTab4State();

    const { tab4, operacionais, kpis, alertas } = data;
    const tabela = operacionais.tabela || [];

    const shipmentTrendData = useMemo(
        () => tabela.map((row) => ({
            ...row,
            valorTotal: 1,
            quantidade: 1
        })),
        [tabela]
    );

    const exceptionTrendData = useMemo(
        () => tabela.map((row) => {
            const hasException =
                Boolean(row.exception_flag) ||
                Number(row.delay_days || 0) > 0 ||
                row.item_status === "Atrasado";

            return {
                ...row,
                valorTotal: hasException ? 1 : 0,
                quantidade: hasException ? 1 : 0
            };
        }),
        [tabela]
    );

    const filterInputs = useMemo(
        () => [
            { label: "Transportadoras", name: "carriers", data: availableCarriers },
            { label: "Armazens", name: "warehouses", data: availableWarehouses },
            { label: "Destinos", name: "destinations", data: availableDestinations },
            { label: "Status", name: "status", data: availableStatus },
            { label: "Rotas", name: "produtos", data: availableRoutes }
        ],
        [availableCarriers, availableDestinations, availableRoutes, availableStatus, availableWarehouses]
    );

    const charts = useMemo(
        () => [
            {
                title: "SLA e Confiabilidade da Operacao",
                height: 320,
                fullWidth: true,
                component: <LogisticsGaugePanel gauges={tab4.gauges || {}} />
            },
            {
                title: "Embarques Mensais",
                height: 260,
                component: (
                    <ChartLine
                        backendData={shipmentTrendData}
                        onCrossFilter={handleCrossFilter}
                        metric="quantity"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Atrasos e Excecoes por Mes",
                height: 260,
                component: (
                    <ChartLine
                        backendData={exceptionTrendData}
                        onCrossFilter={handleCrossFilter}
                        metric="quantity"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Custo por Transportadora",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab4.carriersRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "SLA por Transportadora",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab4.carriersSlaRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="percent"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Embarques por Status ao Longo do Tempo",
                height: 300,
                fullWidth: true,
                caption: STACKED_BAR_CONTEXT,
                component: (
                    <ChartStackedBar
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        metric="quantity"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Embarques por Origem",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab4.warehousesRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Embarques por Destino",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={tab4.destinationsRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        valueFormat="volume"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Mapa de Calor Armazem x Mes",
                height: 280,
                caption: HEATMAP_CONTEXT,
                component: (
                    <ChartHeatmap
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            }
        ],
        [exceptionTrendData, handleCrossFilter, shipmentTrendData, tab4, tabela]
    );

    return (
        <DashboardTabLayout
            scopeClassName="bi-scope logistics-scope"
            filters={filters}
            onFilterChange={handleFieldChange}
            clearFilters={clearFilters}
            clearButtonRef={clearButtonRef}
            showFloatingClear={showFloatingClear}
            filterInputs={filterInputs}
            filterOptions={{
                carriers: availableCarriers,
                warehouses: availableWarehouses,
                destinations: availableDestinations,
                status: availableStatus,
                produtos: availableRoutes
            }}
            contentSectionClassName="section-gap"
            kpiTitle="KPIs de Performance Logistica"
            overviewTitle="Visao Geral de Performance Logistica"
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

export default React.memo(Tab4);
