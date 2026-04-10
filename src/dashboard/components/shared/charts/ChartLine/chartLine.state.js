import { useState, useMemo, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

const LINE_COLOR = "#17877e";
const LINE_FILL = "rgba(23, 135, 126, 0.24)";
const SLIDER_FILL = "rgba(25, 181, 159, 0.18)";

const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return Number(value.toString().replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")) || 0;
};

const formatShort = (value) => `R$ ${Number(value).toFixed(2).replace(".", ",")}`;

export const useChartLineState = ({ backendData, onCrossFilter }) => {
    const [open, setOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [chartKey, setChartKey] = useState(0);

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

    const months = useMemo(() => Object.keys(aggregated.grouped).sort(), [aggregated]);

    const averages = useMemo(
        () => months.map((month) => {
            const item = aggregated.grouped[month];
            return !item || !item.qty ? 0 : item.total / item.qty;
        }),
        [aggregated, months]
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
        const startSlider = totalItems <= 12 ? 0 : ((totalItems - 12) / totalItems) * 100;
        const startInside = totalItems <= 9 ? 0 : ((totalItems - 9) / totalItems) * 100;

        return {
            tooltip: buildResponsiveTooltip((params) => {
                const point = params[0];
                const month = point.axisValue;
                const value = point.data;
                const item = aggregated.byMonth[month];
                if (!item) return "";

                return `
                    <b>${month}</b><br/>
                    Valor Médio: <b>${formatShort(value)}</b><br/><br/>
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
                    color: "#4b5864",
                    fontSize: 10,
                    rotate: 40
                }
            },
            yAxis: {
                type: "value",
                axisLabel: {
                    color: "#4b5864",
                    fontSize: 10,
                    formatter: (value) => formatShort(value)
                },
                splitLine: {
                    lineStyle: { color: "rgba(0,0,0,0.08)", type: "dashed" }
                }
            },
            dataZoom: [
                {
                    type: "slider",
                    xAxisIndex: 0,
                    height: 10,
                    bottom: 10,
                    borderColor: "transparent",
                    fillerColor: SLIDER_FILL,
                    handleIcon: "path://M512 64L576 128 512 192 448 128z",
                    handleSize: "80%",
                    handleColor: LINE_COLOR,
                    start: startSlider,
                    end: 100
                },
                {
                    type: "inside",
                    xAxisIndex: 0,
                    zoomOnMouseWheel: false,
                    moveOnMouseWheel: true,
                    moveOnMouseMove: true,
                    start: startInside,
                    end: 100
                }
            ],
            series: [
                {
                    type: "line",
                    data: averages,
                    smooth: true,
                    lineStyle: { width: 3, color: LINE_COLOR },
                    itemStyle: { color: LINE_COLOR },
                    symbolSize: 6,
                    animationDuration: 600,
                    areaStyle: { opacity: 1, color: LINE_FILL },
                    label: {
                        show: true,
                        position: "top",
                        fontSize: 10,
                        color: LINE_COLOR,
                        formatter: (point) => formatShort(point.value)
                    }
                }
            ]
        };
    }, [aggregated, averages, months]);

    return {
        open,
        setOpen,
        option,
        handleClickPoint,
        aggregated,
        months,
        averages,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
