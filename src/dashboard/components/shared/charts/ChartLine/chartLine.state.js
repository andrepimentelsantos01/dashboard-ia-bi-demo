import { useState, useMemo, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";
import { formatCompactCurrencyValue, formatCurrencyValue } from "../../../../utils/intlFormat";

const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return Number(value.toString().replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
};

const formatShort = (value, currencyCode, locale) =>
    formatCurrencyValue(value, {
        currencyCode,
        locale
    });

const formatLineValue = (value, metric, currencyCode, locale) => {
    if (metric === "quantity") {
        return Math.round(Number(value || 0)).toLocaleString(locale);
    }

    return formatShort(value, currencyCode, locale);
};

const formatLineAxisValue = (value, metric, currencyCode, locale) => {
    if (metric === "quantity") {
        return Math.round(Number(value || 0)).toLocaleString(locale);
    }

    return formatCompactCurrencyValue(value, { currencyCode, locale });
};

const getMetricLabel = (metric) => {
    if (metric === "amount") return "Receita";
    if (metric === "quantity") return "Volume";

    return "Valor Medio";
};

export const useChartLineState = ({
    backendData,
    onCrossFilter,
    metric = "averageUnitPrice",
    currencyCode = "BRL",
    locale = "pt-BR"
}) => {
    const [open, setOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [chartKey, setChartKey] = useState(0);
    const themeTokens = useChartThemeTokens();
    const lineColor = themeTokens.chartGradientStart;
    const lineFill = themeTokens.chartAreaFill;

    const handleRefresh = useCallback(() => {
        setSelectedMonth(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const aggregated = useMemo(() => {
        const grouped = {};
        const byMonth = {};

        for (const row of backendData || []) {
            const month = row.year_months;
            if (!month) continue;

            const value = toNumber(row.valorTotal);
            const quantity = row.quantidade || 0;

            if (!grouped[month]) grouped[month] = { total: 0, qty: 0 };
            grouped[month].total += value;
            grouped[month].qty += quantity;

            if (!byMonth[month]) {
                byMonth[month] = {
                    volume: 0,
                    categoriaValorMap: {},
                    categoriaQtdMap: {},
                    fornecedorValorMap: {},
                    fornecedorQtdMap: {},
                    produtoValorMap: {},
                    produtoQtdMap: {},
                    categoriaLeaderValor: "-",
                    categoriaLeaderQtd: "-",
                    fornecedorLeaderValor: "-",
                    fornecedorLeaderQtd: "-",
                    produtoLeaderValor: "-",
                    produtoLeaderQtd: "-",
                    clientes: new Set()
                };
            }

            const bucket = byMonth[month];
            bucket.volume += quantity;

            const updateLeader = (valueMap, quantityMap, valueKey, quantityKey, label, currentValue, currentQuantity) => {
                const nextValue = (valueMap[label] || 0) + currentValue;
                const nextQuantity = (quantityMap[label] || 0) + currentQuantity;
                valueMap[label] = nextValue;
                quantityMap[label] = nextQuantity;
                if (nextValue > (valueMap[bucket[valueKey]] || -1)) bucket[valueKey] = label;
                if (nextQuantity > (quantityMap[bucket[quantityKey]] || -1)) bucket[quantityKey] = label;
            };

            if (row.categoria) {
                updateLeader(
                    bucket.categoriaValorMap,
                    bucket.categoriaQtdMap,
                    "categoriaLeaderValor",
                    "categoriaLeaderQtd",
                    row.categoria,
                    value,
                    quantity
                );
            }

            if (row.fornecedor) {
                updateLeader(
                    bucket.fornecedorValorMap,
                    bucket.fornecedorQtdMap,
                    "fornecedorLeaderValor",
                    "fornecedorLeaderQtd",
                    row.fornecedor,
                    value,
                    quantity
                );
            }

            if (row.produto) {
                updateLeader(
                    bucket.produtoValorMap,
                    bucket.produtoQtdMap,
                    "produtoLeaderValor",
                    "produtoLeaderQtd",
                    row.produto,
                    value,
                    quantity
                );
            }

            if (row.cliente) bucket.clientes.add(row.cliente);
        }

        return { grouped, byMonth };
    }, [backendData]);

    const months = useMemo(() => Object.keys(aggregated.grouped).sort().reverse(), [aggregated]);

    const values = useMemo(
        () => months.map((month) => {
            const item = aggregated.grouped[month];
            if (!item) return 0;
            if (metric === "quantity") return item.qty;
            return metric === "amount" ? item.total : item.qty ? item.total / item.qty : 0;
        }),
        [aggregated, metric, months]
    );

    const handleClickPoint = useCallback((point) => {
        const name = point?.name;
        if (!name || !onCrossFilter) return;

        if (selectedMonth === name) {
            setSelectedMonth(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        setSelectedMonth(name);
        onCrossFilter({ type: "mes", value: name });
    }, [onCrossFilter, selectedMonth]);

    const option = useMemo(() => {
        const totalItems = months.length;
        const visibleItems = 12;
        const zoomEnd = totalItems > visibleItems ? (visibleItems / totalItems) * 100 : 100;

        return {
            tooltip: buildResponsiveTooltip((params) => {
                const point = params[0];
                const month = point.axisValue;
                const value = point.data;
                const item = aggregated.byMonth[month];
                if (!item) return "";
                const metricLabel = getMetricLabel(metric);

                return `
                    <b>${month}</b><br/>
                    ${metricLabel}: <b>${formatLineValue(value, metric, currencyCode, locale)}</b><br/><br/>
                    <b>Volume Movimentado:</b> ${item.volume}<br/><br/>
                    <b>Categoria Líder (Valor):</b> ${item.categoriaLeaderValor}<br/>
                    <b>Categoria Líder (Quantidade):</b> ${item.categoriaLeaderQtd}<br/><br/>
                    <b>Fornecedor Líder (Valor):</b> ${item.fornecedorLeaderValor}<br/>
                    <b>Fornecedor Líder (Quantidade):</b> ${item.fornecedorLeaderQtd}<br/><br/>
                    <b>Produto Líder (Valor):</b> ${item.produtoLeaderValor}<br/>
                    <b>Produto Líder (Quantidade):</b> ${item.produtoLeaderQtd}<br/><br/>
                    <b>Clientes Atendidos:</b> ${item.clientes.size}<br/>
                `;
            }, {
                trigger: "axis"
            }),
            grid: {
                left: "6%",
                right: "6%",
                top: "10%",
                bottom: "25%"
            },
            xAxis: {
                type: "category",
                data: months,
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    rotate: 40
                }
            },
            yAxis: {
                type: "value",
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    formatter: (value) => formatLineAxisValue(value, metric, currencyCode, locale)
                },
                splitLine: {
                    lineStyle: { color: themeTokens.splitLine, type: "dashed" }
                }
            },
            dataZoom: [
                {
                    type: "slider",
                    xAxisIndex: 0,
                    height: 10,
                    bottom: 10,
                    borderColor: "transparent",
                    fillerColor: themeTokens.sliderFill,
                    handleIcon: "path://M512 64L576 128 512 192 448 128z",
                    handleSize: "80%",
                    handleColor: lineColor,
                    start: 0,
                    end: zoomEnd
                },
                {
                    type: "inside",
                    xAxisIndex: 0,
                    zoomOnMouseWheel: false,
                    moveOnMouseWheel: true,
                    moveOnMouseMove: true,
                    start: 0,
                    end: zoomEnd
                }
            ],
            series: [
                {
                    type: "line",
                    data: values,
                    smooth: true,
                    lineStyle: { width: 3, color: lineColor },
                    itemStyle: {
                        color: themeTokens.chartGradientEnd,
                        borderColor: lineColor,
                        borderWidth: 2
                    },
                    symbolSize: 6,
                    animationDuration: 600,
                    areaStyle: { opacity: 1, color: lineFill },
                    label: {
                        show: true,
                        position: "top",
                        fontSize: 10,
                        color: themeTokens.chartLabelStrong,
                        formatter: (point) => formatLineValue(point.value, metric, currencyCode, locale)
                    }
                }
            ]
        };
    }, [aggregated, currencyCode, lineColor, lineFill, locale, metric, months, themeTokens, values]);

    return {
        open,
        setOpen,
        option,
        handleClickPoint,
        aggregated,
        months,
        averages: values,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
