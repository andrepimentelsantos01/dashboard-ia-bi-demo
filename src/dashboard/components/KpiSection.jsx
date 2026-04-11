import { Row } from "react-bootstrap";
import React, { useMemo } from "react";
import KpiCard from "./shared/kpiCard";
import "./KpiSection.css";

const normalizeKpiValue = (entry) => {
    if (!entry || typeof entry !== "object") {
        return {
            value: entry,
            variation: undefined
        };
    }

    const rawValue = "value" in entry ? entry.value : entry;

    if (rawValue && typeof rawValue === "object" && "value" in rawValue) {
        return {
            value: rawValue.value,
            variation: rawValue.variation ?? entry.variation
        };
    }

    return {
        value: rawValue,
        variation: entry.variation
    };
};

const KpiSection = ({ kpis }) => {
    const defaultKeys = ["valorTotalMovimentado", "valorEntregue", "volumeTotal", "quantidadeClientes"];

    const isDefault = defaultKeys.every(key => key in kpis);

    const kpiCards = useMemo(() => {
        if (isDefault) {
            return [
                {
                    label: "Valor Total Movimentado",
                    value: {
                        value: kpis.valorTotalMovimentado,
                        variation: kpis.variationValorTotalMovimentado
                    },
                    color: "#19b59f"
                },
                {
                    label: "Valor Entregue",
                    value: {
                        value: kpis.valorEntregue,
                        variation: kpis.variationValorEntregue
                    },
                    color: "#27ae60"
                },
                {
                    label: "Volume de Produtos Movimentados",
                    value: {
                        value: kpis.volumeTotal,
                        variation: kpis.variationVolumeTotal
                    },
                    color: "#9b51e0"
                },
                {
                    label: "Quantidade de Clientes",
                    value: {
                        value: kpis.quantidadeClientes,
                        variation: kpis.variationQuantidadeClientes
                    },
                    color: "#1abc9c"
                }
            ];
        }

        const blackList = ["percentualAtraso"];

        return Object.entries(kpis)
            .filter(([label]) => !blackList.includes(label))
            .map(([label, v]) => {
                const normalizedValue = normalizeKpiValue(v);

                return {
                    label,
                    value: normalizedValue,
                    color: "#19b59f"
                };
            });
    }, [kpis, isDefault]);

    return (
        <div className="kpi-section-wrapper">
            <Row className="kpi-grid-row">
                {kpiCards.map(({ label, value, color }) => (
                    <KpiCard
                        key={label}
                        label={label}
                        value={value.value}
                        variation={value.variation}
                        color={color}
                    />
                ))}
            </Row>
        </div>
    );
};

export default React.memo(KpiSection);
