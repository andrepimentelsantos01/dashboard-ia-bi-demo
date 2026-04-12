import { Row } from "react-bootstrap";
import React, { useMemo } from "react";
import KpiCard from "./shared/kpiCard";
import DashboardAsyncState, { DashboardKpiSkeleton, DashboardSectionLoadingOverlay } from "./shared/DashboardAsyncState";
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

const KPI_LABELS_PT_BR = {
    "Total Sales": "Receita Total",
    "Operating Profit": "Lucro Operacional",
    "Average Operating Margin": "Margem Operacional Media",
    "Units Sold": "Unidades Vendidas",
    "Delivery Success Rate": "Taxa de Sucesso na Entrega"
};

const translateKpiLabel = (label) => KPI_LABELS_PT_BR[label] || label;

const KpiSection = ({ kpis = {}, isLoading, isRefreshing, error, onRetry }) => {
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
                    displayLabel: translateKpiLabel(label),
                    value: normalizedValue,
                    color: "#19b59f"
                };
            });
    }, [kpis, isDefault]);

    const hasCards = kpiCards.length > 0;

    if (isLoading) {
        return <DashboardKpiSkeleton />;
    }

    if (error && !hasCards) {
        return (
            <DashboardAsyncState
                variant="error"
                title="Nao foi possivel carregar os KPIs"
                description="O dashboard nao conseguiu montar os indicadores deste recorte. Tente novamente."
                onAction={onRetry}
            />
        );
    }

    if (!hasCards) {
        return null;
    }

    return (
        <div className={`kpi-section-wrapper ${isRefreshing ? "dashboard-section-loading" : ""}`}>
            {isRefreshing ? <DashboardSectionLoadingOverlay label="Atualizando indicadores..." /> : null}
            <Row className="kpi-grid-row">
                {kpiCards.map(({ label, displayLabel, value, color }) => (
                    <KpiCard
                        key={label}
                        label={label}
                        displayLabel={displayLabel || label}
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
