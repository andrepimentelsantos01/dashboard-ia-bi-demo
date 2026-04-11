import { useState, useMemo, useCallback } from "react";
import { normalizeStatusLabel } from "../../../../selectors/shared/dashboardStatus";

const toNumber = (value) => {
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

const normalizeStatus = (value) => {
    if (value === null || value === undefined || value === "") return "Sem status";
    return normalizeStatusLabel(value, { fallback: "Desconhecido" });
};

export const useChartTreemapState = ({
    backendData,
    dataOverride,
    onCrossFilter
}) => {
    const [open, setOpen] = useState(false);
    const [last, setLast] = useState(null);

    const { grouped, data } = useMemo(() => {
        if (dataOverride) {
            return { grouped: null, data: dataOverride };
        }

        const source = backendData || [];
        const groupedRows = {};
        const resultMap = {};

        for (let index = 0; index < source.length; index += 1) {
            const item = source[index];
            const statusLabel = normalizeStatus(
                item.logistics_status || item.item_status || item.status
            );

            if (!groupedRows[statusLabel]) {
                groupedRows[statusLabel] = [];
                resultMap[statusLabel] = {
                    name: statusLabel,
                    statusKey: statusLabel,
                    value: 0,
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

            const group = resultMap[statusLabel];
            const valor = toNumber(item.valorTotal ?? item.total_amount);
            const quantidade = Number(
                item.quantidade || item.quantity_requested || item.sum_quantity || 0
            );

            groupedRows[statusLabel].push(item);
            group.value += 1;
            group.volume += quantidade;

            if (item.categoria) {
                group.categoriaValor[item.categoria] =
                    (group.categoriaValor[item.categoria] || 0) + valor;
                group.categoriaQtd[item.categoria] =
                    (group.categoriaQtd[item.categoria] || 0) + quantidade;
            }

            if (item.fornecedor) {
                group.fornecedorValor[item.fornecedor] =
                    (group.fornecedorValor[item.fornecedor] || 0) + valor;
                group.fornecedorQtd[item.fornecedor] =
                    (group.fornecedorQtd[item.fornecedor] || 0) + quantidade;
            }

            if (item.produto) {
                group.produtoValor[item.produto] =
                    (group.produtoValor[item.produto] || 0) + valor;
                group.produtoQtd[item.produto] =
                    (group.produtoQtd[item.produto] || 0) + quantidade;
            }

            if (item.cliente) {
                group.clientes.add(item.cliente);
            }
        }

        const getTop = (map) => {
            let maxKey = "-";
            let maxValue = -Infinity;

            Object.keys(map).forEach((key) => {
                if (map[key] > maxValue) {
                    maxValue = map[key];
                    maxKey = key;
                }
            });

            return maxKey;
        };

        return {
            grouped: groupedRows,
            data: Object.values(resultMap).map((item) => ({
                name: item.name,
                statusKey: item.statusKey,
                value: item.value,
                volume: item.volume,
                categoriaLeaderValor: getTop(item.categoriaValor),
                categoriaLeaderQtd: getTop(item.categoriaQtd),
                fornecedorLeaderValor: getTop(item.fornecedorValor),
                fornecedorLeaderQtd: getTop(item.fornecedorQtd),
                produtoLeaderValor: getTop(item.produtoValor),
                produtoLeaderQtd: getTop(item.produtoQtd),
                clientesAtendidos: item.clientes.size
            }))
        };
    }, [backendData, dataOverride]);

    const handleClick = useCallback(
        (params) => {
            const dataPoint = params?.data;
            const currentKey = dataPoint?.name || dataPoint?.statusKey;

            if (!currentKey || !onCrossFilter) return;

            if (last === currentKey) {
                setLast(null);
                onCrossFilter({ type: "reset" });
                return;
            }

            setLast(currentKey);

            if (dataPoint?.filterPayload) {
                onCrossFilter(dataPoint.filterPayload);
                return;
            }

            onCrossFilter({
                type: "status",
                value: dataPoint?.statusKey?.trim()
            });
        },
        [last, onCrossFilter]
    );

    return {
        open,
        setOpen,
        grouped,
        data,
        handleClick
    };
};
