import React, { useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import "./ChartPie.css";
import { useChartPieState } from "./chartPie.state";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

const stringToHue = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 50) + 180;
};

const getCorporateColorByName = (name) => {
    const hue = stringToHue(name || "");
    return `hsl(${hue}, 46%, 52%)`;
};

const formatCurrency = (value) =>
    value?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return Number(value.toString().replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
};

const ChartPie = ({ data, backendData, onVisualFilter, onCrossFilter, filterType }) => {
    const {
        open,
        setOpen,
        filteredData,
        handleClick,
        handleLegendClick,
        metadataByCategory,
        handleRefresh,
        chartKey,
        setChartKey
    } = useChartPieState({ data, backendData, onVisualFilter, onCrossFilter, filterType });

    const sortDesc = useCallback(
        (record) => Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
        []
    );

    const tooltipFormatter = useCallback((params) => {
        const name = params.name;
        const rows = metadataByCategory[name] || [];

        let volume = 0;
        const fornecedorValor = {};
        const fornecedorQuantidade = {};
        const produtoValor = {};
        const produtoQuantidade = {};
        const clients = new Set();

        for (const row of rows) {
            const value = toNumber(row.valorTotal);
            const quantity = Number(row.quantidade) || 0;
            volume += quantity;

            if (row.fornecedor) {
                fornecedorValor[row.fornecedor] = (fornecedorValor[row.fornecedor] || 0) + value;
                fornecedorQuantidade[row.fornecedor] = (fornecedorQuantidade[row.fornecedor] || 0) + quantity;
            }

            if (row.produto) {
                produtoValor[row.produto] = (produtoValor[row.produto] || 0) + value;
                produtoQuantidade[row.produto] = (produtoQuantidade[row.produto] || 0) + quantity;
            }

            if (row.cliente) clients.add(row.cliente);
        }

        return `
            <b>${name}</b><br/>
            Valor: <b>${formatCurrency(params.value)}</b><br/>
            Percentual: <b>${params.percent}%</b><br/><br/>
            <b>Volume Movimentado:</b> ${volume}<br/><br/>
            <b>Fornecedor Líder (Valor):</b> ${sortDesc(fornecedorValor)}<br/>
            <b>Fornecedor Líder (Quantidade):</b> ${sortDesc(fornecedorQuantidade)}<br/><br/>
            <b>Produto Líder (Valor):</b> ${sortDesc(produtoValor)}<br/>
            <b>Produto Líder (Quantidade):</b> ${sortDesc(produtoQuantidade)}<br/><br/>
            <b>Clientes Atendidos:</b> ${clients.size}<br/>
        `;
    }, [metadataByCategory, sortDesc]);

    const option = useMemo(() => ({
        tooltip: buildResponsiveTooltip(tooltipFormatter, { padding: 18 }),
        legend: {
            type: "scroll",
            orient: "horizontal",
            bottom: 0,
            icon: "circle",
            itemHeight: 12,
            itemWidth: 12,
            itemGap: 12,
            padding: [25, 0, 0, 0],
            textStyle: { color: "#4b5864", fontSize: 11, lineHeight: 14 }
        },
        series: [
            {
                type: "pie",
                radius: ["35%", "68%"],
                center: ["50%", "47%"],
                data: filteredData,
                itemStyle: {
                    color: (params) => getCorporateColorByName(params.name),
                    borderWidth: 2,
                    borderColor: "#ffffff"
                },
                label: {
                    show: true,
                    position: "outside",
                    formatter: "{b}: {d}%",
                    fontSize: 12,
                    color: "#2e3642"
                },
                labelLine: {
                    show: true,
                    smooth: true,
                    length: 16,
                    length2: 12,
                    lineStyle: {
                        color: "rgba(0,0,0,0.25)",
                        width: 1.2
                    }
                },
                emphasis: {
                    scale: true,
                    scaleSize: 10,
                    itemStyle: {
                        shadowBlur: 18,
                        shadowColor: "rgba(0,0,0,0.30)"
                    }
                },
                animationDuration: 900,
                animationEasing: "cubicOut"
            }
        ]
    }), [filteredData, tooltipFormatter]);

    const refreshChart = useCallback(() => {
        handleRefresh();
        setChartKey((current) => current + 1);
    }, [handleRefresh, setChartKey]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);
    const chartStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

    const events = useMemo(
        () => ({
            click: handleClick,
            legendselectchanged: (params, chart) => handleLegendClick(params, chart)
        }),
        [handleClick, handleLegendClick]
    );

    return (
        <>
            <div className="chart-pie-container">
                <button onClick={refreshChart} className="chart-pie-refresh-btn">
                    <FiRefreshCcw className="chart-pie-refresh-icon" />
                </button>

                <button onClick={openModal} className="chart-pie-expand-btn">
                    <FiMaximize2 className="chart-pie-expand-icon" />
                </button>

                <ReactECharts
                    key={chartKey}
                    option={option}
                    onEvents={events}
                    style={chartStyle}
                />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={closeModal}
                content={<ReactECharts key={chartKey} option={option} style={chartStyle} />}
                isOpenInvoiced={false}
                titleCard=""
            />
        </>
    );
};

export default React.memo(ChartPie);