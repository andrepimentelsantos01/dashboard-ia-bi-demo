import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import "./ChartTreemap.css";
import { useChartTreemapState } from "./chartTreemap.state";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

const STATUS_COLOR_MAP = {
    Cancelado: "#0e4946",
    Entregue: "#177972",
    Atrasado: "#12635e",
    Faturado: "#177972",
    Pendente: "#22a69b",
    "Em Trânsito": "#40b8ad",
    Desconhecido: "#26717e",
    "Sem status": "#93a9a6"
};

const ABC_COLOR_MAP = { A: "#0f4f4c", B: "#177972", C: "#63c9c0" };
const XYZ_COLOR_MAP = { X: "#12635e", Y: "#1b8f86", Z: "#87dad3" };
const MATRIX_COLOR_MAP = {
    AX: "#0f4f4c",
    AY: "#12635e",
    AZ: "#177972",
    BX: "#1b8f86",
    BY: "#22a69b",
    BZ: "#40b8ad",
    CX: "#63c9c0",
    CY: "#86d8cf",
    CZ: "#b3ebe5"
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

const getNodeColor = (name, classificationMode) => {
    if (classificationMode === "abc") return ABC_COLOR_MAP[name] || "#93a9a6";
    if (classificationMode === "xyz") return XYZ_COLOR_MAP[name] || "#93a9a6";
    if (classificationMode === "abcxyz") return MATRIX_COLOR_MAP[name] || "#93a9a6";
    return STATUS_COLOR_MAP[name] || "#93a9a6";
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
                    color: getNodeColor(item.name, classificationMode),
                    borderRadius: 14,
                    shadowBlur: 18,
                    shadowColor: "rgba(12,56,53,0.20)",
                    shadowOffsetX: 0,
                    shadowOffsetY: 4,
                    borderColor: "rgba(255,255,255,0.65)",
                    borderWidth: 2
                }
            })),
        [baseData, classificationMode]
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
