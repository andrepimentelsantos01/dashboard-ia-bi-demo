import { useCallback, useMemo, useState } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";
import { formatCompactCurrencyValue, formatCurrencyValue } from "../../../../utils/intlFormat";

const naturalAsc = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base"
});

const toNumber = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    return Number(value || 0) || 0;
};

const pick = (row, field) => {
    if (typeof field === "function") return field(row);
    return row?.[field];
};

const quantile = (sortedValues, percentile) => {
    if (!sortedValues.length) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const position = (sortedValues.length - 1) * percentile;
    const base = Math.floor(position);
    const rest = position - base;
    const next = sortedValues[base + 1];

    return next === undefined
        ? sortedValues[base]
        : sortedValues[base] + rest * (next - sortedValues[base]);
};

const formatNumber = (value, locale = "pt-BR") =>
    Number(value || 0).toLocaleString(locale, {
        maximumFractionDigits: 1
    });

const formatValue = (value, valueFormat, currencyCode, locale) => {
    if (valueFormat === "days") return `${formatNumber(value, locale)} dias`;
    if (valueFormat === "number") return formatNumber(value, locale);
    if (valueFormat === "percent") return `${formatNumber(value, locale)}%`;
    return formatCurrencyValue(value, { currencyCode, locale });
};

const formatAxisValue = (value, valueFormat, currencyCode, locale) => {
    if (valueFormat === "currency") {
        return formatCompactCurrencyValue(value, { currencyCode, locale });
    }

    if (valueFormat === "days") return `${formatNumber(value, locale)}d`;
    if (valueFormat === "percent") return `${formatNumber(value, locale)}%`;
    return formatNumber(value, locale);
};

const buildBoxplotData = ({
    rows = [],
    categoryField,
    valueField,
    idField,
    filterType,
    maxCategories
}) => {
    const groups = new Map();

    rows.forEach((row) => {
        const category = pick(row, categoryField);
        const value = toNumber(pick(row, valueField));
        if (!category || !Number.isFinite(value)) return;

        const key = String(category);
        const current = groups.get(key) || {
            name: key,
            values: [],
            total: 0,
            filterType,
            id: idField ? pick(row, idField) : null
        };

        current.values.push(value);
        current.total += value;
        groups.set(key, current);
    });

    const rankedGroups = [...groups.values()]
        .filter((group) => group.values.length >= 3)
        .sort((a, b) => {
            if (b.total !== a.total) return b.total - a.total;
            return naturalAsc.compare(a.name, b.name);
        })
        .slice(0, maxCategories);

    const categories = [];
    const boxes = [];
    const outliers = [];
    const statsByCategory = {};

    rankedGroups.forEach((group, index) => {
        const sorted = [...group.values].sort((a, b) => a - b);
        const q1 = quantile(sorted, 0.25);
        const median = quantile(sorted, 0.5);
        const q3 = quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const lowerFence = q1 - iqr * 1.5;
        const upperFence = q3 + iqr * 1.5;
        const inliers = sorted.filter((value) => value >= lowerFence && value <= upperFence);
        const min = inliers[0] ?? sorted[0];
        const max = inliers[inliers.length - 1] ?? sorted[sorted.length - 1];
        const categoryOutliers = sorted.filter((value) => value < min || value > max);

        categories.push(group.name);
        boxes.push([min, q1, median, q3, max]);
        categoryOutliers.forEach((value) => outliers.push([index, value]));
        statsByCategory[group.name] = {
            ...group,
            min,
            q1,
            median,
            q3,
            max,
            outliers: categoryOutliers
        };
    });

    return {
        categories,
        boxes,
        outliers,
        statsByCategory
    };
};

export const useChartBoxplotState = ({
    backendData,
    categoryField,
    valueField,
    idField,
    filterType,
    maxCategories,
    valueFormat,
    currencyCode,
    locale,
    onCrossFilter
}) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [chartKey, setChartKey] = useState(0);
    const themeTokens = useChartThemeTokens();

    const distribution = useMemo(
        () => buildBoxplotData({
            rows: backendData || [],
            categoryField,
            valueField,
            idField,
            filterType,
            maxCategories
        }),
        [backendData, categoryField, filterType, idField, maxCategories, valueField]
    );

    const handleRefresh = useCallback(() => {
        setSelected(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleClick = useCallback((params) => {
        if (!onCrossFilter) return;

        const category = params?.name || distribution.categories[params?.data?.[0]];
        if (!category) return;

        if (selected === category) {
            setSelected(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        const stats = distribution.statsByCategory[category];
        setSelected(category);
        onCrossFilter({
            type: stats?.filterType || filterType,
            id: stats?.id,
            value: category
        });
    }, [distribution.categories, distribution.statsByCategory, filterType, onCrossFilter, selected]);

    const option = useMemo(() => ({
        animation: true,
        animationDuration: 600,
        tooltip: buildResponsiveTooltip((params) => {
            const category = params?.name || distribution.categories[params?.data?.[0]];
            const stats = distribution.statsByCategory[category];
            if (!stats) return "";

            return `
                <b>${category}</b><br/>
                Registros: <b>${stats.values.length.toLocaleString("pt-BR")}</b><br/><br/>
                Min: <b>${formatValue(stats.min, valueFormat, currencyCode, locale)}</b><br/>
                Q1 25%: <b>${formatValue(stats.q1, valueFormat, currencyCode, locale)}</b><br/>
                Mediana: <b>${formatValue(stats.median, valueFormat, currencyCode, locale)}</b><br/>
                Q3 75%: <b>${formatValue(stats.q3, valueFormat, currencyCode, locale)}</b><br/>
                Max: <b>${formatValue(stats.max, valueFormat, currencyCode, locale)}</b><br/>
                Outliers: <b>${stats.outliers.length.toLocaleString("pt-BR")}</b>
            `;
        }, {
            trigger: "item",
            axisPointer: { type: "shadow" }
        }),
        grid: {
            left: "8%",
            right: "8%",
            top: 28,
            bottom: 76
        },
        xAxis: {
            type: "category",
            data: distribution.categories,
            boundaryGap: true,
            nameGap: 30,
            splitArea: { show: false },
            axisLine: { lineStyle: { color: themeTokens.axisLine } },
            axisLabel: {
                color: themeTokens.textSecondary,
                fontSize: 10,
                interval: 0,
                rotate: distribution.categories.length > 5 ? 28 : 0,
                width: 92,
                overflow: "truncate"
            },
            splitLine: { show: false }
        },
        yAxis: {
            type: "value",
            scale: true,
            splitArea: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: {
                lineStyle: { color: themeTokens.splitLine, type: "dashed" }
            },
            axisLabel: {
                color: themeTokens.textSecondary,
                fontSize: 10,
                formatter: (value) => formatAxisValue(value, valueFormat, currencyCode, locale)
            }
        },
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                zoomOnMouseWheel: false,
                moveOnMouseWheel: true,
                moveOnMouseMove: true
            }
        ],
        series: [
            {
                name: "Distribuicao",
                type: "boxplot",
                data: distribution.boxes,
                itemStyle: {
                    color: themeTokens.chartAreaFill,
                    borderColor: themeTokens.chartPrimary,
                    borderWidth: 1.5
                },
                emphasis: {
                    itemStyle: {
                        color: `${themeTokens.chartGradientEnd}33`,
                        borderColor: themeTokens.chartGradientStart,
                        borderWidth: 2
                    }
                }
            },
            {
                name: "Outliers",
                type: "scatter",
                data: distribution.outliers,
                symbolSize: 7,
                itemStyle: {
                    color: themeTokens.chartPrimarySoft,
                    opacity: 0.9
                }
            }
        ]
    }), [currencyCode, distribution, locale, themeTokens, valueFormat]);

    return {
        open,
        setOpen,
        option,
        handleClick,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
