import React, { useMemo, useCallback } from "react";
import ChartBarVertical from "../../components/shared/charts/ChartBarVertical";
import ChartHorizontal from "../../components/shared/charts/ChartHorizontal";
import ChartLine from "../../components/shared/charts/ChartLine";
import ChartMap from "../../components/shared/charts/ChartMap";
import DashboardTabLayout from "../../components/DashboardTabLayout";
import { useQuotationsState } from "./quotations.state";
import "./Quotations.css";

const QUOTATIONS_KPI_LABELS = {
    total_amount_finalized: "Valor Total Finalizado",
    finalized_quotations: "Quantidade Cotações Finalizadas",
    total_quotations: "Quantidade de Cotações",
    lowest_price: "Menor Preço Cotado"
};

const Quotations = () => {
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
        availableClients,
        availableSuppliers,
        availableProdutos,
        availableOrders,
        availableNumeroCotacao
    } = useQuotationsState();

    const tabela = data.operacionais?.tabela || [];
    const fact = data.overview?.fact || [];
    const kpis = data.kpis || {};

    const kpisParsed = useMemo(() => {
        const output = {};

        Object.keys(kpis).forEach(key => {
            if (key === "open_quotations") return;
            output[QUOTATIONS_KPI_LABELS[key] || key] = kpis[key];
        });

        return output;
    }, [kpis]);

    const rankingProdutos = useMemo(() => {
        const items = new Map();

        fact.forEach(row => {
            const key = row.product_name;
            items.set(key, (items.get(key) || 0) + (Number(row.sum_total_amount) || 0));
        });

        return Array.from(items.entries())
            .map(([name, valor]) => ({ name, valor }))
            .sort((a, b) => b.valor - a.valor);
    }, [fact]);

    const rankingFornecedores = useMemo(() => {
        const items = new Map();

        fact.forEach(row => {
            const key = row.supplier_name;
            items.set(key, (items.get(key) || 0) + (Number(row.sum_total_amount) || 0));
        });

        return Array.from(items.entries())
            .map(([name, valor]) => ({ name, valor }))
            .sort((a, b) => b.valor - a.valor);
    }, [fact]);

    const mapaUF = useMemo(() => {
        const items = new Map();

        fact.forEach(row => {
            const key = row.client_state;
            items.set(key, (items.get(key) || 0) + (Number(row.sum_total_amount) || 0));
        });

        return Array.from(items.entries()).map(([uf, total]) => ({ uf, total }));
    }, [fact]);

    const precoMedioFornecedores = useMemo(() => {
        const items = new Map();

        fact.forEach(row => {
            const key = row.supplier_name;
            const current = items.get(key) || { soma: 0, qtd: 0 };
            current.soma += Number(row.avg_unit_price) || 0;
            current.qtd += 1;
            items.set(key, current);
        });

        return Array.from(items.entries()).map(([name, value]) => ({
            name,
            value: value.qtd ? value.soma / value.qtd : 0
        }));
    }, [fact]);

    const mensalParsed = useMemo(() => {
        const items = new Map();

        fact.forEach(row => {
            const key = row.year_months;
            if (!key) return;
            items.set(key, (items.get(key) || 0) + 1);
        });

        const labels = Array.from(items.keys()).sort();

        return {
            labels,
            values: labels.map(label => items.get(label))
        };
    }, [fact]);

    const charts = useMemo(() => [
        {
            title: "Histórico Mensal de Cotações",
            height: 260,
            component: (
                <ChartBarVertical
                    labels={mensalParsed.labels}
                    values={mensalParsed.values}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="mes"
                    valueFormat="number"
                />
            )
        },
        {
            title: "Evolução Valor Unitário por Mês",
            height: 260,
            component: (
                <ChartLine
                    data={precoMedioFornecedores}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                />
            )
        },
        {
            title: "Distribuição Geográfica",
            height: 260,
            component: (
                <ChartMap
                    data={mapaUF}
                    backendData={tabela}
                    onCrossFilter={handleCrossFilter}
                    filterType="uf"
                />
            )
        },
        {
            title: "Ranking de Produtos Cotados Por Quantidade",
            height: 260,
            component: (
                <ChartHorizontal
                    title="Ranking de Produtos"
                    data={rankingProdutos}
                    backendData={tabela}
                    order="ASC"
                    height={250}
                    onCrossFilter={handleCrossFilter}
                    filterType="produto"
                />
            )
        },
        {
            title: "Ranking Quantidade de Cotações Por Fornecedores",
            height: 260,
            component: (
                <ChartHorizontal
                    title="Ranking de Fornecedores"
                    data={rankingFornecedores}
                    backendData={tabela}
                    order="ASC"
                    height={250}
                    onCrossFilter={handleCrossFilter}
                    filterType="fornecedor"
                />
            )
        }
    ], [
        mensalParsed,
        precoMedioFornecedores,
        mapaUF,
        rankingProdutos,
        rankingFornecedores,
        tabela,
        handleCrossFilter
    ]);

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
                fornecedores: availableSuppliers,
                clientes: availableClients,
                produtos: availableProdutos,
                orders: availableOrders,
                numeroCotacao: availableNumeroCotacao
            }}
            contentSectionClassName="section-gap"
            kpiTitle="KPIs de Cotações"
            overviewTitle="Visão Geral das Cotações"
            kpis={kpisParsed}
            alertas={data.alertas}
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
                modalClassName: "quotations-date-modal"
            }}
        />
    );
};

export default React.memo(Quotations);
