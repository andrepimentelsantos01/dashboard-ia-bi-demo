import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import "./ChartTreemap.css";
import { useChartTreemapState } from "./chartTreemap.state";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";

const STATUS_COLOR_MAP = {
    Cancelado: "#d95f5f",
    Entregue: "#2a9d8f",
    Atrasado: "#f4a261",
    Faturado: "#4f86c6",
    "In-store": "#2F80ED",
    Online: "#27AE60",
    Outlet: "#F2994A",
    Pendente: "#7b6fd6",
    "Em Trânsito": "#2bb3c0",
    "Em TrÃ¢nsito": "#2bb3c0",
    Desconhecido: "#7a8aa0",
    "Sem status": "#9aa6b2"
};

const ABC_COLOR_MAP = { A: "#4f86c6", B: "#2a9d8f", C: "#f4a261" };
const XYZ_COLOR_MAP = { X: "#7b6fd6", Y: "#2bb3c0", Z: "#e76f51" };
const MATRIX_COLOR_MAP = {
    AX: "#355c9a",
    AY: "#4f86c6",
    AZ: "#8db6f2",
    BX: "#1f8a70",
    BY: "#2bb3c0",
    BZ: "#78d5dd",
    CX: "#d97b2b",
    CY: "#f4a261",
    CZ: "#f7c58b"
};

const chartOpts = { renderer: "canvas" };

const CLASSIFICATION_HELP = {
    products: {
        abc: {
            A: "Itens com maior impacto financeiro e prioridade de abastecimento.",
            B: "Itens com impacto intermediário e acompanhamento recorrente.",
            C: "Itens de menor impacto financeiro individual."
        },
        xyz: {
            X: "Itens com consumo estável e previsível.",
            Y: "Itens com oscilação moderada e revisão periódica.",
            Z: "Itens com consumo irregular ou eventual."
        }
    },
    clients: {
        abc: {
            A: "Clientes que concentram a maior parcela do faturamento.",
            B: "Clientes com contribuição intermediária.",
            C: "Clientes de menor impacto financeiro individual."
        },
        xyz: {
            X: "Clientes recorrentes e previsíveis.",
            Y: "Clientes com comportamento variável ao longo do tempo.",
            Z: "Clientes sazonais ou esporádicos."
        }
    },
    suppliers: {
        abc: {
            A: "Fornecedores com maior peso financeiro no abastecimento.",
            B: "Fornecedores de contribuição intermediária.",
            C: "Fornecedores de menor impacto financeiro individual."
        },
        xyz: {
            X: "Fornecedores com volume estável e previsível.",
            Y: "Fornecedores com variação moderada de demanda.",
            Z: "Fornecedores com comportamento mais irregular."
        }
    }
};

const getClassificationMessage = (name, legendContext, classificationMode) => {
    const contextHelp = CLASSIFICATION_HELP[legendContext] || CLASSIFICATION_HELP.products;

    if (classificationMode === "abcxyz") {
        const abc = name?.[0];
        const xyz = name?.[1];
        const abcText = contextHelp.abc[abc] || "Classe ABC estratégica.";
        const xyzText = contextHelp.xyz[xyz] || "Classe XYZ comportamental.";
        return `${abcText} ${xyzText}`;
    }

    if (classificationMode === "xyz") {
        return contextHelp.xyz[name] || "Classificação XYZ.";
    }

    return contextHelp.abc[name] || "Classificação ABC.";
};

const getNodeColor = (name, classificationMode, themeTokens) => {
    if (classificationMode === "abc") return ABC_COLOR_MAP[name] || "#9aa6b2";
    if (classificationMode === "xyz") return XYZ_COLOR_MAP[name] || "#9aa6b2";
    if (classificationMode === "abcxyz") return MATRIX_COLOR_MAP[name] || "#9aa6b2";
    return themeTokens.statusPalette[name] || STATUS_COLOR_MAP[name] || "#9aa6b2";
};

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

const ChartTreemap = ({
    backendData,
    dataOverride,
    onCrossFilter,
    height = 250,
    hideValues = false,
    abcXyzLegend = "products",
    classificationMode = null
}) => {
    const themeTokens = useChartThemeTokens();
    const { open, setOpen, data, handleClick } = useChartTreemapState({
        backendData,
        dataOverride,
        onCrossFilter
    });

    const baseData = dataOverride || data;

    const treemapData = useMemo(
        () =>
            baseData.map((item) => ({
                ...item,
                itemStyle: {
                    color: getNodeColor(item.name, classificationMode, themeTokens),
                    borderRadius: 14,
                    shadowBlur: 18,
                    shadowColor: themeTokens.isAdidas ? "rgba(0,0,0,0.22)" : "rgba(12,56,53,0.20)",
                    shadowOffsetX: 0,
                    shadowOffsetY: 4,
                    borderColor: "rgba(255,255,255,0.65)",
                    borderWidth: 2
                }
            })),
        [baseData, classificationMode, themeTokens]
    );

    const option = useMemo(
        () => ({
            animation: false,
            tooltip: buildResponsiveTooltip((params) => {
                const dataPoint = params?.data;
                if (!dataPoint) return "";

                if (classificationMode) {
                    return `
                        <b>${dataPoint.name}</b><br/>
                        Valor representado: <b>${formatCurrency(dataPoint.value)}</b><br/>
                        Participacao: <b>${Number(dataPoint.percentage || 0).toFixed(1)}%</b><br/>
                        ${abcXyzLegend === "clients" ? "Clientes" : abcXyzLegend === "suppliers" ? "Fornecedores" : "Produtos"} na classe: <b>${dataPoint.entityCount || 0}</b><br/>
                        Volume agregado: <b>${Number(dataPoint.totalQuantity || 0).toLocaleString("pt-BR")}</b><br/><br/>
                        ${getClassificationMessage(dataPoint.name, abcXyzLegend, classificationMode)}
                    `;
                }

                return `
                    <b>${dataPoint.name}</b><br/>
                    Quantidade de Ordens: <b>${dataPoint.value}</b><br/><br/>
                    <b>Volume Movimentado:</b> ${dataPoint.volume}<br/><br/>
                    <b>Categoria Líder (Valor):</b> ${dataPoint.categoriaLeaderValor}<br/>
                    <b>Categoria Líder (Quantidade):</b> ${dataPoint.categoriaLeaderQtd}<br/><br/>
                    <b>Fornecedor Líder (Valor):</b> ${dataPoint.fornecedorLeaderValor}<br/>
                    <b>Fornecedor Líder (Quantidade):</b> ${dataPoint.fornecedorLeaderQtd}<br/><br/>
                    <b>Produto Líder (Valor):</b> ${dataPoint.produtoLeaderValor}<br/>
                    <b>Produto Líder (Quantidade):</b> ${dataPoint.produtoLeaderQtd}<br/><br/>
                    <b>Clientes Atendidos:</b> ${dataPoint.clientesAtendidos}<br/>
                `;
            }),
            series: [
                {
                    type: "treemap",
                    data: treemapData,
                    roam: false,
                    breadcrumb: { show: false },
                    sort: "none",
                    nodeClick: false,
                    label: {
                        show: true,
                        formatter: (params) =>
                            hideValues
                                ? `${params.name}\n${Number(params.data?.percentage || 0).toFixed(1)}%`
                                : `${params.name}\n${params.value}`,
                        color: "#ffffff",
                        fontSize: 12
                    }
                }
            ]
        }),
        [abcXyzLegend, classificationMode, hideValues, treemapData]
    );

    return (
        <>
            <div className="treemap-container">
                <ReactECharts
                    option={option}
                    style={{ width: "100%", height: `${height}px`, borderRadius: "18px" }}
                    onEvents={{ click: handleClick }}
                    lazyUpdate
                    opts={chartOpts}
                />
            </div>

            <ModalComponent
                title="Visualizacao Ampliada"
                open={open}
                setOpen={() => setOpen(false)}
                content={
                    open ? (
                        <ReactECharts
                            option={option}
                            style={{ width: "100%", height: "100%" }}
                            onEvents={{ click: handleClick }}
                            lazyUpdate
                            opts={chartOpts}
                        />
                    ) : null
                }
            />
        </>
    );
};

export default React.memo(ChartTreemap);
