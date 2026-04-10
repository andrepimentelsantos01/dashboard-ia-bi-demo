import { useState, useMemo, useCallback } from "react";
import * as echarts from "echarts";
import brasilMap from "/src/dashboard/mocks/brasil.geo.json";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

echarts.registerMap("brazil", brasilMap);

const formatCurrencyFull = (value) =>
    (typeof value === "number" ? value : Number(value || 0)).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

export const useChartMapState = ({ backendData, onCrossFilter }) => {
    const [open, setOpen] = useState(false);
    const [selectedUF, setSelectedUF] = useState(null);
    const [chartKey, setChartKey] = useState(0);

    const handleRefresh = useCallback(() => {
        setSelectedUF(null);
        if (onCrossFilter) onCrossFilter({ type: "reset" });
    }, [onCrossFilter]);

    const ufToName = useMemo(() => ({
        AC: "Acre",
        AL: "Alagoas",
        AP: "Amapá",
        AM: "Amazonas",
        BA: "Bahia",
        CE: "Ceará",
        DF: "Distrito Federal",
        ES: "Espírito Santo",
        GO: "Goiás",
        MA: "Maranhão",
        MT: "Mato Grosso",
        MS: "Mato Grosso do Sul",
        MG: "Minas Gerais",
        PA: "Pará",
        PB: "Paraíba",
        PR: "Paraná",
        PE: "Pernambuco",
        PI: "Piauí",
        RJ: "Rio de Janeiro",
        RN: "Rio Grande do Norte",
        RS: "Rio Grande do Sul",
        RO: "Rondônia",
        RR: "Roraima",
        SC: "Santa Catarina",
        SP: "São Paulo",
        SE: "Sergipe",
        TO: "Tocantins"
    }), []);

    const nameToUF = useMemo(() => {
        const map = {};
        Object.keys(ufToName).forEach((uf) => {
            map[ufToName[uf]] = uf;
        });
        return map;
    }, [ufToName]);

    const aggregated = useMemo(() => {
        const byUF = {};
        const totals = {};

        for (const row of backendData || []) {
            const sourceUf = row.client_state ?? row.uf;
            const uf = typeof sourceUf === "string" ? sourceUf.trim().toUpperCase() : null;
            if (!uf) continue;

            if (!byUF[uf]) {
                byUF[uf] = {
                    volume: 0,
                    categoriaValor: {},
                    categoriaQtd: {},
                    fornecedorValor: {},
                    fornecedorQtd: {},
                    produtoValor: {},
                    produtoQtd: {},
                    clientes: new Set(),
                    categoriaLeaderValor: "-",
                    categoriaLeaderQtd: "-",
                    fornecedorLeaderValor: "-",
                    fornecedorLeaderQtd: "-",
                    produtoLeaderValor: "-",
                    produtoLeaderQtd: "-"
                };
            }

            const bucket = byUF[uf];
            const value = typeof row.valorTotal === "number" ? row.valorTotal : Number(row.valorTotal) || 0;
            const quantity = typeof row.quantidade === "number" ? row.quantidade : Number(row.quantidade) || 0;
            totals[uf] = (totals[uf] || 0) + value;
            bucket.volume += quantity;

            const updateLeader = (valueMap, quantityMap, leaderValueKey, leaderQuantityKey, label) => {
                if (!label) return;
                valueMap[label] = (valueMap[label] || 0) + value;
                quantityMap[label] = (quantityMap[label] || 0) + quantity;
                if (valueMap[label] > (valueMap[bucket[leaderValueKey]] || -1)) bucket[leaderValueKey] = label;
                if (quantityMap[label] > (quantityMap[bucket[leaderQuantityKey]] || -1)) bucket[leaderQuantityKey] = label;
            };

            updateLeader(bucket.categoriaValor, bucket.categoriaQtd, "categoriaLeaderValor", "categoriaLeaderQtd", row.categoria);
            updateLeader(bucket.fornecedorValor, bucket.fornecedorQtd, "fornecedorLeaderValor", "fornecedorLeaderQtd", row.fornecedor);
            updateLeader(bucket.produtoValor, bucket.produtoQtd, "produtoLeaderValor", "produtoLeaderQtd", row.produto);

            if (row.cliente) bucket.clientes.add(row.cliente);
        }

        return { totals, byUF };
    }, [backendData]);

    const formattedData = useMemo(() => {
        const data = [];
        Object.keys(aggregated.totals).forEach((uf) => {
            if (ufToName[uf]) data.push({ name: ufToName[uf], value: aggregated.totals[uf] });
        });
        return data;
    }, [aggregated.totals, ufToName]);

    const maxValue = useMemo(
        () => formattedData.reduce((max, item) => (item.value > max ? item.value : max), 0),
        [formattedData]
    );

    const handleClickUF = useCallback((params) => {
        const name = params?.name;
        if (!name || !onCrossFilter) return;

        const uf = nameToUF[name];
        if (!uf) return;

        if (selectedUF === uf) {
            setSelectedUF(null);
            onCrossFilter({ type: "reset" });
            return;
        }

        setSelectedUF(uf);
        onCrossFilter({ type: "uf", value: uf });
    }, [nameToUF, onCrossFilter, selectedUF]);

    const option = useMemo(() => {
        const tooltipFormatter = (params) => {
            const name = params.name;
            const uf = nameToUF[name];
            const item = aggregated.byUF[uf];
            if (!item) return "";

            return `
                <b>${name}</b><br/>
                <b>Valor Movimentado:</b> ${formatCurrencyFull(params.value)}<br/>
                <b>Volume Movimentado:</b> ${item.volume}<br/><br/>
                <b>Categoria Líder (Valor):</b> ${item.categoriaLeaderValor}<br/>
                <b>Categoria Líder (Quantidade):</b> ${item.categoriaLeaderQtd}<br/><br/>
                <b>Fornecedor Líder (Valor):</b> ${item.fornecedorLeaderValor}<br/>
                <b>Fornecedor Líder (Quantidade):</b> ${item.fornecedorLeaderQtd}<br/><br/>
                <b>Produto Líder (Valor):</b> ${item.produtoLeaderValor}<br/>
                <b>Produto Líder (Quantidade):</b> ${item.produtoLeaderQtd}<br/><br/>
                <b>Clientes Atendidos:</b> ${item.clientes.size}<br/>
            `;
        };

        return {
            tooltip: buildResponsiveTooltip(tooltipFormatter),
            visualMap: {
                min: 0,
                max: maxValue > 0 ? maxValue : 100,
                left: 20,
                bottom: 20,
                text: ["Alto", "Baixo"],
                textStyle: { color: "#4b5563" },
                inRange: {
                    color: ["#dce6f4", "#8ba9c9", "#1c476e"]
                },
                formatter: (value) => formatCurrencyFull(value),
                calculable: false
            },
            series: [
                {
                    type: "map",
                    map: "brazil",
                    roam: true,
                    zoom: 1.2,
                    center: [-55, -15],
                    aspectScale: 1,
                    label: {
                        show: false
                    },
                    itemStyle: {
                        areaColor: "#e8eef5",
                        borderColor: "#c5ccd4",
                        borderWidth: 0.8
                    },
                    emphasis: {
                        label: { show: true, color: "#15334d" },
                        itemStyle: { areaColor: "#b9c8d8" }
                    },
                    data: formattedData
                }
            ]
        };
    }, [aggregated.byUF, formattedData, maxValue, nameToUF]);

    return {
        open,
        setOpen,
        option,
        handleClickUF,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
