import { useMemo, useState, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";
import { useChartThemeTokens } from "../chartTheme";
import { normalizeStatusLabel, STATUS_COLOR_MAP } from "../../../../selectors/shared/dashboardStatus";

const STACKED_STATUS_COLOR_MAP = {
    Entregue: "#2E8B57",
    "Em Trânsito": "#2F80ED",
    Faturado: "#8E44AD",
    "Em Recebimento": "#F2994A",
    Pendente: "#F2C94C",
    Atrasado: "#EB5757",
    Cancelado: "#6C757D",
    Desconhecido: "#7F8C8D"
};

const STATUS_PRIORITY = [
    "Entregue",
    "Em Trânsito",
    "Faturado",
    "Em Recebimento",
    "Pendente",
    "Atrasado",
    "Cancelado",
    "Desconhecido"
];

const sortStatuses = (statuses) => {
    const priorityMap = new Map(STATUS_PRIORITY.map((status, index) => [status, index]));

    return [...statuses].sort((a, b) => {
        const aPriority = priorityMap.has(a) ? priorityMap.get(a) : 999;
        const bPriority = priorityMap.has(b) ? priorityMap.get(b) : 999;

        if (aPriority !== bPriority) return aPriority - bPriority;
        return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
    });
};

const buildStackedData = (rows = [], metric = "quantity") => {
    const monthsMap = new Map();
    const matrix = {};
    const totalsByMonth = {};

    rows.forEach((row) => {
        const month = row.year_months;
        const status = normalizeStatusLabel(row.logistics_status || row.item_status || row.status, {
            fallback: "Desconhecido"
        });

        if (!month || !status) return;

        if (!monthsMap.has(month)) monthsMap.set(month, month);
        if (!matrix[status]) matrix[status] = {};

        const value = metric === "amount"
            ? Number(row.valorTotal ?? row.total_amount ?? row.sum_total_amount ?? 0)
            : Number(row.quantidade ?? row.sum_quantity ?? row.quantity_requested ?? 0);

        matrix[status][month] = (matrix[status][month] || 0) + value;
        totalsByMonth[month] = (totalsByMonth[month] || 0) + value;
    });

    const months = [...monthsMap.keys()].sort((a, b) => String(a).localeCompare(String(b))).reverse();
    const statuses = sortStatuses(Object.keys(matrix));

    return {
        months,
        statuses,
        totalsByMonth,
        series: statuses.map((status) => ({
            name: status,
            type: "bar",
            stack: "total",
            emphasis: { focus: "series" },
            itemStyle: {
                color: STACKED_STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[status] || STACKED_STATUS_COLOR_MAP.Desconhecido,
                borderRadius: [4, 4, 0, 0]
            },
            data: months.map((month) => matrix[status]?.[month] || 0)
        }))
    };
};

const formatMetric = (value, metric) => {
    if (metric === "amount") {
        return Number(value || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    return Math.round(Number(value || 0)).toLocaleString("pt-BR");
};

export const useChartStackedBarState = ({
    backendData,
    onCrossFilter,
    metric = "quantity"
}) => {
    const [open, setOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [chartKey, setChartKey] = useState(0);
    const themeTokens = useChartThemeTokens();

    const stackedData = useMemo(
        () => buildStackedData(backendData || [], metric),
        [backendData, metric]
    );

    const handleRefresh = useCallback(() => {
        setSelectedKey(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleClickSegment = useCallback((params) => {
        if (!params?.name || !params?.seriesName || !onCrossFilter) return;

        const nextKey = `${params.name}::${params.seriesName}`;

        if (selectedKey === nextKey) {
            setSelectedKey(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        setSelectedKey(nextKey);
        onCrossFilter({
            type: "merge",
            filters: {
                mes: params.name,
                status: [params.seriesName]
            }
        });
    }, [onCrossFilter, selectedKey]);

    const option = useMemo(() => {
        const totalItems = stackedData.months.length;
        const visibleBars = 10;
        const zoomEnd = totalItems > visibleBars ? (visibleBars / totalItems) * 100 : 100;

        return {
            tooltip: buildResponsiveTooltip((params) => {
                if (!params?.length) return "";

                const month = params[0].axisValue;
                const total = stackedData.totalsByMonth[month] || 0;
                const lines = params
                    .filter((item) => Number(item.data) > 0)
                    .map((item) => `${item.marker} ${item.seriesName}: <b>${formatMetric(item.data, metric)}</b>`)
                    .join("<br/>");

                return `
                    <b>${month}</b><br/><br/>
                    ${lines}<br/><br/>
                    <b>Total do período:</b> ${formatMetric(total, metric)}
                `;
            }, {
                trigger: "axis",
                axisPointer: { type: "shadow" }
            }),
            legend: {
                type: "scroll",
                top: 0,
                icon: "roundRect",
                itemWidth: 12,
                itemHeight: 12,
                textStyle: {
                    color: themeTokens.textSecondary,
                    fontSize: 11
                }
            },
            grid: {
                left: "6%",
                right: "6%",
                top: 42,
                bottom: 68
            },
            xAxis: {
                type: "category",
                data: stackedData.months,
                axisTick: { show: false },
                axisLine: { lineStyle: { color: themeTokens.axisLine } },
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    rotate: totalItems > 8 ? 35 : 0
                }
            },
            yAxis: {
                type: "value",
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: {
                    lineStyle: { color: themeTokens.splitLine, type: "dashed" }
                },
                axisLabel: {
                    color: themeTokens.textSecondary,
                    fontSize: 10,
                    formatter: (value) => formatMetric(value, metric)
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
                    handleColor: "#17877e",
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
            series: stackedData.series
        };
    }, [metric, stackedData, themeTokens]);

    return {
        open,
        setOpen,
        option,
        handleClickSegment,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
