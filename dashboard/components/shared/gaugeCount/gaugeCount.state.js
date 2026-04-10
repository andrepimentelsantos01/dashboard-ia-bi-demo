import { useEffect, useRef, useMemo } from "react";
import * as echarts from "echarts";

export const useGaugeCountState = ({ value, tooltipData = {}, invertColors = false }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const numeric = useMemo(() => {
        return typeof value === "string"
            ? Number(value.replace("%", "").trim())
            : Number(value);
    }, [value]);

    const safeValue = useMemo(() => {
        return Math.max(0, Math.min(100, numeric || 0));
    }, [numeric]);

    const color = useMemo(() => {
        if (!invertColors) {
            if (safeValue <= 30) return "#2ecc71";
            if (safeValue <= 60) return "#f1c40f";
            return "#e74c3c";
        }
        if (safeValue <= 30) return "#e74c3c";
        if (safeValue <= 60) return "#f1c40f";
        return "#2ecc71";
    }, [safeValue, invertColors]);

    const indicatorClass = useMemo(() => {
        if (color === "#2ecc71") return "Baixa";
        if (color === "#f1c40f") return "Média";
        return "Alta";
    }, [color]);

    const option = useMemo(() => {
        return {
            tooltip: { show: false },
            series: [
                {
                    type: "gauge",
                    startAngle: 180,
                    endAngle: 0,
                    center: ["50%", "65%"],
                    radius: "100%",
                    min: 0,
                    max: 100,
                    axisLine: {
                        lineStyle: {
                            width: 26,
                            roundCap: true,
                            shadowBlur: 12,
                            shadowColor: "rgba(0,0,0,0.15)",
                            shadowOffsetX: 0,
                            shadowOffsetY: 4,
                            color: !invertColors
                                ? [
                                    [0.3, "#2ecc71"],
                                    [0.6, "#f1c40f"],
                                    [1, "#e74c3c"]
                                ]
                                : [
                                    [0.3, "#e74c3c"],
                                    [0.6, "#f1c40f"],
                                    [1, "#2ecc71"]
                                ]
                        }
                    },
                    progress: { show: false },
                    pointer: {
                        show: true,
                        icon: "path://M2 0 L10 10 L-6 10 Z",
                        length: "30%",
                        width: 10,
                        offsetCenter: [0, "-18%"],
                        itemStyle: {
                            color,
                            shadowBlur: 8,
                            shadowColor: "rgba(0,0,0,0.25)"
                        }
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    anchor: {
                        show: true,
                        size: 14,
                        itemStyle: {
                            color,
                            shadowBlur: 10,
                            shadowColor: "rgba(0,0,0,0.25)"
                        }
                    },
                    detail: {
                        valueAnimation: true,
                        fontSize: 40,
                        fontWeight: 700,
                        offsetCenter: [0, "34%"],
                        color,
                        textShadowColor: "rgba(0,0,0,0.15)",
                        textShadowBlur: 6,
                        formatter: (v) => `${Math.round(v)}%`
                    },
                    data: [{ value: safeValue }]
                }
            ]
        };
    }, [safeValue, color, invertColors]);

    useEffect(() => {
        if (!chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
        }
        chartInstance.current.setOption(option);
    }, [option]);

    return { chartRef };
};
