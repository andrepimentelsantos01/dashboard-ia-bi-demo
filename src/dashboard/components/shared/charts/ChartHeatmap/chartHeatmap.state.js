import { useMemo, useState, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

const buildHeatmapData = (rows = []) => {
    const monthsSet = new Set();
    const categoriesSet = new Set();
    const matrix = {};

    rows.forEach((row) => {
        const month = row.year_months;
        const category = row.categoria || row.product_class_material_name || "Sem categoria";
        const value = Number(row.valorTotal ?? row.total_amount ?? row.sum_total_amount ?? 0);

        if (!month || !category) return;

        monthsSet.add(month);
        categoriesSet.add(category);

        const key = `${month}::${category}`;
        matrix[key] = (matrix[key] || 0) + value;
    });

    const months = [...monthsSet].sort((a, b) => String(a).localeCompare(String(b)));
    const categories = [...categoriesSet].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

    const data = [];
    let maxValue = 0;

    months.forEach((month, monthIndex) => {
        categories.forEach((category, categoryIndex) => {
            const value = matrix[`${month}::${category}`] || 0;
            if (value > maxValue) maxValue = value;
            data.push([monthIndex, categoryIndex, value]);
        });
    });

    return { months, categories, data, maxValue };
};

export const useChartHeatmapState = ({
    backendData,
    onCrossFilter
}) => {
    const [open, setOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [chartKey, setChartKey] = useState(0);
    const themeTokens = useChartThemeTokens();

    const heatmapData = useMemo(
        () => buildHeatmapData(backendData || []),
        [backendData]
    );

    const handleRefresh = useCallback(() => {
        setSelectedKey(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleClickCell = useCallback((params) => {
        const [monthIndex, categoryIndex] = params?.data || [];
        const month = heatmapData.months[monthIndex];
        const category = heatmapData.categories[categoryIndex];

        if (!month || !category || !onCrossFilter) return;

        const nextKey = `${month}::${category}`;

        if (selectedKey === nextKey) {
            setSelectedKey(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        setSelectedKey(nextKey);
        onCrossFilter({
            type: "merge",
            filters: {
                mes: month,
                categorias: [{ name: category }]
            }
        });
    }, [heatmapData.categories, heatmapData.months, onCrossFilter, selectedKey]);

    const option = useMemo(() => ({
        tooltip: buildResponsiveTooltip((params) => {
            const [monthIndex, categoryIndex, value] = params.data || [];
            const month = heatmapData.months[monthIndex];
            const category = heatmapData.categories[categoryIndex];

            if (!month || !category) return "";

            return `
                <b>${category}</b><br/>
                Mês: <b>${month}</b><br/>
                Valor movimentado: <b>${formatCurrency(value)}</b>
            `;
        }),
        grid: {
            left: 86,
            right: 24,
            top: 20,
            bottom: 54
        },
        xAxis: {
            type: "category",
            data: heatmapData.months,
            splitArea: { show: false },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: themeTokens.axisLine } },
            axisLabel: {
                color: themeTokens.textSecondary,
                fontSize: 10,
                rotate: heatmapData.months.length > 8 ? 35 : 0
            }
        },
        yAxis: {
            type: "category",
            data: heatmapData.categories,
            splitArea: { show: false },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: themeTokens.axisLine } },
            axisLabel: {
                color: themeTokens.textSecondary,
                fontSize: 10,
                width: 88,
                overflow: "truncate"
            }
        },
        visualMap: {
            min: 0,
            max: heatmapData.maxValue > 0 ? heatmapData.maxValue : 100,
            orient: "horizontal",
            left: "center",
            bottom: 0,
            calculable: false,
            text: ["Alto", "Baixo"],
            textStyle: {
                color: themeTokens.textSecondary,
                fontSize: 10
            },
            inRange: {
                color: ["#d9f4ef", "#8fd8cf", "#43bfae", "#17877e", "#0f4f4c"]
            }
        },
        series: [
            {
                name: "Valor por categoria/mês",
                type: "heatmap",
                data: heatmapData.data,
                label: {
                    show: false
                },
                emphasis: {
                    itemStyle: {
                        borderColor: themeTokens.isDark ? "#dff5f1" : "#ffffff",
                        borderWidth: 1.5,
                        shadowBlur: 10,
                        shadowColor: themeTokens.isDark ? "rgba(0,0,0,0.35)" : "rgba(12,56,53,0.18)"
                    }
                }
            }
        ]
    }), [heatmapData, themeTokens]);

    return {
        open,
        setOpen,
        option,
        handleClickCell,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
