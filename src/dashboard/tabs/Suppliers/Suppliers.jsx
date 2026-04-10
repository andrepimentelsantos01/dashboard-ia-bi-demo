import React, { useMemo, useCallback } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartPie from "../../components/shared/charts/ChartPie";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import GaugeCount from "../../components/shared/charts/GaugeCount";
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

    const safeOverview = useMemo(() => ({
        historicoMeses: overview.historicoMeses || [],
        historicoValores: overview.historicoValores || [],
        rankingSLA: overview.rankingSLA || [],
        rankingGlosa: overview.rankingGlosa || [],
        rankingVolume: overview.rankingVolume || [],
        categoriasPizza: overview.categoriasPizza || [],
        slaMedio: overview.slaMedio || 0,
        percentualGlosa: overview.percentualGlosa || 0,
        percentualAtrasos: overview.percentualAtrasos || 0
    }), [overview]);

    const produtosRanking = useMemo(() => {
        const items = new Map();

        tabela.forEach(row => {
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
            ["Ticket MÃ©dio"]: ticketMedioQuebrado,
            ["Ticket Médio"]: ticketMedioCorreto,
            ...restKpis
        } = data.kpis || {};

        return {
            ...restKpis,
            "Ticket Médio": ticketMedioCorreto ?? ticketMedioQuebrado ?? ticketMedio
        };
    }, [data.kpis, ticketMedio]);

    const rankingVolumeParsed = useMemo(() => ({
        labels: safeOverview.rankingVolume.map(item => item.name),
        values: safeOverview.rankingVolume.map(item => item.valor)
    }), [safeOverview.rankingVolume]);

    const charts = useMemo(() => [
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
                            invertColors={true}
                        />
                        <div style={{ textAlign: "center", marginTop: 8 }}>SLA Médio</div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <GaugeCount
                            value={safeOverview.percentualGlosa}
                            backendData={tabela}
                            onCrossFilter={handleCrossFilter}
                            filterType="fornecedor"
                        />
                        <div style={{ textAlign: "center", marginTop: 8 }}>Percentual de Glosa</div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <GaugeCount
                            value={safeOverview.percentualAtrasos}
                            backendData={tabela}
                            onCrossFilter={handleCrossFilter}
                            filterType="fornecedor"
                        />
                        <div style={{ textAlign: "center", marginTop: 8 }}>Percentual de Atrasos</div>
                    </div>
                </div>
            )
        },
        {
            title: "Histórico Mensal Valor Consumido",
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
            title: "Histórico Mensal Valor Movimentado por Fornecedor",
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
            title: "Distribuição de Categoria Por Valor",
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
    ], [tabela, safeOverview, rankingVolumeParsed, produtosRanking, handleCrossFilter]);

    const handleCloseDateModal = useCallback(() => {
        setOpenDateModal(false);
    }, [setOpenDateModal]);

    const handleClearDate = useCallback(() => {
        setTempDateRange(null);
        setFilters(previous => ({ ...previous, dateRange: null }));
        setOpenDateModal(false);
    }, [setTempDateRange, setFilters, setOpenDateModal]);

    const handleApplyDate = useCallback(() => {
        setFilters(previous => ({ ...previous, dateRange: tempDateRange }));
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
            overviewTitle="Visão Geral dos Fornecedores"
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
                onChange: event => setTempDateRange(event.target.value),
                modalClassName: "suppliers-date-modal"
            }}
        />
    );
};

export default React.memo(Suppliers);
