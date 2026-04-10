import { useState, useMemo, useCallback } from "react";
import { normalizeStatusLabel } from "../../../../selectors/shared/dashboardStatus";

const toNumber = (v) => {
    if (typeof v === "number") return v;
    if (!v) return 0;
    return (
        Number(
            v
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

export const useChartTreemapState = ({ backendData, dataOverride, onCrossFilter }) => {
    const [open, setOpen] = useState(false);
    const [last, setLast] = useState(null);

    const { grouped, data } = useMemo(() => {
        if (dataOverride) {
            return { grouped: null, data: dataOverride };
        }

        const source = backendData || [];
        const map = {};
        const resultMap = {};

        for (let i = 0; i < source.length; i++) {
            const item = source[i];
            const statusLabel = normalizeStatus(item.logistics_status || item.item_status || item.status);

            if (!map[statusLabel]) {
                map[statusLabel] = [];
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
            const qtd = Number(item.quantidade || item.quantity_requested || item.sum_quantity || 0);

            map[statusLabel].push(item);

            group.value += 1;
            group.volume += qtd;

            if (item.categoria) {
                group.categoriaValor[item.categoria] = (group.categoriaValor[item.categoria] || 0) + valor;
                group.categoriaQtd[item.categoria] = (group.categoriaQtd[item.categoria] || 0) + qtd;
            }

            if (item.fornecedor) {
                group.fornecedorValor[item.fornecedor] = (group.fornecedorValor[item.fornecedor] || 0) + valor;
                group.fornecedorQtd[item.fornecedor] = (group.fornecedorQtd[item.fornecedor] || 0) + qtd;
            }

            if (item.produto) {
                group.produtoValor[item.produto] = (group.produtoValor[item.produto] || 0) + valor;
                group.produtoQtd[item.produto] = (group.produtoQtd[item.produto] || 0) + qtd;
            }

            if (item.cliente) {
                group.clientes.add(item.cliente);
            }
        }

        const getTop = (obj) => {
            let maxKey = "—";
            let maxVal = -Infinity;

            for (const k in obj) {
                if (obj[k] > maxVal) {
                    maxVal = obj[k];
                    maxKey = k;
                }
            }

            return maxKey;
        };

        const data = Object.values(resultMap).map((g) => ({
            name: g.name,
            statusKey: g.statusKey,
            value: g.value,
            volume: g.volume,
            categoriaLeaderValor: getTop(g.categoriaValor),
            categoriaLeaderQtd: getTop(g.categoriaQtd),
            fornecedorLeaderValor: getTop(g.fornecedorValor),
            fornecedorLeaderQtd: getTop(g.fornecedorQtd),
            produtoLeaderValor: getTop(g.produtoValor),
            produtoLeaderQtd: getTop(g.produtoQtd),
            clientesAtendidos: g.clientes.size
        }));

        return { grouped: map, data };
    }, [backendData, dataOverride]);

    const handleClick = useCallback(
        (params) => {
            const name = params?.data?.name;
            const statusKey = params?.data?.statusKey;

            if (!name || !onCrossFilter) return;

            if (last === name) {
                setLast(null);
                onCrossFilter({ type: "reset" });
                return;
            }

            setLast(name);

            if (dataOverride) {
                if (name === "A" || name === "B" || name === "C") {
                    onCrossFilter({ type: "abc", value: name });
                    return;
                }
                if (name === "X" || name === "Y" || name === "Z") {
                    onCrossFilter({ type: "xyz", value: name });
                    return;
                }
            }

            onCrossFilter({
                type: "status",
                value: statusKey?.trim()
            });
        },
        [last, onCrossFilter, dataOverride]
    );

    return {
        open,
        setOpen,
        grouped,
        data,
        handleClick
    };
};
