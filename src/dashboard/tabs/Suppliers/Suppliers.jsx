import React, { useMemo } from "react";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHeatmap from "../../components/shared/charts/ChartHeatmap";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartStackedBar from "../../components/shared/charts/ChartStackedBar";
import ChartTreemap from "../../components/shared/charts/ChartTreemap";
import GaugeCount from "../../components/shared/charts/GaugeCount/GaugeCount";
import {
    GAUGE_CONTEXT,
    HEATMAP_CONTEXT,
    STACKED_BAR_CONTEXT
} from "../../components/shared/chartContext";
import { useSuppliersState } from "./suppliers.state";
import "./Suppliers.css";

const LOGISTICS_CURRENCY = "USD";
const LOGISTICS_LOCALE = "en-US";

const LogisticsGaugePanel = React.memo(({ gauges }) => {
    const cards = [
        {
            key: "onTimeSla",
            label: "On-Time SLA",
            value: gauges.onTimeSla,
            invertColors: true,
            helpText: GAUGE_CONTEXT.sla
        },
        {
            key: "successRate",
            label: "Delivery Success Rate",
            value: gauges.successRate,
            invertColors: true,
            helpText: "Percentual de embarques concluidos com status entregue no recorte filtrado. Quanto maior, maior a taxa de sucesso operacional da malha logistica."
        },
        {
            key: "exceptionRate",
            label: "Exception Rate",
            value: gauges.exceptionRate,
            invertColors: false,
            helpText: "Percentual de embarques com excecao operacional, considerando atrasos, extravios e devolucoes. Quanto menor, mais saudavel esta a operacao."
        },
        {
            key: "carrierCompliance",
            label: "Carrier Compliance",
            value: gauges.carrierCompliance,
            invertColors: true,
            helpText: "Compliance medio do carrier selecionado, medido pela aderencia ao prazo planejado. Sem filtro de carrier, mostra o melhor desempenho consolidado entre os carriers ativos."
        }
    ];

    return (
        <div className="suppliers-gauge-grid">
            {cards.map((card) => (
                <div key={card.key} className="suppliers-gauge-card">
                    <GaugeCount
                        value={card.value}
                        invertColors={card.invertColors}
                        helpText={card.helpText}
                        helpLabel={card.label}
                    />
                    <div className="suppliers-gauge-caption">{card.label}</div>
                </div>
            ))}
        </div>
    );
});

const Suppliers = () => {
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
    } = useSuppliersState();

    const { logistics, operacionais, kpis, alertas } = data;
    const tabela = operacionais.tabela || [];

    const filterInputs = useMemo(
        () => [
            { label: "Carriers", name: "carriers", data: availableCarriers },
            { label: "Warehouses", name: "warehouses", data: availableWarehouses },
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
                component: <LogisticsGaugePanel gauges={logistics.gauges || {}} />
            },
            {
                title: "Embarques Mensais",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={logistics.historicoMeses}
                        values={logistics.historicoEmbarques}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="number"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Atrasos e Excecoes por Mes",
                height: 260,
                component: (
                    <ChartBarVertical
                        labels={logistics.historicoMeses}
                        values={logistics.historicoAtrasos}
                        backendData={tabela}
                        onCrossFilter={handleCrossFilter}
                        valueFormat="number"
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "Mix por Status da Entrega",
                height: 260,
                component: (
                    <ChartTreemap
                        dataOverride={logistics.statusTreemap}
                        onCrossFilter={handleCrossFilter}
                    />
                )
            },
            {
                title: "Embarques por Status ao Longo do Tempo",
                height: 280,
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
                title: "Custo por Carrier",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={logistics.carriersRanking}
                        backendData={tabela}
                        order="ASC"
                        onCrossFilter={handleCrossFilter}
                        currencyCode={LOGISTICS_CURRENCY}
                        locale={LOGISTICS_LOCALE}
                    />
                )
            },
            {
                title: "SLA por Carrier",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={logistics.carriersSlaRanking}
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
                title: "Embarques por Origem",
                height: 260,
                component: (
                    <ChartHorizontal
                        data={logistics.warehousesRanking}
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
                        data={logistics.destinationsRanking}
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
                title: "Mapa de Calor Warehouse x Mes",
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
        [handleCrossFilter, logistics, tabela]
    );

    return (
        <DashboardTabLayout
            scopeClassName="bi-scope"
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
            kpiTitle="KPIs de Logistics Performance"
            overviewTitle="Visao Geral de Logistics Performance"
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

export default React.memo(Suppliers);
