import { useMemo, useState, useCallback } from "react";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

export const formatNumber = (num) => Math.round(num).toLocaleString("pt-BR");

export const formatCurrencyFull = (value) =>
    (typeof value === "number" ? value : Number(value || 0)).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

export const formatCurrencyShort = (value) =>
    `R$ ${Number(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

export const naturalAsc = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base"
});

export const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;

    return (
        Number(
            value
                .toString()
                .replace(/\./g, "")
                .replace(",", ".")
                .replace(/[^\d.-]/g, "")
        ) || 0
    );
};

export const formatValue = (value, valueFormat) => {
    if (valueFormat === "percent") return `${value.toFixed(1)}%`;
    if (valueFormat === "number") return Math.round(value).toLocaleString("pt-BR");

    return `R$ ${Number(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const sortDesc = (record) =>
    Object.entries(record).sort((a, b) =>
        b[1] !== a[1] ? b[1] - a[1] : naturalAsc.compare(a[0], b[0])
    );

const formatLeader = (record) => sortDesc(record)[0]?.[0] || "-";

const resolveKey = (row, filterType) => {
    if (filterType === "produto") return row.produto;
    if (filterType === "categoria") return row.categoria;
    if (filterType === "fornecedor") return row.fornecedor;
    if (filterType === "cliente") return row.cliente;
    if (filterType === "status") return row.status;

    const date = new Date(row.data || row.dataCriacao || row.dataEntregaReal || row.dataEnvio);
    if (Number.isNaN(date.getTime())) return null;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const useBarVerticalAggregation = (backendData, filterType) =>
    useMemo(() => {
        const result = {};
        if (!backendData) return result;

        for (const row of backendData) {
            const key = resolveKey(row, filterType);
            if (!key) continue;

            const value = toNumber(row.valorTotal);
            const quantity = Number(row.quantidade) || 0;

            if (!result[key]) {
                result[key] = {
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

            const bucket = result[key];
            bucket.volume += quantity;

            if (row.categoria) {
                bucket.categoriaValor[row.categoria] = (bucket.categoriaValor[row.categoria] || 0) + value;
                bucket.categoriaQtd[row.categoria] = (bucket.categoriaQtd[row.categoria] || 0) + quantity;
            }

            if (row.fornecedor) {
                bucket.fornecedorValor[row.fornecedor] = (bucket.fornecedorValor[row.fornecedor] || 0) + value;
                bucket.fornecedorQtd[row.fornecedor] = (bucket.fornecedorQtd[row.fornecedor] || 0) + quantity;
            }

            if (row.produto) {
                bucket.produtoValor[row.produto] = (bucket.produtoValor[row.produto] || 0) + value;
                bucket.produtoQtd[row.produto] = (bucket.produtoQtd[row.produto] || 0) + quantity;
            }

            if (row.cliente) bucket.clientes.add(row.cliente);
        }

        return result;
    }, [backendData, filterType]);

const buildLeaderSet = (info) => ({
    categoriaValor: formatLeader(info.categoriaValor),
    categoriaQuantidade: formatLeader(info.categoriaQtd),
    fornecedorValor: formatLeader(info.fornecedorValor),
    fornecedorQuantidade: formatLeader(info.fornecedorQtd),
    produtoValor: formatLeader(info.produtoValor),
    produtoQuantidade: formatLeader(info.produtoQtd)
});

export const buildTooltip = ({ aggregated, valueFormat }) =>
    buildResponsiveTooltip((params) => {
        if (!params?.length) return "";

        const point = params[0];
        const data = point?.data;
        if (!data) return "";

        const key = point.axisValue || "";
        const info = aggregated[key];

        if (!info) {
            return `
                <b>${key}</b><br/>
                Valor: <b>${formatValue(data, valueFormat)}</b><br/><br/>
            `;
        }

        const leaders = buildLeaderSet(info);

        return `
            <b>${key}</b><br/>
            Valor: <b>${formatCurrencyFull(data)}</b><br/><br/>
            <b>Volume Movimentado:</b> ${info.volume.toLocaleString("pt-BR")}<br/><br/>
            <b>Categoria Líder (Valor):</b> ${leaders.categoriaValor}<br/>
            <b>Categoria Líder (Quantidade):</b> ${leaders.categoriaQuantidade}<br/><br/>
            <b>Fornecedor Líder (Valor):</b> ${leaders.fornecedorValor}<br/>
            <b>Fornecedor Líder (Quantidade):</b> ${leaders.fornecedorQuantidade}<br/><br/>
            <b>Produto Líder (Valor):</b> ${leaders.produtoValor}<br/>
            <b>Produto Líder (Quantidade):</b> ${leaders.produtoQuantidade}<br/><br/>
            <b>Clientes Atendidos:</b> ${info.clientes.size.toLocaleString("pt-BR")}<br/>
        `;
    }, {
        trigger: "axis",
        axisPointer: { type: "shadow" }
    });

const gradient = (color, opacity = "80") => ({
    type: "linear",
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
        { offset: 0, color },
        { offset: 1, color: `${color}${opacity}` }
    ]
});

export const buildBarVerticalOptions = ({
                                            labels,
                                            values,
                                            aggregated,
                                            color,
                                            valueFormat,
                                            showTrendLine
                                        }) => {
    const totalItems = labels.length;
    const manyItems = totalItems > 10;
    const visibleBars = 12;
    const zoomEnd = totalItems > visibleBars ? (visibleBars / totalItems) * 100 : 100;
    const barWidth = manyItems ? 33 : 45;
    const maxLabelLength = Math.max(...labels.map((label) => String(label || "").length), 0);
    const hasLongLabels = maxLabelLength > 12;
    const axisLabelWidth = manyItems ? 80 : 100;
    const gridBottom = hasLongLabels ? (manyItems ? 90 : 80) : (manyItems ? 65 : 50);

    const barSeries = {
        type: "bar",
        data: values,
        barWidth,
        label: {
            show: true,
            position: "top",
            color: "#171515",
            fontSize: 10,
            formatter: ({ value }) => formatValue(value, valueFormat)
        },
        itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: gradient(color, "80")
        },
        emphasis: {
            itemStyle: {
                borderRadius: [6, 6, 0, 0],
                color: gradient(color, "66")
            }
        },
        animationDuration: 600
    };

    const trendSeries = {
        type: "line",
        data: values,
        smooth: true,
        lineStyle: { width: 2, color },
        symbol: "circle",
        symbolSize: 6
    };

    return {
        tooltip: buildTooltip({ aggregated, valueFormat }),
        grid: {
            left: "6%",
            right: -80,
            top: "13%",
            bottom: gridBottom
        },
        xAxis: {
            type: "category",
            data: labels,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "rgba(0,0,0,0.35)" } },
            axisLabel: {
                color: "#4b5864",
                fontSize: 10,
                rotate: manyItems ? 40 : 0,
                margin: 10,
                width: axisLabelWidth,
                overflow: "break"
            }
        },
        yAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: {
                lineStyle: { color: "rgba(0,0,0,0.08)", type: "dashed" }
            },
            axisLabel: {
                color: "#4b5864",
                fontSize: 10,
                formatter: (value) => formatValue(value, valueFormat)
            }
        },
        dataZoom: [
            {
                type: "slider",
                xAxisIndex: 0,
                height: 10,
                bottom: 8,
                borderColor: "transparent",
                fillerColor: "rgba(0,136,212,0.15)",
                handleIcon: "path://M512 64L576 128 512 192 448 128z",
                handleSize: "80%",
                handleColor: color,
                start: 0,
                end: zoomEnd
            },
            {
                type: "inside",
                xAxisIndex: 0,
                zoomOnMouseWheel: false,
                moveOnMouseWheel: true,
                moveOnMouseMove: true,
                start: totalItems <= visibleBars ? 0 : ((totalItems - visibleBars) / totalItems) * 100,
                end: 100
            }
        ],
        series: showTrendLine ? [barSeries, trendSeries] : [barSeries]
    };
};

export const useChartBarVerticalState = ({
                                             labels,
                                             values,
                                             backendData,
                                             color = "#15334d",
                                             valueFormat = "currency",
                                             filterType = "mes",
                                             onCrossFilter,
                                             showTrendLine
                                         }) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [chartKey, setChartKey] = useState(0);

    const aggregated = useBarVerticalAggregation(backendData || [], filterType);

    const handleRefresh = useCallback(() => {
        setSelected(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const handleClickBar = useCallback((params) => {
        const name = params?.name;
        if (!name || !onCrossFilter) return;

        if (selected === name) {
            setSelected(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        setSelected(name);
        onCrossFilter({ type: filterType, value: name });
    }, [filterType, onCrossFilter, selected]);

    const option = useMemo(
        () => buildBarVerticalOptions({
            labels,
            values,
            aggregated,
            color,
            valueFormat,
            showTrendLine
        }),
        [aggregated, color, labels, showTrendLine, valueFormat, values]
    );

    return {
        open,
        setOpen,
        option,
        handleClickBar,
        handleRefresh,
        chartKey,
        setChartKey
    };
};