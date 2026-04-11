import { useMemo, useState, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";
import { formatCompactCurrencyValue, formatCurrencyValue } from "../../../../utils/intlFormat";

const MAX_VISIBLE_POINTS = 260;
const MAX_VISIBLE_CATEGORIES = 6;

const formatNumber = (value) => Math.round(Number(value || 0)).toLocaleString("pt-BR");

const toNumber = (value) => (typeof value === "number" ? value : Number(value || 0));

const normalizeRows = (rows = []) =>
    rows
        .map((row, index) => {
            const total = toNumber(row.valorTotal ?? row.total_amount ?? row.sum_total_amount);
            const quantity = toNumber(row.quantidade ?? row.sum_quantity ?? row.quantity_requested);
            const unitPrice =
                toNumber(row.valorUnitario ?? row.unit_price ?? row.avg_unit_price) ||
                (quantity ? total / quantity : 0);
            const category = row.categoria || row.product_class_material_name || "Sem categoria";
            const month = row.year_months || null;

            return {
                id: row.row_id ?? `${category}-${month || "na"}-${index}`,
                category,
                month,
                total,
                quantity,
                unitPrice,
                product: row.produto || row.product_name || "Produto nao informado",
                client: row.cliente || row.client_name || "Cliente nao informado",
                supplier: row.fornecedor || row.supplier_name || "Fornecedor nao informado"
            };
        })
        .filter((row) => row.category && row.total > 0 && row.quantity > 0 && row.unitPrice > 0);

const pickScatterSample = (rows) => {
    if (rows.length <= MAX_VISIBLE_POINTS) return rows;

    const sorted = [...rows].sort((a, b) => b.total - a.total);
    const guaranteed = sorted.slice(0, Math.floor(MAX_VISIBLE_POINTS * 0.35));
    const rest = sorted.slice(guaranteed.length);
    const step = Math.max(Math.floor(rest.length / Math.max(MAX_VISIBLE_POINTS - guaranteed.length, 1)), 1);
    const sampled = [];

    for (let index = 0; index < rest.length && sampled.length + guaranteed.length < MAX_VISIBLE_POINTS; index += step) {
        sampled.push(rest[index]);
    }

    return [...guaranteed, ...sampled];
};

const buildScatterAggregateData = (rows = [], themeTokens) => {
    const normalized = normalizeRows(rows);
    const byCategory = new Map();
    const scatterPalette = themeTokens.scatterPalette;

    normalized.forEach((row) => {
        const current = byCategory.get(row.category) || {
            category: row.category,
            total: 0,
            quantity: 0,
            count: 0
        };

        current.total += row.total;
        current.quantity += row.quantity;
        current.count += 1;
        byCategory.set(row.category, current);
    });

    const rankedCategories = [...byCategory.values()].sort((a, b) => b.total - a.total);
    const visibleCategories = rankedCategories.slice(0, MAX_VISIBLE_CATEGORIES);
    const visibleCategorySet = new Set(visibleCategories.map((item) => item.category));

    const sampledRows = pickScatterSample(normalized).map((row) => ({
        ...row,
        displayCategory: visibleCategorySet.has(row.category) ? row.category : "Outros"
    }));

    const aggregateBar = visibleCategories.map((item) => ({
        name: item.category,
        value: item.total,
        quantity: item.quantity,
        count: item.count
    }));

    const categoriesForLegend = [...visibleCategories.map((item) => item.category)];
    if (sampledRows.some((row) => row.displayCategory === "Outros")) {
        categoriesForLegend.push("Outros");
    }

    const scatterSeries = categoriesForLegend.map((category, index) => {
        const points = sampledRows.filter((row) => row.displayCategory === category);

        return {
            id: `category-distribution-${category}`,
            name: category,
            type: "scatter",
            large: points.length > 80,
            largeThreshold: 120,
            progressive: 300,
            progressiveThreshold: 500,
            universalTransition: true,
            symbolSize: (value) => {
                const total = value?.[2] || 0;
                return Math.max(8, Math.min(22, Math.sqrt(total) / 6));
            },
            itemStyle: {
                color: category === "Outros"
                    ? themeTokens.scatterOtherColor
                    : scatterPalette[index % scatterPalette.length],
                opacity: 0.82
            },
            emphasis: {
                scale: 1.08,
                itemStyle: {
                    opacity: 1,
                    borderColor: "#ffffff",
                    borderWidth: 1.25
                }
            },
            data: points.map((row) => ({
                id: row.id,
                name: row.category,
                groupId: row.category,
                value: [row.unitPrice, row.quantity, row.total],
                category: row.category,
                month: row.month,
                product: row.product,
                client: row.client,
                supplier: row.supplier,
                rowId: row.id
            }))
        };
    });

    return {
        scatterSeries,
        aggregateBar,
        maxQuantity: sampledRows.reduce((max, row) => Math.max(max, row.quantity), 0),
        maxUnitPrice: sampledRows.reduce((max, row) => Math.max(max, row.unitPrice), 0)
    };
};

export const useChartScatterAggregateState = ({
    backendData,
    onCrossFilter,
    currencyCode = "BRL",
    locale = "pt-BR"
}) => {
    const [open, setOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [viewMode, setViewMode] = useState("scatter");
    const themeTokens = useChartThemeTokens();

    const scatterData = useMemo(
        () => buildScatterAggregateData(backendData || [], themeTokens),
        [backendData, themeTokens]
    );

    const handleRefresh = useCallback(() => {
        setSelectedKey(null);
        setViewMode("scatter");
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleToggleView = useCallback(() => {
        setViewMode((current) => (current === "scatter" ? "bar" : "scatter"));
    }, []);

    const handleClick = useCallback(
        (params) => {
            if (!onCrossFilter) return;

            if (params?.seriesType === "bar") {
                const category = params.name;
                const nextKey = `bar::${category}`;

                if (selectedKey === nextKey) {
                    setSelectedKey(null);
                    onCrossFilter({ type: "reset" });
                    return;
                }

                setSelectedKey(nextKey);
                onCrossFilter({
                    type: "merge",
                    filters: {
                        categorias: [{ name: category }]
                    }
                });
                return;
            }

            if (params?.seriesType === "scatter") {
                const data = params.data || {};
                const category = data.category;
                const month = data.month;
                const nextKey = `point::${data.rowId || `${category}-${month}`}`;

                if (selectedKey === nextKey) {
                    setSelectedKey(null);
                    onCrossFilter({ type: "reset" });
                    return;
                }

                setSelectedKey(nextKey);
                onCrossFilter({
                    type: "merge",
                    filters: {
                        categorias: category ? [{ name: category }] : [],
                        ...(month ? { mes: month } : {})
                    }
                });
            }
        },
        [onCrossFilter, selectedKey]
    );

    const option = useMemo(() => {
        const barCategories = scatterData.aggregateBar.map((item) => item.name);
        const barValues = scatterData.aggregateBar.map((item) => item.value);

        const tooltip = buildResponsiveTooltip((params) => {
            if (params?.seriesType === "bar") {
                const item = scatterData.aggregateBar[params.dataIndex];
                if (!item) return "";

                return `
                    <b>${item.name}</b><br/>
                    Valor movimentado: <b>${formatCurrencyValue(item.value, { currencyCode, locale })}</b><br/>
                    Volume movimentado: <b>${formatNumber(item.quantity)}</b><br/>
                    Registros: <b>${formatNumber(item.count)}</b>
                `;
            }

            const data = params?.data;
            if (!data) return "";

            return `
                <b>${data.category}</b><br/>
                Mes: <b>${data.month || "-"}</b><br/>
                Valor unitario: <b>${formatCurrencyValue(data.value?.[0], { currencyCode, locale })}</b><br/>
                Quantidade: <b>${formatNumber(data.value?.[1])}</b><br/>
                Valor total: <b>${formatCurrencyValue(data.value?.[2], { currencyCode, locale })}</b><br/><br/>
                Produto: <b>${data.product}</b><br/>
                Cliente: <b>${data.client}</b>
            `;
        });

        if (viewMode === "bar") {
            return {
                animation: true,
                animationDuration: 500,
                animationDurationUpdate: 700,
                animationEasing: "cubicOut",
                animationEasingUpdate: "cubicInOut",
                tooltip,
                grid: {
                    left: "16%",
                    right: "8%",
                    top: 50,
                    bottom: 42
                },
                xAxis: {
                    type: "value",
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: {
                        lineStyle: { color: themeTokens.splitLine, type: "dashed" }
                    },
                    axisLabel: {
                        color: themeTokens.textSecondary,
                        fontSize: 10,
                        formatter: (value) => {
                            const parsed = Number(value || 0);
                            return formatCompactCurrencyValue(parsed, { currencyCode, locale });
                        }
                    }
                },
                yAxis: {
                    type: "category",
                    data: barCategories,
                    inverse: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: {
                        color: themeTokens.textSecondary,
                        fontSize: 10,
                        width: 112,
                        overflow: "truncate"
                    }
                },
                series: [
                    {
                        id: "category-distribution",
                        name: "Valor por categoria",
                        type: "bar",
                        universalTransition: true,
                        data: barValues.map((value, index) => ({
                            id: barCategories[index],
                            name: barCategories[index],
                            groupId: barCategories[index],
                            value,
                            itemStyle: {
                                color: themeTokens.scatterPalette[index % themeTokens.scatterPalette.length],
                                borderRadius: [0, 6, 6, 0]
                            }
                        })),
                        barWidth: 18,
                        label: {
                            show: true,
                            position: "right",
                            color: themeTokens.chartLabelStrong,
                            fontSize: 10,
                            formatter: ({ value }) => formatCurrencyValue(value, { currencyCode, locale })
                        }
                    }
                ]
            };
        }

        return {
            animation: true,
            animationDuration: 500,
            animationDurationUpdate: 700,
            animationEasing: "cubicOut",
            animationEasingUpdate: "cubicInOut",
            legend: {
                type: "scroll",
                top: 0,
                left: 8,
                right: 138,
                itemWidth: 12,
                itemHeight: 12,
                textStyle: {
                    color: themeTokens.textSecondary,
                    fontSize: 11
                }
            },
            tooltip,
            grid: {
                left: "7%",
                right: "8%",
                top: 40,
                bottom: 42
            },
            xAxis: {
                type: "value",
                min: 0,
                max: Math.ceil(scatterData.maxUnitPrice * 1.1 || 100),
                axisLine: { lineStyle: { color: themeTokens.axisLine } },
                splitLine: {
                    lineStyle: { color: themeTokens.splitLine, type: "dashed" }
                },
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    formatter: (value) => formatCompactCurrencyValue(value, { currencyCode, locale })
                },
                name: "Valor Unitario",
                nameLocation: "middle",
                nameGap: 28,
                nameTextStyle: {
                    color: themeTokens.textSecondary,
                    fontSize: 11,
                    fontWeight: 600
                }
            },
            yAxis: {
                type: "value",
                min: 0,
                max: Math.ceil(scatterData.maxQuantity * 1.1 || 100),
                axisLine: { lineStyle: { color: themeTokens.axisLine } },
                splitLine: {
                    lineStyle: { color: themeTokens.splitLine, type: "dashed" }
                },
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    formatter: (value) => formatNumber(value)
                },
                name: "Quantidade",
                nameLocation: "middle",
                nameGap: 42,
                nameRotate: 90,
                nameTextStyle: {
                    color: themeTokens.textSecondary,
                    fontSize: 11,
                    fontWeight: 600
                }
            },
            series: scatterData.scatterSeries
        };
    }, [currencyCode, locale, scatterData, themeTokens, viewMode]);

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
