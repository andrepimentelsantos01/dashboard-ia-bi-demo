import { useState, useMemo, useCallback } from "react";
import * as echarts from "echarts";
import brasilMap from "/src/mocks/dashboard/brasil.geo.json";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";

echarts.registerMap("brazil-morph", brasilMap);

const UF_TO_NAME = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amap\u00e1",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Cear\u00e1",
    DF: "Distrito Federal",
    ES: "Esp\u00edrito Santo",
    GO: "Goi\u00e1s",
    MA: "Maranh\u00e3o",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Par\u00e1",
    PB: "Para\u00edba",
    PR: "Paran\u00e1",
    PE: "Pernambuco",
    PI: "Piau\u00ed",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rond\u00f4nia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "S\u00e3o Paulo",
    SE: "Sergipe",
    TO: "Tocantins"
};

const NAME_TO_UF = Object.fromEntries(
    Object.entries(UF_TO_NAME).map(([uf, name]) => [name, uf])
);

const generateCorporateScale = (count) => {
    const baseHue = 190;
    const hueSpread = 22;
    const saturation = 46;
    const lightnessStart = 90;
    const lightnessEnd = 34;

    return Array.from({ length: Math.max(count, 2) }, (_, i) => {
        const hue = (baseHue + (i * hueSpread) / Math.max(count - 1, 1)) % 360;
        const lightness =
            lightnessStart -
            ((lightnessStart - lightnessEnd) * i) / Math.max(count - 1, 1);

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
};

const formatCurrencyFull = (value) =>
    (typeof value === "number" ? value : Number(value || 0)).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

const toNumeric = (value) => (typeof value === "number" ? value : Number(value || 0));

export const useChartMapMorphState = ({ backendData, onCrossFilter }) => {
    const [open, setOpen] = useState(false);
    const [selectedUF, setSelectedUF] = useState(null);
    const [viewMode, setViewMode] = useState("map");
    const themeTokens = useChartThemeTokens();

    const handleRefresh = useCallback(() => {
        setSelectedUF(null);
        setViewMode("map");
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleToggleView = useCallback(() => {
        setViewMode((current) => (current === "map" ? "bar" : "map"));
    }, []);

    const aggregated = useMemo(() => {
        const byUF = {};
        const totals = {};

        for (const row of backendData || []) {
            const sourceUf = row.client_state ?? row.uf;
            const uf = typeof sourceUf === "string" ? sourceUf.trim().toUpperCase() : null;
            if (!uf || !UF_TO_NAME[uf]) continue;

            if (!byUF[uf]) {
                byUF[uf] = {
                    volume: 0,
                    categoriaValor: {},
                    categoriaQtd: {},
                    fornecedorValor: {},
                    fornecedorQtd: {},
                    produtoValor: {},
                    produtoQtd: {},
                    clientes: new Set(),
                    categoriaLeaderValor: "-",
                    categoriaLeaderQtd: "-",
                    fornecedorLeaderValor: "-",
                    fornecedorLeaderQtd: "-",
                    produtoLeaderValor: "-",
                    produtoLeaderQtd: "-"
                };
            }

            const bucket = byUF[uf];
            const value = toNumeric(row.valorTotal ?? row.total_amount ?? row.sum_total_amount);
            const quantity = toNumeric(row.quantidade ?? row.sum_quantity ?? row.quantity_requested);

            totals[uf] = (totals[uf] || 0) + value;
            bucket.volume += quantity;

            const updateLeader = (valueMap, quantityMap, leaderValueKey, leaderQuantityKey, label) => {
                if (!label) return;
                valueMap[label] = (valueMap[label] || 0) + value;
                quantityMap[label] = (quantityMap[label] || 0) + quantity;

                if (valueMap[label] > (valueMap[bucket[leaderValueKey]] || -1)) {
                    bucket[leaderValueKey] = label;
                }

                if (quantityMap[label] > (quantityMap[bucket[leaderQuantityKey]] || -1)) {
                    bucket[leaderQuantityKey] = label;
                }
            };

            updateLeader(
                bucket.categoriaValor,
                bucket.categoriaQtd,
                "categoriaLeaderValor",
                "categoriaLeaderQtd",
                row.categoria
            );
            updateLeader(
                bucket.fornecedorValor,
                bucket.fornecedorQtd,
                "fornecedorLeaderValor",
                "fornecedorLeaderQtd",
                row.fornecedor
            );
            updateLeader(
                bucket.produtoValor,
                bucket.produtoQtd,
                "produtoLeaderValor",
                "produtoLeaderQtd",
                row.produto
            );

            if (row.cliente) bucket.clientes.add(row.cliente);
        }

        return { totals, byUF };
    }, [backendData]);

    const mapData = useMemo(
        () =>
            Object.entries(aggregated.totals)
                .filter(([uf]) => UF_TO_NAME[uf])
                .map(([uf, value]) => ({
                    id: uf,
                    name: UF_TO_NAME[uf],
                    value
                })),
        [aggregated.totals]
    );

    const sortedData = useMemo(() => [...mapData].sort((a, b) => b.value - a.value), [mapData]);

    const maxValue = useMemo(
        () => mapData.reduce((max, item) => (item.value > max ? item.value : max), 0),
        [mapData]
    );

    const visualMapColors = useMemo(() => generateCorporateScale(mapData.length), [mapData.length]);

    const tooltipContentByName = useMemo(() => {
        const tooltipMap = {};

        for (const item of mapData) {
            const uf = NAME_TO_UF[item.name];
            const detail = aggregated.byUF[uf];
            if (!detail) continue;

            tooltipMap[item.name] = `
                <b>${item.name}</b><br/>
                <b>Valor Movimentado:</b> ${formatCurrencyFull(item.value)}<br/>
                <b>Volume Movimentado:</b> ${detail.volume}<br/><br/>
                <b>Categoria Lider (Valor):</b> ${detail.categoriaLeaderValor}<br/>
                <b>Categoria Lider (Quantidade):</b> ${detail.categoriaLeaderQtd}<br/><br/>
                <b>Fornecedor Lider (Valor):</b> ${detail.fornecedorLeaderValor}<br/>
                <b>Fornecedor Lider (Quantidade):</b> ${detail.fornecedorLeaderQtd}<br/><br/>
                <b>Produto Lider (Valor):</b> ${detail.produtoLeaderValor}<br/>
                <b>Produto Lider (Quantidade):</b> ${detail.produtoLeaderQtd}<br/><br/>
                <b>Clientes Atendidos:</b> ${detail.clientes.size}<br/>
            `;
        }

        return tooltipMap;
    }, [aggregated.byUF, mapData]);

    const handleClick = useCallback(
        (params) => {
            const name = params?.name;
            if (!name || !onCrossFilter) return;

            const uf = NAME_TO_UF[name];
            if (!uf) return;

            if (selectedUF === uf) {
                setSelectedUF(null);
                onCrossFilter({ type: "reset" });
                return;
            }

            setSelectedUF(uf);
            onCrossFilter({ type: "uf", value: uf });
        },
        [onCrossFilter, selectedUF]
    );

    const option = useMemo(() => {
        const commonTooltip = buildResponsiveTooltip((params) => {
            const item = viewMode === "map" ? params : sortedData[params.dataIndex];
            return item ? tooltipContentByName[item.name] || "" : "";
        });

        if (viewMode === "map") {
            return {
                animation: false,
                tooltip: commonTooltip,
                visualMap: {
                    min: 0,
                    max: maxValue > 0 ? maxValue : 100,
                    left: 18,
                    bottom: 18,
                    text: ["Alto", "Baixo"],
                    textStyle: { color: themeTokens.mapText },
                    inRange: {
                        color: visualMapColors
                    },
                    formatter: (value) => formatCurrencyFull(value),
                    calculable: false
                },
                series: [
                    {
                        id: "uf-distribution",
                        type: "map",
                        map: "brazil-morph",
                        roam: false,
                        zoom: 1.18,
                        center: [-55, -15],
                        aspectScale: 1,
                        selectedMode: false,
                        label: {
                            show: false
                        },
                        itemStyle: {
                            areaColor: themeTokens.mapArea,
                            borderColor: themeTokens.mapBorder,
                            borderWidth: 0.8
                        },
                        emphasis: {
                            label: { show: true, color: themeTokens.mapEmphasisLabel },
                            itemStyle: { areaColor: themeTokens.mapEmphasisArea }
                        },
                        data: mapData
                    }
                ]
            };
        }

        const labels = sortedData.map((item) => item.name);
        const values = sortedData.map((item) => item.value);
        const zoomStart = labels.length <= 8 ? 0 : ((labels.length - 8) / labels.length) * 100;

        return {
            animation: false,
            tooltip: commonTooltip,
            grid: {
                left: 132,
                right: 34,
                top: 18,
                bottom: 18
            },
            xAxis: {
                type: "value",
                splitLine: {
                    lineStyle: { color: themeTokens.splitLine, type: "dashed" }
                },
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    formatter: (value) => {
                        const parsed = Number(value || 0);
                        if (parsed >= 1_000_000) return `R$ ${(parsed / 1_000_000).toFixed(1)} mi`;
                        if (parsed >= 1_000) return `R$ ${(parsed / 1_000).toFixed(0)} mil`;
                        return `R$ ${parsed.toFixed(0)}`;
                    }
                }
            },
            yAxis: {
                type: "category",
                data: labels,
                inverse: true,
                axisTick: { show: false },
                axisLine: { show: false },
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    width: 118,
                    overflow: "truncate"
                }
            },
            dataZoom: [
                {
                    type: "slider",
                    yAxisIndex: 0,
                    orient: "vertical",
                    width: 12,
                    right: 4,
                    fillerColor: themeTokens.sliderFill,
                    handleColor: "#17877e",
                    handleSize: "100%",
                    start: zoomStart,
                    end: 100
                },
                {
                    type: "inside",
                    yAxisIndex: 0,
                    zoomOnMouseWheel: false,
                    moveOnMouseWheel: true,
                    moveOnMouseMove: true,
                    start: zoomStart,
                    end: 100
                }
            ],
            series: [
                {
                    id: "uf-distribution",
                    type: "bar",
                    data: values.map((value, index) => ({
                        value,
                        itemStyle: {
                            color: visualMapColors[Math.min(index, visualMapColors.length - 1)]
                        }
                    })),
                    barWidth: 22,
                    label: {
                        show: true,
                        position: "right",
                        color: themeTokens.chartLabelStrong,
                        fontSize: 10,
                        formatter: ({ value }) => formatCurrencyFull(value)
                    },
                    itemStyle: {
                        borderRadius: [0, 6, 6, 0]
                    }
                }
            ]
        };
    }, [
        mapData,
        maxValue,
        sortedData,
        themeTokens,
        tooltipContentByName,
        viewMode,
        visualMapColors
    ]);

    return {
        open,
        setOpen,
        option,
        handleClick,
        handleRefresh,
        handleToggleView,
        viewMode
    };
};
