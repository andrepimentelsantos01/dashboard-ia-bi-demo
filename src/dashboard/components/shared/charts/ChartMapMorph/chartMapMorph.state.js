import { useState, useMemo, useCallback } from "react";
import * as echarts from "echarts";
import brasilMap from "/src/mocks/dashboard/brasil.geo.json";
import usStatesMap from "./geoJson/us-states.json";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";
import { formatCompactCurrencyValue, formatCurrencyValue } from "../../../../utils/intlFormat";

if (!echarts.getMap("brazil-morph")) {
    echarts.registerMap("brazil-morph", brasilMap);
}

if (!echarts.getMap("us-states-morph")) {
    echarts.registerMap("us-states-morph", usStatesMap);
}

const BRAZIL_UF_TO_NAME = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapa",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Ceara",
    DF: "Distrito Federal",
    ES: "Espirito Santo",
    GO: "Goias",
    MA: "Maranhao",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Para",
    PB: "Paraiba",
    PR: "Parana",
    PE: "Pernambuco",
    PI: "Piaui",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondonia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "Sao Paulo",
    SE: "Sergipe",
    TO: "Tocantins"
};

const normalizeName = (value = "") =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

const US_NAME_MAP = Object.fromEntries(
    (usStatesMap.features || [])
        .map((feature) => feature?.properties?.name)
        .filter(Boolean)
        .map((name) => [normalizeName(name), name])
);

const GEO_CONFIG = {
    brazil: {
        mapName: "brazil-morph",
        resolveRegion(row) {
            const sourceUf = row.client_state ?? row.uf;
            const uf = typeof sourceUf === "string" ? sourceUf.trim().toUpperCase() : null;
            if (!uf || !BRAZIL_UF_TO_NAME[uf]) return null;

            return {
                chartName: BRAZIL_UF_TO_NAME[uf],
                filterType: "uf",
                filterValue: uf
            };
        },
        mapOptions: {
            zoom: 1.18,
            center: [-55, -15],
            aspectScale: 1
        }
    },
    us: {
        mapName: "us-states-morph",
        resolveRegion(row) {
            const stateName = row.client_state || row.cliente || row.client_name || row.uf;
            const normalized = normalizeName(stateName);
            const chartName = US_NAME_MAP[normalized];

            if (!chartName) return null;

            return {
                chartName,
                filterType: "cliente",
                filterValue: chartName,
                filterId: row.client_id ?? chartName
            };
        },
        mapOptions: {
            zoom: 1,
            center: [-96, 38.5],
            aspectScale: 0.95
        }
    }
};

const generateCorporateScale = (count, isAdidas) => {
    if (isAdidas) {
        return ["#efefef", "#cfcfcf", "#9a9a9a", "#5e5e5e", "#171515"];
    }

    const baseHue = 172;
    const hueSpread = 10;
    const saturation = 46;
    const lightnessStart = 90;
    const lightnessEnd = 34;

    return Array.from({ length: Math.max(count, 2) }, (_, index) => {
        const hue = (baseHue + (index * hueSpread) / Math.max(count - 1, 1)) % 360;
        const lightness =
            lightnessStart - ((lightnessStart - lightnessEnd) * index) / Math.max(count - 1, 1);

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
};

const formatMetricFull = (value, currencyCode, locale) =>
    formatCurrencyValue(typeof value === "number" ? value : Number(value || 0), {
        currencyCode,
        locale
    });

const toNumeric = (value) => (typeof value === "number" ? value : Number(value || 0));

export const useChartMapMorphState = ({
    backendData,
    onCrossFilter,
    geography = "brazil",
    currencyCode = "BRL",
    locale = "pt-BR"
}) => {
    const [open, setOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [viewMode, setViewMode] = useState("map");
    const themeTokens = useChartThemeTokens();
    const geographyConfig = GEO_CONFIG[geography] || GEO_CONFIG.brazil;

    const handleRefresh = useCallback(() => {
        setSelectedRegion(null);
        setViewMode("map");
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleToggleView = useCallback(() => {
        setViewMode((current) => (current === "map" ? "bar" : "map"));
    }, []);

    const aggregated = useMemo(() => {
        const byRegion = {};

        for (const row of backendData || []) {
            const region = geographyConfig.resolveRegion(row);
            if (!region?.chartName) continue;

            if (!byRegion[region.chartName]) {
                byRegion[region.chartName] = {
                    ...region,
                    total: 0,
                    volume: 0,
                    categoriaValor: {},
                    categoriaQtd: {},
                    fornecedorValor: {},
                    fornecedorQtd: {},
                    produtoValor: {},
                    produtoQtd: {},
                    clientes: new Set()
                };
            }

            const bucket = byRegion[region.chartName];
            const value = toNumeric(row.valorTotal ?? row.total_amount ?? row.sum_total_amount);
            const quantity = toNumeric(row.quantidade ?? row.sum_quantity ?? row.quantity_requested);

            bucket.total += value;
            bucket.volume += quantity;

            const updateLeader = (valueMap, quantityMap, label) => {
                if (!label) return;
                valueMap[label] = (valueMap[label] || 0) + value;
                quantityMap[label] = (quantityMap[label] || 0) + quantity;
            };

            updateLeader(bucket.categoriaValor, bucket.categoriaQtd, row.categoria);
            updateLeader(bucket.fornecedorValor, bucket.fornecedorQtd, row.fornecedor);
            updateLeader(bucket.produtoValor, bucket.produtoQtd, row.produto);

            if (row.cliente) bucket.clientes.add(row.cliente);
        }

        return byRegion;
    }, [backendData, geographyConfig]);

    const mapData = useMemo(
        () =>
            Object.values(aggregated).map((item) => ({
                id: item.filterValue,
                name: item.chartName,
                value: item.total
            })),
        [aggregated]
    );

    const sortedData = useMemo(() => [...mapData].sort((a, b) => b.value - a.value), [mapData]);
    const maxValue = useMemo(() => mapData.reduce((max, item) => Math.max(max, item.value), 0), [mapData]);
    const visualMapColors = useMemo(
        () => generateCorporateScale(mapData.length, themeTokens.isAdidas),
        [mapData.length, themeTokens.isAdidas]
    );

    const tooltipContentByName = useMemo(() => {
        const tooltipMap = {};

        for (const item of mapData) {
            const detail = aggregated[item.name];
            if (!detail) continue;

            const topLabel = (record) =>
                Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

            tooltipMap[item.name] = `
                <b>${item.name}</b><br/>
                <b>Valor Movimentado:</b> ${formatMetricFull(item.value, currencyCode, locale)}<br/>
                <b>Volume Movimentado:</b> ${Math.round(detail.volume).toLocaleString("pt-BR")}<br/><br/>
                <b>Categoria Lider (Valor):</b> ${topLabel(detail.categoriaValor)}<br/>
                <b>Categoria Lider (Quantidade):</b> ${topLabel(detail.categoriaQtd)}<br/><br/>
                <b>Fornecedor Lider (Valor):</b> ${topLabel(detail.fornecedorValor)}<br/>
                <b>Fornecedor Lider (Quantidade):</b> ${topLabel(detail.fornecedorQtd)}<br/><br/>
                <b>Produto Lider (Valor):</b> ${topLabel(detail.produtoValor)}<br/>
                <b>Produto Lider (Quantidade):</b> ${topLabel(detail.produtoQtd)}<br/><br/>
                <b>Clientes Atendidos:</b> ${detail.clientes.size}<br/>
            `;
        }

        return tooltipMap;
    }, [aggregated, currencyCode, locale, mapData]);

    const handleClick = useCallback((params) => {
        const detail = aggregated[params?.name];
        if (!detail || !onCrossFilter) return;

        if (selectedRegion === detail.chartName) {
            setSelectedRegion(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        setSelectedRegion(detail.chartName);

        if (detail.filterType === "cliente") {
            onCrossFilter({
                type: "cliente",
                id: detail.filterId,
                value: detail.filterValue
            });
            return;
        }

        onCrossFilter({
            type: detail.filterType,
            value: detail.filterValue
        });
    }, [aggregated, onCrossFilter, selectedRegion]);

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
                    formatter: (value) => formatMetricFull(value, currencyCode, locale),
                    calculable: false
                },
                series: [
                    {
                        id: "region-distribution",
                        type: "map",
                        map: geographyConfig.mapName,
                        roam: false,
                        zoom: geographyConfig.mapOptions.zoom,
                        center: geographyConfig.mapOptions.center,
                        aspectScale: geographyConfig.mapOptions.aspectScale,
                        selectedMode: false,
                        label: { show: false },
                        itemStyle: {
                            areaColor: themeTokens.mapArea,
                            borderColor: themeTokens.mapBorder,
                            borderWidth: 0.8
                        },
                        emphasis: {
                            label: { show: false, color: themeTokens.mapEmphasisLabel },
                            itemStyle: { areaColor: themeTokens.mapEmphasisArea }
                        },
                        data: mapData
                    }
                ]
            };
        }

        const labels = sortedData.map((item) => item.name);
        const values = sortedData.map((item) => item.value);
        const barColors = [...visualMapColors].reverse();
        const zoomEnd = labels.length <= 8 ? 100 : (8 / labels.length) * 100;

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
                    formatter: (value) => formatCompactCurrencyValue(value, { currencyCode, locale })
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
                    handleColor: themeTokens.chartPrimary,
                    handleSize: "100%",
                    start: 0,
                    end: zoomEnd
                },
                {
                    type: "inside",
                    yAxisIndex: 0,
                    zoomOnMouseWheel: false,
                    moveOnMouseWheel: true,
                    moveOnMouseMove: true,
                    start: 0,
                    end: zoomEnd
                }
            ],
            series: [
                {
                    id: "region-distribution",
                    type: "bar",
                    data: values.map((value, index) => ({
                        value,
                        itemStyle: {
                            color: barColors[Math.min(index, barColors.length - 1)]
                        }
                    })),
                    barWidth: 22,
                    label: {
                        show: true,
                        position: "right",
                        color: themeTokens.chartLabelStrong,
                        fontSize: 10,
                        formatter: ({ value }) => formatMetricFull(value, currencyCode, locale)
                    },
                    itemStyle: {
                        borderRadius: [0, 6, 6, 0]
                    }
                }
            ]
        };
    }, [
        aggregated,
        currencyCode,
        geographyConfig,
        locale,
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
