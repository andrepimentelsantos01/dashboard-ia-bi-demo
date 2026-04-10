import { useMemo, useState, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

const formatCurrencyFull = (value) =>
    (typeof value === "number" ? value : Number(value || 0)).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

const formatPercent = (value) =>
    `${(typeof value === "number" ? value : Number(value || 0)).toFixed(1)}%`;

const naturalAsc = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base"
});

export const useChartHorizontalState = ({
                                            data,
                                            backendData,
                                            color = "#1c476e",
                                            order = "ASC",
                                            onCrossFilter,
                                            valueFormat
                                        }) => {
    const [open, setOpen] = useState(false);
    const [selectedName, setSelectedName] = useState(null);
    const [orderState, setOrder] = useState(order);

    const handleRefresh = useCallback(() => {
        setOrder(order);
        setSelectedName(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter, order]);

    const sorted = useMemo(() => {
        const asc = orderState === "ASC";

        return [...data].sort((a, b) => {
            if (a.valor !== b.valor) return asc ? a.valor - b.valor : b.valor - a.valor;
            return naturalAsc.compare(a.name, b.name);
        });
    }, [data, orderState]);

    const labels = useMemo(() => sorted.map(item => item.name), [sorted]);
    const values = useMemo(() => sorted.map(item => item.valor), [sorted]);

    const aggregated = useMemo(() => {
        const map = {};

        for (const row of backendData || []) {
            const value = row.valorTotal ?? row.sum_total_amount ?? 0;
            const quantity = row.quantidade ?? row.sum_quantity ?? 0;

            const entries = [
                { key: row.cliente || row.client_name, type: "cliente", id: row.client_id },
                { key: row.fornecedor || row.supplier_name, type: "fornecedor", id: row.supplier_id },
                { key: row.produto || row.product_name, type: "produto", id: row.product_id },
                { key: row.categoria || row.product_class_material_name, type: "categoria", id: null }
            ];

            for (const entry of entries) {
                if (!entry.key) continue;

                if (!map[entry.key]) {
                    map[entry.key] = {
                        type: entry.type,
                        id: entry.id,
                        volume: 0,
                        clientes: new Set(),
                        categoriaValor: {},
                        categoriaQuantidade: {},
                        fornecedorValor: {},
                        fornecedorQuantidade: {},
                        produtoValor: {},
                        produtoQuantidade: {}
                    };
                }

                const bucket = map[entry.key];
                bucket.volume += quantity;
                if (row.cliente) bucket.clientes.add(row.cliente);

                if (row.categoria) {
                    bucket.categoriaValor[row.categoria] = (bucket.categoriaValor[row.categoria] || 0) + value;
                    bucket.categoriaQuantidade[row.categoria] = (bucket.categoriaQuantidade[row.categoria] || 0) + quantity;
                }

                if (row.fornecedor) {
                    bucket.fornecedorValor[row.fornecedor] = (bucket.fornecedorValor[row.fornecedor] || 0) + value;
                    bucket.fornecedorQuantidade[row.fornecedor] = (bucket.fornecedorQuantidade[row.fornecedor] || 0) + quantity;
                }

                if (row.produto) {
                    bucket.produtoValor[row.produto] = (bucket.produtoValor[row.produto] || 0) + value;
                    bucket.produtoQuantidade[row.produto] = (bucket.produtoQuantidade[row.produto] || 0) + quantity;
                }
            }
        }

        const top = (record) => Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
        const enriched = {};

        Object.keys(map).forEach((key) => {
            const bucket = map[key];
            enriched[key] = {
                ...bucket,
                categoriaLeaderValor: top(bucket.categoriaValor),
                categoriaLeaderQtd: top(bucket.categoriaQuantidade),
                fornecedorLeaderValor: top(bucket.fornecedorValor),
                fornecedorLeaderQtd: top(bucket.fornecedorQuantidade),
                produtoLeaderValor: top(bucket.produtoValor),
                produtoLeaderQtd: top(bucket.produtoQuantidade),
                clientesAtendidos: bucket.clientes.size
            };
        });

        return enriched;
    }, [backendData]);

    const handleClickBar = useCallback((params) => {
        const clicked = params?.name;
        if (!clicked || !onCrossFilter) return;

        if (selectedName === clicked) {
            setSelectedName(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        const info = aggregated[clicked];
        if (!info) return;

        setSelectedName(clicked);
        onCrossFilter({
            type: info.type,
            id: info.id,
            value: clicked
        });
    }, [aggregated, onCrossFilter, selectedName]);

    const formatValue = useCallback((value) => {
        if (valueFormat === "volume") return Math.round(value);
        if (valueFormat === "percent") return formatPercent(value);
        return formatCurrencyFull(value);
    }, [valueFormat]);

    const option = useMemo(() => {
        const totalItems = labels.length;
        const zoomStart = totalItems <= 5 ? 0 : ((totalItems - 5) / totalItems) * 100;

        return {
            tooltip: buildResponsiveTooltip((params) => {
                const item = params[0];
                const key = item.axisValue;
                const info = aggregated[key];
                if (!info) return "";

                return `
                    <b>${key}</b><br/>
                    Valor: <b>${formatValue(item.data)}</b><br/><br/>
                    <b>Volume Movimentado:</b> ${info.volume}<br/><br/>
                    <b>Categoria Líder (Valor):</b> ${info.categoriaLeaderValor}<br/>
                    <b>Categoria Líder (Quantidade):</b> ${info.categoriaLeaderQtd}<br/><br/>
                    <b>Fornecedor Líder (Valor):</b> ${info.fornecedorLeaderValor}<br/>
                    <b>Fornecedor Líder (Quantidade):</b> ${info.fornecedorLeaderQtd}<br/><br/>
                    <b>Produto Líder (Valor):</b> ${info.produtoLeaderValor}<br/>
                    <b>Produto Líder (Quantidade):</b> ${info.produtoLeaderQtd}<br/><br/>
                    <b>Clientes Atendidos:</b> ${info.clientesAtendidos}<br/>
                `;
            }, {
                trigger: "axis",
                axisPointer: { type: "shadow" }
            }),
            dataZoom: [
                {
                    type: "slider",
                    yAxisIndex: 0,
                    orient: "vertical",
                    width: 14,
                    right: 7,
                    fillerColor: `${color}22`,
                    handleColor: color,
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
            grid: {
                left: 140,
                right: 100,
                top: "6%",
                bottom: "10%",
                containLabel: false
            },
            xAxis: {
                type: "value",
                splitLine: {
                    lineStyle: { color: "rgba(0,0,0,0.08)", type: "dashed" }
                },
                axisLabel: {
                    color: "#4b5864",
                    fontSize: 10,
                    interval: "auto",
                    hideOverlap: true,
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
                axisLabel: {
                    color: "#4b5864",
                    fontSize: 10,
                    margin: 10,
                    width: 120,
                    overflow: "truncate"
                }
            },
            series: [
                {
                    type: "bar",
                    data: values,
                    barWidth: 28,
                    label: {
                        show: true,
                        position: "right",
                        color: "#171515",
                        fontSize: 10,
                        formatter: ({ value }) => formatValue(value)
                    },
                    itemStyle: {
                        borderRadius: [6, 6, 6, 6],
                        color: {
                            type: "linear",
                            x: 1,
                            y: 0,
                            x2: 0,
                            y2: 0,
                            colorStops: [
                                { offset: 0, color },
                                { offset: 1, color: `${color}80` }
                            ]
                        }
                    },
                    emphasis: {
                        itemStyle: {
                            borderRadius: [6, 6, 6, 6],
                            color: {
                                type: "linear",
                                x: 1,
                                y: 0,
                                x2: 0,
                                y2: 0,
                                colorStops: [
                                    { offset: 0, color },
                                    { offset: 1, color: `${color}66` }
                                ]
                            }
                        }
                    },
                    animationDuration: 600
                }
            ]
        };
    }, [aggregated, color, formatValue, labels, values]);

    return {
        open,
        setOpen,
        option,
        handleClickBar,
        setOrder,
        orderState,
        handleRefresh
    };
};